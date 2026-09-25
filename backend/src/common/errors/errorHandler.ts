import type { ErrorRequestHandler } from "express";

import { AppError } from "./AppError.js";
import { ERROR_CODES } from "./errorCodes.js";

export const errorHandler: ErrorRequestHandler = (
    err,
    _req,
    res,
    _next,
) => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });

        return;
    }

    console.error("Unhandled error:", err);

    res.status(500).json({
        success: false,
        error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: "Internal server error",
        },
    });
};