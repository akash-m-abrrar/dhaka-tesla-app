import { Router } from "express";
import { UserRole } from "../../generated/prisma/client.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { poolController } from "./pool.controller.js";

export const poolRouter: Router = Router();

poolRouter.use(authMiddleware, requireRole(UserRole.DRIVER));
poolRouter.post("/", poolController.create);
poolRouter.post("/:poolId/members", poolController.acceptRideRequest);
poolRouter.get("/:id", poolController.getById);
