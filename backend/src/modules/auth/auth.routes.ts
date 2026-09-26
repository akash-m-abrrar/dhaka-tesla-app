import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";

export const authRouter: Router = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", authMiddleware, authController.me);
authRouter.post("/driver-application", authMiddleware, authController.driverApplication);
