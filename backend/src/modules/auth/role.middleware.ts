import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "../../generated/prisma/client.js";
import { AppError } from "../../common/errors/AppError.js";
import { ERROR_CODES } from "../../common/errors/errorCodes.js";

/**
 * Returns an Express middleware that enforces role-based access control.
 * Must be mounted AFTER `authMiddleware`, which populates `req.user`.
 *
 * Usage:
 *   router.post("/example", authMiddleware, requireRole(UserRole.DRIVER), controller.example);
 *   router.get("/example", authMiddleware, requireRole(UserRole.DRIVER, UserRole.PASSENGER), controller.example);
 */
export function requireRole(...allowedRoles: UserRole[]) {
    return function roleMiddleware(
        req: Request,
        _res: Response,
        next: NextFunction,
    ): void {
        if (!req.user) {
            next(new AppError("Authentication required", 401, ERROR_CODES.UNAUTHORIZED));
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            next(new AppError("Insufficient permissions", 403, ERROR_CODES.FORBIDDEN));
            return;
        }

        next();
    };
}
