import { Router } from "express";
import { zoneController } from "./zone.controller.js";

export const zoneRouter = Router();

zoneRouter.get("/", zoneController.getAll);
zoneRouter.get("/:id", zoneController.getById);
