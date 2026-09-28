import { Router } from "express";
import { UserRole } from "../../generated/prisma/client.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { poolController } from "./pool.controller.js";

export const poolRouter: Router = Router();

poolRouter.use(authMiddleware);
poolRouter.get(
    "/:poolId/history",
    requireRole(UserRole.DRIVER, UserRole.PASSENGER),
    poolController.getHistory,
);
poolRouter.use(requireRole(UserRole.DRIVER));
poolRouter.post("/", poolController.create);
poolRouter.post("/:poolId/members", poolController.acceptRideRequest);
poolRouter.patch("/:poolId/cancel", poolController.cancel);
poolRouter.patch("/:poolId/arrive", (req, res, next) =>
    poolController.transitionLifecycle(req, res, next, "arrive"),
);
poolRouter.patch("/:poolId/start", (req, res, next) =>
    poolController.transitionLifecycle(req, res, next, "start"),
);
poolRouter.patch("/:poolId/complete", (req, res, next) =>
    poolController.transitionLifecycle(req, res, next, "complete"),
);
poolRouter.get("/:id", poolController.getById);
