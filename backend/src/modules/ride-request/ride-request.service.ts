import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { Prisma } from "../../generated/prisma/client.js";
import { assertOwnership } from "../../common/utils/ownership.js";
import type { CreateRideRequestInput } from "./ride-request.validation.js";

// Temporary fare placeholder (BDT 0) until the dedicated fare-calculation task.
// The schema requires a non-null Int. The final fare will be computed by a
// deterministic formula in a later task. This value must never be exposed
// to the client as a real fare amount.
const TEMPORARY_ESTIMATED_FARE = 0;

export const rideRequestService = {
    /**
     * Create a new RideRequest for the authenticated passenger.
     *
     * Complexity: O(1) application-level work.
     * DB queries: 2 — one zone validation (findMany with IN), one insert.
     *
     * Zone validation uses a single `findMany` with `id: { in: [...] }` so
     * both zones are checked in one round-trip instead of two.
     */
    async create(passengerId: string, input: CreateRideRequestInput) {
        const { pickupZoneId, destinationZoneId, requestedSeats } = input;

        // Business rule: pickup and destination must be different zones.
        // A same-zone trip is meaningless for the Dhaka pool MVP.
        if (pickupZoneId === destinationZoneId) {
            throw new AppError(
                "Pickup and destination zones must be different",
                400,
                ERROR_CODES.BUSINESS_RULE_ERROR,
            );
        }

        // Single query to validate both zones — avoids two separate round-trips.
        // We only select `id` since we only need to verify existence.
        const foundZones = await prisma.zone.findMany({
            where: { id: { in: [pickupZoneId, destinationZoneId] } },
            select: { id: true },
        });

        if (foundZones.length !== 2) {
            // Determine which zone is missing for a precise error message.
            const foundIds = new Set(foundZones.map((z) => z.id));
            if (!foundIds.has(pickupZoneId)) {
                throw new AppError("Pickup zone not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw new AppError("Destination zone not found", 404, ERROR_CODES.NOT_FOUND);
        }

        try {
            const rideRequest = await prisma.rideRequest.create({
                data: {
                    passengerId,
                    pickupZoneId,
                    destinationZoneId,
                    requestedSeats,
                    // Status defaults to PENDING via schema @default(PENDING).
                    // estimatedFare is temporarily set to 0; will be computed
                    // by the fare-calculation task.
                    estimatedFare: TEMPORARY_ESTIMATED_FARE,
                },
            });

            return rideRequest;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2023") {
                throw new AppError("Invalid zone ID format", 400, ERROR_CODES.VALIDATION_ERROR);
            }
            throw error;
        }
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
