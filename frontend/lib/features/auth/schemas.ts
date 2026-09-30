import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(100, "Email must be 100 characters or fewer.");

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(100, "Name must be 100 characters or fewer."),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .max(20, "Phone must be 20 characters or fewer.")
    .optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .max(255, "Password must be 255 characters or fewer."),
});

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(255, "Password must be 255 characters or fewer."),
});

export const driverApplicationFormSchema = z.object({
  licenseNumber: z
    .string()
    .trim()
    .min(1, "Enter your license number.")
    .max(50, "License number must be 50 characters or fewer."),
  vehicleModel: z
    .string()
    .trim()
    .min(1, "Enter your vehicle model.")
    .max(50, "Vehicle model must be 50 characters or fewer."),
  vehiclePlateNumber: z
    .string()
    .trim()
    .min(1, "Enter your vehicle plate number.")
    .max(20, "Vehicle plate number must be 20 characters or fewer."),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type DriverApplicationFormValues = z.infer<
  typeof driverApplicationFormSchema
>;
