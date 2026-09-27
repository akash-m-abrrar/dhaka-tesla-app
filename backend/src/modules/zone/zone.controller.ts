import type { Request, Response, NextFunction } from "express";
import { zoneService } from "./zone.service.js";

export const zoneController = {
    async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const zones = await zoneService.getAll();
            res.status(200).json({
                success: true,
                data: zones,
            });
        } catch (error) {
            next(error);
        }
    },

    async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const zoneId = req.params.id as string;
            const zone = await zoneService.getById(zoneId);
            res.status(200).json({
                success: true,
                data: zone,
            });
        } catch (error) {
            next(error);
        }
    }
};
