import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";
import { verifyAccessToken } from "../../common/utils/jwt.js";

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            throw new AppError("Missing authorization header", 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (!authHeader.startsWith("Bearer ")) {
            throw new AppError("Invalid authorization format", 401, ERROR_CODES.UNAUTHORIZED);
        }

        const token = authHeader.substring(7).trim();

        if (!token) {
            throw new AppError("Missing access token", 401, ERROR_CODES.UNAUTHORIZED);
        }

        let payload;
        try {
            payload = await verifyAccessToken(token);
        } catch (err) {
            throw new AppError("Invalid or expired access token", 401, ERROR_CODES.UNAUTHORIZED);
        }

        if (!payload.sub || !payload.role) {
            throw new AppError("Invalid token payload", 401, ERROR_CODES.UNAUTHORIZED);
        }

        req.user = {
            id: payload.sub,
            role: payload.role,
        };

        next();
    } catch (error) {
        next(error);
    }
}
