import type { RequestHandler } from "express";

import { ERROR_CODES } from "../errors/errorCodes.js";

export const notFoundMiddleware: RequestHandler = (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: ERROR_CODES.NOT_FOUND,
            message: `Route not found: ${req.method} ${req.originalUrl}`,
        },
    });
};