import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { assertOwnership } from "../../common/utils/ownership.js";
import { prisma } from "../../config/database.js";
import {
    PoolMemberStatus,
    PoolStatus,
    Prisma,
    RideHistoryEventType,
    RideRequestStatus,
    VehicleStatus,
} from "../../generated/prisma/client.js";
import type { AcceptRideRequestInput, CreatePoolInput } from "./pool.validation.js";

type LockedVehicle = {
    id: string;
    ownerId: string;
    capacity: number;
    status: VehicleStatus;
};

type LockedPool = {
    id: string;
    driverId: string;
    vehicleId: string;
    poolStatus: PoolStatus;
    vehicleOwnerId: string;
    vehicleStatus: VehicleStatus;
    capacity: number;
};

type Occupancy = { occupiedSeats: number };

const ACCEPTING_POOL_STATUSES: PoolStatus[] = [PoolStatus.REQUESTED, PoolStatus.MATCHED];
const ACTIVE_POOL_STATUSES: PoolStatus[] = [
    PoolStatus.REQUESTED,
    PoolStatus.MATCHED,
    PoolStatus.DRIVER_ARRIVED,
    PoolStatus.STARTED,
];

export const POOL_LIFECYCLE_TRANSITIONS = {
    arrive: {
        from: PoolStatus.MATCHED,
        to: PoolStatus.DRIVER_ARRIVED,
        eventType: RideHistoryEventType.DRIVER_ARRIVED,
    },
    start: {
        from: PoolStatus.DRIVER_ARRIVED,
        to: PoolStatus.STARTED,
        eventType: RideHistoryEventType.STARTED,
    },
    complete: {
        from: PoolStatus.STARTED,
        to: PoolStatus.COMPLETED,
        eventType: RideHistoryEventType.COMPLETED,
    },
} as const;

export type PoolLifecycleAction = keyof typeof POOL_LIFECYCLE_TRANSITIONS;

function isKnownPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError;
}

export const poolService = {
    /**
     * Locks the vehicle while checking ownership/availability, then creates an
     * empty pool and its REQUESTED timeline event atomically. This uses four
     * SQL statements in one transaction. Pool fare is accumulated from
     * individual request fares as members are accepted.
     */
    async create(driverId: string, input: CreatePoolInput) {
        try {
            return await prisma.$transaction(async (tx) => {
                const vehicles = await tx.$queryRaw<LockedVehicle[]>(Prisma.sql`
                    SELECT id::text AS id,
                           owner_id::text AS "ownerId",
                           capacity,
                           status
                    FROM vehicles
                    WHERE id = ${input.vehicleId}::uuid
                    FOR UPDATE
                `);
                const vehicle = vehicles[0];
                if (!vehicle) {
                    throw new AppError("Vehicle not found", 404, ERROR_CODES.NOT_FOUND);
                }

                assertOwnership(vehicle.ownerId, driverId);
                if (vehicle.status !== VehicleStatus.ONLINE) {
                    throw new AppError(
                        "Vehicle must be online to create a pool",
                        409,
                        ERROR_CODES.BUSINESS_RULE_ERROR,
                    );
                }

                // A vehicle can serve only one active shared ride at a time.
                // The vehicle row lock serializes concurrent pool creation.
                const activePool = await tx.pool.findFirst({
                    where: {
                        vehicleId: vehicle.id,
                        status: { in: ACTIVE_POOL_STATUSES },
                    },
                    select: { id: true },
                });
                if (activePool) {
                    throw new AppError(
                        "Vehicle already has an active pool",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                const pool = await tx.pool.create({
                    data: {
                        driverId,
                        vehicleId: vehicle.id,
                        estimatedFare: 0,
                    },
                    select: {
                        id: true,
                        vehicleId: true,
                        status: true,
                        createdAt: true,
                    },
                });

                await tx.rideHistory.create({
                    data: {
                        poolId: pool.id,
                        eventType: RideHistoryEventType.REQUESTED,
                    },
                });

                return pool;
            });
        } catch (error) {
            if (isKnownPrismaError(error) && error.code === "P2023") {
                throw new AppError("Vehicle not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw error;
        }
    },

    /**
     * Accept one PENDING request into a pool. The pool and vehicle rows are
     * locked before reading occupancy. PostgreSQL keeps those locks until the
     * interactive transaction commits or rolls back. Under PostgreSQL's
     * READ COMMITTED default, a contender that waited on the pool lock runs
     * the following aggregate in a fresh statement snapshot and sees the
     * previous acceptance. No retry loop is required for capacity conflicts.
     */
    async acceptRideRequest(
        driverId: string,
        poolId: string,
        input: AcceptRideRequestInput,
    ) {
        try {
            return await prisma.$transaction(async (tx) => {
                const pools = await tx.$queryRaw<LockedPool[]>(Prisma.sql`
                    SELECT p.id::text AS id,
                           p.driver_id::text AS "driverId",
                           p.vehicle_id::text AS "vehicleId",
                           p.status AS "poolStatus",
                           v.owner_id::text AS "vehicleOwnerId",
                           v.status AS "vehicleStatus",
                           v.capacity
                    FROM pools AS p
                    JOIN vehicles AS v ON v.id = p.vehicle_id
                    WHERE p.id = ${poolId}::uuid
                    FOR UPDATE OF p, v
                `);
                const pool = pools[0];
                if (!pool) {
                    throw new AppError("Pool not found", 404, ERROR_CODES.NOT_FOUND);
                }

                assertOwnership(pool.driverId, driverId);
                // Defensive consistency check against malformed legacy data.
                assertOwnership(pool.vehicleOwnerId, driverId);
                if (pool.vehicleStatus !== VehicleStatus.ONLINE) {
                    throw new AppError(
                        "Vehicle must be online to accept ride requests",
                        409,
                        ERROR_CODES.BUSINESS_RULE_ERROR,
                    );
                }
                if (!ACCEPTING_POOL_STATUSES.includes(pool.poolStatus)) {
                    throw new AppError(
                        "Pool is not accepting ride requests",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                const anotherActivePool = await tx.pool.findFirst({
                    where: {
                        vehicleId: pool.vehicleId,
                        id: { not: pool.id },
                        status: { in: ACTIVE_POOL_STATUSES },
                    },
                    select: { id: true },
                });
                if (anotherActivePool) {
                    throw new AppError(
                        "Vehicle already has another active pool",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                const rideRequest = await tx.rideRequest.findUnique({
                    where: { id: input.rideRequestId },
                    select: {
                        id: true,
                        passengerId: true,
                        requestedSeats: true,
                        estimatedFare: true,
                        status: true,
                    },
                });
                if (!rideRequest) {
                    throw new AppError("Ride request not found", 404, ERROR_CODES.NOT_FOUND);
                }
                if (rideRequest.status !== RideRequestStatus.PENDING) {
                    throw new AppError(
                        "Ride request is no longer pending",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                // Sum requestedSeats from linked RideRequests in PostgreSQL;
                // PoolMember has a starting seatNumber, not a seat-count field.
                const occupancyRows = await tx.$queryRaw<Occupancy[]>(Prisma.sql`
                    SELECT COALESCE(SUM(r.requested_seats), 0)::int AS "occupiedSeats"
                    FROM pool_members AS pm
                    JOIN ride_requests AS r ON r.id = pm.ride_request_id
                    WHERE pm.pool_id = ${pool.id}::uuid
                      AND pm.status <> ${PoolMemberStatus.CANCELLED}::"PoolMemberStatus"
                `);
                const occupiedSeats = occupancyRows[0]?.occupiedSeats ?? 0;
                if (occupiedSeats + rideRequest.requestedSeats > pool.capacity) {
                    throw new AppError(
                        "Vehicle capacity would be exceeded",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                // Claim eligibility with a conditional update. This also
                // serializes the same request being targeted through another pool.
                const claimed = await tx.rideRequest.updateMany({
                    where: {
                        id: rideRequest.id,
                        status: RideRequestStatus.PENDING,
                    },
                    data: { status: RideRequestStatus.ACCEPTED },
                });
                if (claimed.count !== 1) {
                    throw new AppError(
                        "Ride request is no longer pending",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }

                const member = await tx.poolMember.create({
                    data: {
                        poolId: pool.id,
                        rideRequestId: rideRequest.id,
                        passengerId: rideRequest.passengerId,
                        // Represents the first seat in this member's requested block.
                        seatNumber: occupiedSeats + 1,
                        fare: rideRequest.estimatedFare,
                    },
                    select: {
                        id: true,
                        poolId: true,
                        rideRequestId: true,
                        seatNumber: true,
                        status: true,
                    },
                });

                await tx.pool.update({
                    where: { id: pool.id },
                    data: {
                        status: PoolStatus.MATCHED,
                        estimatedFare: { increment: rideRequest.estimatedFare },
                    },
                });

                if (pool.poolStatus === PoolStatus.REQUESTED) {
                    await tx.rideHistory.create({
                        data: {
                            poolId: pool.id,
                            eventType: RideHistoryEventType.MATCHED,
                        },
                    });
                }

                return {
                    member,
                    occupancy: {
                        occupiedSeats: occupiedSeats + rideRequest.requestedSeats,
                        capacity: pool.capacity,
                    },
                };
            });
        } catch (error) {
            if (isKnownPrismaError(error)) {
                if (error.code === "P2002") {
                    throw new AppError(
                        "Ride request has already been accepted",
                        409,
                        ERROR_CODES.CONFLICT,
                    );
                }
                if (error.code === "P2023") {
                    throw new AppError("Pool or ride request not found", 404, ERROR_CODES.NOT_FOUND);
                }
            }
            throw error;
        }
    },

    async getById(driverId: string, poolId: string) {
        const poolHeader = await prisma.pool.findUnique({
            where: { id: poolId },
            select: { id: true, driverId: true },
        });
        if (!poolHeader) {
            throw new AppError("Pool not found", 404, ERROR_CODES.NOT_FOUND);
        }
        assertOwnership(poolHeader.driverId, driverId);

        const pool = await prisma.pool.findUnique({
            where: { id: poolId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                vehicle: {
                    select: {
                        id: true,
                        model: true,
                        capacity: true,
                        status: true,
                    },
                },
                members: {
                    where: { status: { not: PoolMemberStatus.CANCELLED } },
                    orderBy: { seatNumber: "asc" },
                    select: {
                        id: true,
                        seatNumber: true,
                        status: true,
                        passenger: { select: { name: true } },
                        rideRequest: {
                            select: {
                                id: true,
                                requestedSeats: true,
                                status: true,
                                pickupZone: { select: { name: true } },
                                destinationZone: { select: { name: true } },
                            },
                        },
                    },
                },
            },
        });
        if (!pool) {
            throw new AppError("Pool not found", 404, ERROR_CODES.NOT_FOUND);
        }

        const occupiedSeats = pool.members.reduce(
            (total, member) => total + member.rideRequest.requestedSeats,
            0,
        );
        return {
            ...pool,
            occupancy: {
                occupiedSeats,
                capacity: pool.vehicle.capacity,
            },
        };
    },

    /**
     * Apply one fixed operational transition. A conditional update on the
     * expected state makes concurrent/repeated actions single-winner; its
     * history row is committed in the same transaction as the pool update.
     * DB statements on success: ownership/state read, conditional update,
     * history insert. Application work and memory are O(1).
     */
    async transitionLifecycle(
        driverId: string,
        poolId: string,
        action: PoolLifecycleAction,
    ) {
        const transition = POOL_LIFECYCLE_TRANSITIONS[action];

        return prisma.$transaction(async (tx) => {
            const pool = await tx.pool.findUnique({
                where: { id: poolId },
                select: { id: true, driverId: true, status: true },
            });
            if (!pool) {
                throw new AppError("Pool not found", 404, ERROR_CODES.NOT_FOUND);
            }
            assertOwnership(pool.driverId, driverId);
            if (pool.status !== transition.from) {
                throw new AppError(
                    `Cannot ${action} pool while it is ${pool.status}`,
                    409,
                    ERROR_CODES.CONFLICT,
                );
            }

            const transitionTime = new Date();
            const result = await tx.pool.updateMany({
                where: {
                    id: pool.id,
                    driverId,
                    status: transition.from,
                },
                data: {
                    status: transition.to,
                    ...(action === "start" ? { startedAt: transitionTime } : {}),
                    ...(action === "complete" ? { completedAt: transitionTime } : {}),
                },
            });
            if (result.count !== 1) {
                throw new AppError(
                    "Pool state changed; refresh and try again",
                    409,
                    ERROR_CODES.CONFLICT,
                );
            }

            await tx.rideHistory.create({
                data: {
                    poolId: pool.id,
                    eventType: transition.eventType,
                },
            });

            return {
                poolId: pool.id,
                status: transition.to,
                occurredAt: transitionTime,
            };
        });
    },
};
