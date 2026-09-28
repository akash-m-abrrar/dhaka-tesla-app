import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { paymentService } from "./payment.service.js";
import { createPaymentSchema, paymentIdSchema, poolIdSchema, poolMemberIdSchema } from "./payment.validation.js";

function validationMessage(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): string {
    const firstError = error.issues[0];
    return firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Validation failed";
}

export const paymentController = {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            const memberId = poolMemberIdSchema.safeParse(req.params.poolMemberId);
            if (!memberId.success) {
                throw new AppError(validationMessage(memberId.error), 400, ERROR_CODES.VALIDATION_ERROR);
            }
            const parsed = createPaymentSchema.safeParse(req.body);
            if (!parsed.success) {
                throw new AppError(validationMessage(parsed.error), 400, ERROR_CODES.VALIDATION_ERROR);
            }
            const payment = await paymentService.createForPassenger(passengerId, memberId.data, parsed.data.method);
            res.status(201).json({ success: true, data: payment });
        } catch (error) {
            next(error);
        }
    },

    async confirmCash(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            const paymentId = paymentIdSchema.safeParse(req.params.paymentId);
            if (!paymentId.success) {
                throw new AppError(validationMessage(paymentId.error), 400, ERROR_CODES.VALIDATION_ERROR);
            }
            const payment = await paymentService.confirmCash(driverId, paymentId.data);
            res.status(200).json({ success: true, data: payment });
        } catch (error) {
            next(error);
        }
    },

    async getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const passengerId = req.user?.id;
            if (!passengerId) throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            const payments = await paymentService.getMyPayments(passengerId);
            res.status(200).json({ success: true, data: payments });
        } catch (error) {
            next(error);
        }
    },

    async getPoolPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            const poolId = poolIdSchema.safeParse(req.params.poolId);
            if (!poolId.success) {
                throw new AppError(validationMessage(poolId.error), 400, ERROR_CODES.VALIDATION_ERROR);
            }
            const payments = await paymentService.getPoolPayments(driverId, poolId.data);
            res.status(200).json({ success: true, data: payments });
        } catch (error) {
            next(error);
        }
    },
};
