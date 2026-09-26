import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { authService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

export const authController = {
    async register(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parseResult = registerSchema.safeParse(req.body);
            if (!parseResult.success) {
                const firstError = parseResult.error.issues[0];
                const errorMessage = firstError
                    ? `${firstError.path.join(".")}: ${firstError.message}`
                    : "Validation failed";
                throw new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR);
            }

            const user = await authService.register(parseResult.data);

            res.status(201).json({
                success: true,
                message: "Registration successful",
                data: {
                    user,
                },
            });
        } catch (error) {
            next(error);
        }
    },

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const parseResult = loginSchema.safeParse(req.body);
            if (!parseResult.success) {
                const firstError = parseResult.error.issues[0];
                const errorMessage = firstError
                    ? `${firstError.path.join(".")}: ${firstError.message}`
                    : "Validation failed";
                throw new AppError(errorMessage, 400, ERROR_CODES.VALIDATION_ERROR);
            }

            const user = await authService.login(parseResult.data);

            res.status(200).json({
                success: true,
                message: "Login successful",
                data: {
                    user,
                },
            });
        } catch (error) {
            next(error);
        }
    },
};
