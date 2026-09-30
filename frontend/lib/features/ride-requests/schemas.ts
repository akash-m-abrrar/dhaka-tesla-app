import { z } from "zod";

export const createRideRequestSchema = z
  .object({
    pickupZoneId: z.string().trim().uuid("Choose a pickup zone."),
    destinationZoneId: z.string().trim().uuid("Choose a destination zone."),
    requestedSeats: z
      .number()
      .int("Enter a whole number of seats.")
      .min(1, "Request at least one seat."),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.pickupZoneId === value.destinationZoneId) {
      context.addIssue({
        code: "custom",
        path: ["destinationZoneId"],
        message: "Choose a different destination zone.",
      });
    }
  });

export type CreateRideRequestFormValues = z.infer<typeof createRideRequestSchema>;
