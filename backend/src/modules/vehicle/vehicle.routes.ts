import { Router } from "express";
import { vehicleController } from "./vehicle.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { UserRole } from "../../generated/prisma/client.js";

export const vehicleRouter = Router();

// Only DRIVER role can create a vehicle
vehicleRouter.post("/", authMiddleware, requireRole(UserRole.DRIVER), vehicleController.create);

// Driver can retrieve all their vehicles
vehicleRouter.get("/", authMiddleware, requireRole(UserRole.DRIVER), vehicleController.getAll);

vehicleRouter.patch(
    "/:id/status",
    authMiddleware,
    requireRole(UserRole.DRIVER),
    vehicleController.updateStatus,
);

// Driver can retrieve their own vehicle by ID
vehicleRouter.get("/:id", authMiddleware, requireRole(UserRole.DRIVER), vehicleController.getById);
