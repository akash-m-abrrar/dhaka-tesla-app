import { z } from "zod";
import { VehicleStatus } from "../../generated/prisma/client.js";

export const createVehicleSchema = z.object({
    model: z
        .string()
        .trim()
        .min(1, "Vehicle model is required")
        .max(50, "Vehicle model must not exceed 50 characters"),

    plateNumber: z
        .string()
        .trim()
        .min(1, "Plate number is required")
        .max(20, "Plate number must not exceed 20 characters"),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleStatusSchema = z.object({
    status: z.enum(VehicleStatus),
}).strict();

export type UpdateVehicleStatusInput = z.infer<typeof updateVehicleStatusSchema>;
