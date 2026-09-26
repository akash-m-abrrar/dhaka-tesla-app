import express from "express";

import cors from "cors";

import helmet from "helmet";

import { errorHandler } from "./common/errors/errorHandler.js";
import { notFoundMiddleware } from "./common/middleware/notFound.middleware.js";

import { prisma } from "./config/database.js";

export const app = express();

app.use(helmet());

app.use(cors());

app.use(express.json());

app.get("/api/v1/health", async (_req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({
            success: true,
            message: "API is healthy",
            database: "DB is connected well!!!",
        });
    } catch (error) {
        next(error);
    }
});

// 404 handler — must come after all routes
app.use(notFoundMiddleware);

// Global error handler — must be the last middleware
app.use(errorHandler);