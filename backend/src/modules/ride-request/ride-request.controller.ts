import type { Request, Response, NextFunction } from "express";
import { rideRequestService } from "./ride-request.service.js";
import { createRideRequestSchema, rideRequestIdSchema } from "./ride-request.validation.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";

export const rideRequestController = {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const parseResult = createRideRequestSchema.safeParse(req.body);
            if (!parseResult.success) {
                const firstError = parseResult.error.issues[0];
                const errorMessage = firstError
                    ? `${firstError.path.join(".")}: ${firstError.message}`
                    : "Validation failed";
                throw new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR);
            }

            const rideRequest = await rideRequestService.create(passengerId, parseResult.data);
            res.status(201).json({
                success: true,
                data: rideRequest,
            });
        } catch (error) {
            next(error);
        }
    },

    async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const rideRequests = await rideRequestService.getAllByPassenger(passengerId);
            res.status(200).json({
                success: true,
                data: rideRequests,
            });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const requestId = req.params.id as string;
            const rideRequest = await rideRequestService.getById(requestId, passengerId);
            res.status(200).json({
                success: true,
                data: rideRequest,
            });
        } catch (error) {
            next(error);
        }
    },

    async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const parsedId = rideRequestIdSchema.safeParse(req.params.id);
            if (!parsedId.success) {
                const firstError = parsedId.error.issues[0];
                const errorMessage = firstError
                    ? `${firstError.path.join(".")}: ${firstError.message}`
                    : "Validation failed";
                throw new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR);
            }

            const rideRequest = await rideRequestService.cancel(parsedId.data, passengerId);
            res.status(200).json({
                success: true,
                data: rideRequest,
            });
        } catch (error) {
            next(error);
        }
    },
};
