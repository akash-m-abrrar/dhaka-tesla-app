import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { Prisma } from "../../generated/prisma/client.js";
import { assertOwnership } from "../../common/utils/ownership.js";
import { calculateEstimatedFare } from "../../common/utils/fare.js";
import type { CreateRideRequestInput } from "./ride-request.validation.js";

type FareZone = { id: string; latitude: number | Prisma.Decimal; longitude: number | Prisma.Decimal };
type RideRequestCreateData = {
    passengerId: string;
    pickupZoneId: string;
    destinationZoneId: string;
    requestedSeats: number;
    estimatedFare: number;
};
export interface RideRequestCreateDependencies {
    findZones(ids: string[]): Promise<FareZone[]>;
    createRequest(data: RideRequestCreateData): Promise<unknown>;
}

const prismaCreateDependencies: RideRequestCreateDependencies = {
    findZones: (ids) => prisma.zone.findMany({
        where: { id: { in: ids } },
        select: { id: true, latitude: true, longitude: true },
    }),
    createRequest: (data) => prisma.rideRequest.create({
        data: { ...data },
    }),
};

export async function createRideRequest(
    passengerId: string,
    input: CreateRideRequestInput,
    dependencies: RideRequestCreateDependencies = prismaCreateDependencies,
) {
    const { pickupZoneId, destinationZoneId, requestedSeats } = input;

    if (pickupZoneId === destinationZoneId) {
        throw new AppError(
            "Pickup and destination zones must be different",
            400,
            ERROR_CODES.BUSINESS_RULE_ERROR,
        );
    }

    const foundZones = await dependencies.findZones([pickupZoneId, destinationZoneId]);
    if (foundZones.length !== 2) {
        const foundIds = new Set(foundZones.map((zone) => zone.id));
        if (!foundIds.has(pickupZoneId)) {
            throw new AppError("Pickup zone not found", 404, ERROR_CODES.NOT_FOUND);
        }
        throw new AppError("Destination zone not found", 404, ERROR_CODES.NOT_FOUND);
    }

    const pickupZone = foundZones.find((zone) => zone.id === pickupZoneId);
    const destinationZone = foundZones.find((zone) => zone.id === destinationZoneId);
    if (!pickupZone || !destinationZone) {
        throw new AppError("Ride zones could not be loaded", 404, ERROR_CODES.NOT_FOUND);
    }

    const estimatedFare = calculateEstimatedFare(
        { latitude: Number(pickupZone.latitude), longitude: Number(pickupZone.longitude) },
        { latitude: Number(destinationZone.latitude), longitude: Number(destinationZone.longitude) },
    );

    try {
        return await dependencies.createRequest({
            passengerId,
            pickupZoneId,
            destinationZoneId,
            requestedSeats,
            estimatedFare,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2023") {
            throw new AppError("Invalid zone ID format", 400, ERROR_CODES.VALIDATION_ERROR);
        }
        throw error;
    }
}

export const rideRequestService = {
    /**
     * Create a new RideRequest for the authenticated passenger.
     *
     * Complexity: O(1) application-level work.
     * DB queries: 2 — one indexed zone lookup with IN, one insert.
     *
     * Zone validation uses a single `findMany` with `id: { in: [...] }` so
     * both zones are checked in one round-trip instead of two.
     */
    async create(passengerId: string, input: CreateRideRequestInput) {
        return createRideRequest(passengerId, input);
    },

    /**
     * Return all ride requests owned by the authenticated passenger.
     *
     * Complexity: O(n) where n = number of this passenger's requests.
     * DB queries: 1 — filtered by passengerId (indexed).
     *
     * The passengerId index on ride_requests ensures the DB does not scan
     * the entire table. Application-side filtering is avoided entirely.
     *
     * Note: This list is intentionally unbounded for MVP scale. Pagination
     * should be introduced before production deployment when the table grows.
     */
    async getAllByPassenger(passengerId: string) {
        const rideRequests = await prisma.rideRequest.findMany({
            where: { passengerId },
            orderBy: { createdAt: "desc" },
        });

        return rideRequests;
    },

    /**
     * Return a single ride request by ID, enforcing passenger ownership.
     *
     * Complexity: O(1) application-level lookup.
     * DB queries: 1 — lookup by primary key (id), ownership checked in memory.
     *
     * assertOwnership throws 403 if the authenticated passenger does not own
     * the request. This follows the existing project security convention
     * (distinct 403 rather than security-obscuring 404 for ownership violations).
     */
    async getById(id: string, passengerId: string) {
        try {
            const rideRequest = await prisma.rideRequest.findUnique({
                where: { id },
            });

            if (!rideRequest) {
                throw new AppError("Ride request not found", 404, ERROR_CODES.NOT_FOUND);
            }

            assertOwnership(rideRequest.passengerId, passengerId);

            return rideRequest;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2023") {
                throw new AppError("Ride request not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw error;
        }
    },
};
