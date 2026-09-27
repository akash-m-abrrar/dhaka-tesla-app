import { prisma } from "../../config/database.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { Prisma } from "../../generated/prisma/client.js";

export const zoneService = {
    async getAll() {
        const zones = await prisma.zone.findMany({
            orderBy: { name: 'asc' }
        });
        return zones;
    },

    async getById(id: string) {
        try {
            const zone = await prisma.zone.findUnique({
                where: { id }
            });
            if (!zone) {
                throw new AppError("Zone not found", 404, ERROR_CODES.NOT_FOUND);
            }
            return zone;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2023') {
                throw new AppError("Zone not found", 404, ERROR_CODES.NOT_FOUND);
            }
            throw error;
        }
    }
};
