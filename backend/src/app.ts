import express from "express";

import cors from "cors";

import helmet from "helmet";

import { errorHandler } from "./common/errors/errorHandler.js";
import { notFoundMiddleware } from "./common/middleware/notFound.middleware.js";

import { prisma } from "./config/database.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { zoneRouter } from "./modules/zone/zone.routes.js";
import { vehicleRouter } from "./modules/vehicle/vehicle.routes.js";
import { rideRequestRouter } from "./modules/ride-request/ride-request.routes.js";
import { driverRouter } from "./modules/driver/driver.routes.js";
import { poolRouter } from "./modules/pool/pool.routes.js";
import { paymentRouter } from "./modules/payment/payment.routes.js";

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

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/zones", zoneRouter);
app.use("/api/v1/vehicles", vehicleRouter);
app.use("/api/v1/ride-requests", rideRequestRouter);
app.use("/api/v1/driver", driverRouter);
app.use("/api/v1/pools", poolRouter);
app.use("/api/v1/payments", paymentRouter);

// 404 handler — must come after all routes
app.use(notFoundMiddleware);

// Global error handler — must be the last middleware
app.use(errorHandler);
