import { Router } from "express";
import { UserRole } from "../../generated/prisma/client.js";
import { authMiddleware } from "../auth/auth.middleware.js";
import { requireRole } from "../auth/role.middleware.js";
import { paymentController } from "./payment.controller.js";

export const paymentRouter = Router();

paymentRouter.use(authMiddleware);
paymentRouter.get("/my", requireRole(UserRole.PASSENGER), paymentController.getMine);
paymentRouter.post(
    "/pool-members/:poolMemberId",
    requireRole(UserRole.PASSENGER),
    paymentController.create,
);
paymentRouter.get("/pools/:poolId", requireRole(UserRole.DRIVER), paymentController.getPoolPayments);
paymentRouter.patch(
    "/:paymentId/confirm",
    requireRole(UserRole.DRIVER),
    paymentController.confirmCash,
);
