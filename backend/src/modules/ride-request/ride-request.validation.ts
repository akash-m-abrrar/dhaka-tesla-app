import { z } from "zod";

export const createRideRequestSchema = z.object({
    // Both zone IDs must be valid non-empty strings (UUID format validated at DB level)
    pickupZoneId: z
        .string()
        .trim()
        .min(1, "Pickup zone ID is required"),

    destinationZoneId: z
        .string()
        .trim()
        .min(1, "Destination zone ID is required"),

    // requestedSeats must be a positive integer (rejects decimals, negatives, zero)
    requestedSeats: z
        .int("Seats must be a whole number")
        .min(1, "At least 1 seat must be requested"),
}).strict();

export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
