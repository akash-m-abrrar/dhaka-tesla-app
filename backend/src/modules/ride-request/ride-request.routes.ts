import { Router } from "express";
import { rideRequestController } from "./ride-request.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { UserRole } from "../../generated/prisma/client.js";

export const rideRequestRouter = Router();

// Only PASSENGER role can create or view ride requests
rideRequestRouter.post(
    "/",
    authMiddleware,
    requireRole(UserRole.PASSENGER),
    rideRequestController.create,
);

// Passenger retrieves all their own ride requests
rideRequestRouter.get(
    "/",
    authMiddleware,
    requireRole(UserRole.PASSENGER),
    rideRequestController.getAll,
);

// Passenger retrieves a single ride request by ID (ownership enforced in service)
rideRequestRouter.get(
    "/:id",
    authMiddleware,
    requireRole(UserRole.PASSENGER),
    rideRequestController.getById,
);

// Passenger cancels their own request.
rideRequestRouter.patch(
    "/:id/cancel",
    authMiddleware,
    requireRole(UserRole.PASSENGER),
    rideRequestController.cancel,
);
