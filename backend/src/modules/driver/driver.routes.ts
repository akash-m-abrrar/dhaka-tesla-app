import { Router } from "express";
import { UserRole } from "../../generated/prisma/client.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { driverController } from "./driver.controller.js";

export const driverRouter: Router = Router();

driverRouter.get(
    "/ride-history",
    authMiddleware,
    requireRole(UserRole.DRIVER),
    driverController.getRideHistory,
);

driverRouter.get(
    "/ride-requests",
    authMiddleware,
    requireRole(UserRole.DRIVER),
    driverController.getRelevantRideRequests,
);
