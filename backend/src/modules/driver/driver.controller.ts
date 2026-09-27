import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { driverService } from "./driver.service.js";

export const driverController = {
    async getRelevantRideRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const driverId = req.user?.id;
            if (!driverId) {
                throw new AppError("Unauthorized access", 401, ERROR_CODES.UNAUTHORIZED);
            }

            const requests = await driverService.getRelevantRideRequests(driverId);
            res.status(200).json({ success: true, data: requests });
        } catch (error) {
            next(error);
        }
    },
};
