import type { Request, Response, NextFunction } from "express";
import { vehicleService } from "./vehicle.service.js";
import { createVehicleSchema } from "./vehicle.validation.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";

export const vehicleController = {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const parseResult = createVehicleSchema.safeParse(req.body);
            if (!parseResult.success) {
                const firstError = parseResult.error.issues[0];
                const errorMessage = firstError
                    ? `${firstError.path.join(".")}: ${firstError.message}`
                    : "Validation failed";
                throw new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR);
            }

            const vehicle = await vehicleService.create(userId, parseResult.data);
            res.status(201).json({
                success: true,
                data: vehicle,
            });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }
            const vehicleId = req.params.id as string;
            const vehicle = await vehicleService.getById(vehicleId, userId);
            res.status(200).json({
                success: true,
                data: vehicle,
            });
        } catch (error) {
            next(error);
        }
    },

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }
            const vehicles = await vehicleService.getAllByOwnerId(userId);
            res.status(200).json({
                success: true,
                data: vehicles,
            });
        } catch (error) {
            next(error);
        }
    }
};
