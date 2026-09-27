import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { Prisma } from "../../generated/prisma/client.js";
import type { CreateVehicleInput, UpdateVehicleStatusInput } from "./vehicle.validation.js";
import { assertOwnership } from "../../common/utils/ownership.js";

// Fixed capacity for Dhaka Tesla Pool MVP
const FIXED_VEHICLE_CAPACITY = 3;

export const vehicleService = {
    async create(userId: string, input: CreateVehicleInput) {
        try {
            const vehicle = await prisma.vehicle.create({
                data: {
                    ownerId: userId,
                    model: input.model,
                    plateNumber: input.plateNumber,
                    capacity: FIXED_VEHICLE_CAPACITY,
                }
            });
            return vehicle;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new AppError("A vehicle with this plate number already exists", 409, ERROR_CODES.CONFLICT);
            }
            throw error;
        }
    },

    async getById(id: string, userId: string) {
        try {
            const vehicle = await prisma.vehicle.findUnique({
                where: { id }
            });

            if (!vehicle) {
                throw new AppError("Vehicle not found", 404, ERROR_CODES.NOT_FOUND);
            }

            // Assert that the authenticated driver actually owns this vehicle
            assertOwnership(vehicle.ownerId, userId);

            return vehicle;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                throw new AppError("Vehicle not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw error;
        }
    },

    async getAllByOwnerId(userId: string) {
        const vehicles = await prisma.vehicle.findMany({
            where: { ownerId: userId }
        });
        return vehicles;
    },

    /**
     * Update availability only when the authenticated user owns the vehicle.
     * O(1) app work and one targeted database update; ownerId is part of the
     * database predicate so a foreign vehicle is never modified.
     */
    async updateStatus(id: string, userId: string, input: UpdateVehicleStatusInput) {
        try {
            return await prisma.vehicle.update({
                where: { id, ownerId: userId },
                data: { status: input.status },
                select: { id: true, status: true, updatedAt: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === "P2025" || error.code === "P2023")) {
                throw new AppError("Vehicle not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw error;
        }
    }
};
