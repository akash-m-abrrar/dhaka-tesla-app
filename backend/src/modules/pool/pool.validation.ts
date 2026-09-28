import { z } from "zod";

export const poolIdSchema = z.string().uuid("Pool ID must be a valid UUID");

export const lifecycleActionBodySchema = z.object({}).strict();

export const cancelPoolSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(1, "Cancellation reason is required")
        .max(500, "Cancellation reason must not exceed 500 characters")
        .regex(/[\p{L}\p{N}]/u, "Cancellation reason must contain a letter or number"),
}).strict();

export const createPoolSchema = z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
}).strict();

export const acceptRideRequestSchema = z.object({
    rideRequestId: z.string().uuid("Ride request ID must be a valid UUID"),
}).strict();

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type AcceptRideRequestInput = z.infer<typeof acceptRideRequestSchema>;
