import { z } from "zod";

export const createVehicleSchema = z.object({
  model: z.string().trim().min(1, "Enter the vehicle model.").max(50, "Model must be 50 characters or fewer."),
  plateNumber: z.string().trim().min(1, "Enter the plate number.").max(20, "Plate number must be 20 characters or fewer."),
});
