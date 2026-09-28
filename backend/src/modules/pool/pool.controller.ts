import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { poolService, type PoolLifecycleAction } from "./pool.service.js";
import {
    acceptRideRequestSchema,
    cancelPoolSchema,
    createPoolSchema,
    lifecycleActionBodySchema,
    poolIdSchema,
} from "./pool.validation.js";

function validationMessage(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
    const firstError = error.issues[0];
    return firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Validation failed";
}

export const poolController = {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const parsed = createPoolSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new AppError(
                    validationMessage(parsed.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const pool = await poolService.create(driverId, parsed.data);
            res.status(201).json({ success: true, data: pool });
        } catch (error) {
            next(error);
        }
    },

    async acceptRideRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const poolId = poolIdSchema.safeParse(req.params.poolId);
            if (!poolId.success) {
                throw new AppError(
                    validationMessage(poolId.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const parsed = acceptRideRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new AppError(
                    validationMessage(parsed.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const result = await poolService.acceptRideRequest(
                driverId,
                poolId.data,
                parsed.data,
            );
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    async transitionLifecycle(
        req: Request,
        res: Response,
        next: NextFunction,
        action: PoolLifecycleAction,
    ): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const poolId = poolIdSchema.safeParse(req.params.poolId);
            if (!poolId.success) {
                throw new AppError(
                    validationMessage(poolId.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const parsedBody = lifecycleActionBodySchema.safeParse(req.body ?? {});
            if (!parsedBody.success) {
                throw new AppError(
                    validationMessage(parsedBody.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const result = await poolService.transitionLifecycle(driverId, poolId.data, action);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const poolId = poolIdSchema.safeParse(req.params.poolId);
            if (!poolId.success) {
                throw new AppError(
                    validationMessage(poolId.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const parsed = cancelPoolSchema.safeParse(req.body ?? {});
            if (!parsed.success) {
                throw new AppError(
                    validationMessage(parsed.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const result = await poolService.cancel(driverId, poolId.data, parsed.data.reason);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const poolId = poolIdSchema.safeParse(req.params.id);
            if (!poolId.success) {
                throw new AppError(
                    validationMessage(poolId.error),
                    400,
                    ERROR_CODES.VALIDATION_ERROR,
                );
            }

            const pool = await poolService.getById(driverId, poolId.data);
            res.status(200).json({ success: true, data: pool });
        } catch (error) {
            next(error);
        }
    },
};
