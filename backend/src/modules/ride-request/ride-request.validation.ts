import { z } from "zod";

export const rideRequestIdSchema = z.string().uuid("Ride request ID must be a valid UUID");

export const createRideRequestSchema = z.object({
    // Both zone IDs must be UUIDs so malformed values are rejected before PostgreSQL.
    pickupZoneId: z
        .string()
        .trim()
        .uuid("Pickup zone ID must be a valid UUID"),

    destinationZoneId: z
        .string()
        .trim()
        .uuid("Destination zone ID must be a valid UUID"),

    // requestedSeats must be a positive integer (rejects decimals, negatives, zero)
    requestedSeats: z
        .int("Seats must be a whole number")
        .min(1, "At least 1 seat must be requested"),
}).strict();

export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>;
