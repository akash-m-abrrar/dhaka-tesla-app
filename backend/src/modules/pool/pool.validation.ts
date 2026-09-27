import { z } from "zod";

export const poolIdSchema = z.string().uuid("Pool ID must be a valid UUID");

export const createPoolSchema = z.object({
    vehicleId: z.string().uuid("Vehicle ID must be a valid UUID"),
}).strict();

export const acceptRideRequestSchema = z.object({
    rideRequestId: z.string().uuid("Ride request ID must be a valid UUID"),
}).strict();

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type AcceptRideRequestInput = z.infer<typeof acceptRideRequestSchema>;
