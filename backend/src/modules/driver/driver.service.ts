import { prisma } from "../../config/database.js";
import { VehicleStatus, RideRequestStatus } from "../../generated/prisma/client.js";

export const driverService = {
    /**
     * No driver-zone assignment exists yet, so every PENDING request is
     * relevant to an online driver. Offline drivers receive an empty list.
     * DB work is two queries: check one owned online vehicle, then fetch only
     * pending requests with the minimal zone labels drivers need to decide.
     * PostgreSQL filters and orders requests; application work/memory is O(n)
     * in the returned result count. This is unpaginated for MVP scale.
     */
    async getRelevantRideRequests(driverId: string) {
        const onlineVehicle = await prisma.vehicle.findFirst({
            where: { ownerId: driverId, status: VehicleStatus.ONLINE },
            select: { id: true },
        });

        if (!onlineVehicle) return [];

        return prisma.rideRequest.findMany({
            where: { status: RideRequestStatus.PENDING },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                requestedSeats: true,
                createdAt: true,
                pickupZone: { select: { name: true } },
                destinationZone: { select: { name: true } },
            },
        });
    },

    /** Return this driver's pools and their members and shared event timelines. */
    async getRideHistory(driverId: string) {
        return prisma.pool.findMany({
            where: { driverId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                status: true,
                estimatedFare: true,
                actualFare: true,
                createdAt: true,
                updatedAt: true,
                startedAt: true,
                completedAt: true,
                vehicle: {
                    select: {
                        id: true,
                        model: true,
                        plateNumber: true,
                        capacity: true,
                    },
                },
                members: {
                    orderBy: { joinedAt: "asc" },
                    select: {
                        id: true,
                        passengerId: true,
                        seatNumber: true,
                        fare: true,
                        status: true,
                        joinedAt: true,
                        leftAt: true,
                        passenger: { select: { id: true, name: true } },
                        rideRequest: {
                            select: {
                                id: true,
                                requestedSeats: true,
                                estimatedFare: true,
                                status: true,
                                pickupZone: { select: { id: true, name: true } },
                                destinationZone: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
                history: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        eventType: true,
                        note: true,
                        createdAt: true,
                    },
                },
            },
        });
    },
};
