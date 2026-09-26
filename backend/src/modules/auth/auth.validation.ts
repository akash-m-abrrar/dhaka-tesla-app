import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Name is required")
        .max(100, "Name must not exceed 100 characters"),

    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(100, "Email must not exceed 100 characters"),

    phone: z
        .preprocess(
            (val) => (val === "" || val === null ? undefined : val),
            z
                .string()
                .trim()
                .max(20, "Phone must not exceed 20 characters")
                .optional(),
        ),

    password: z
        .string()
        .min(6, "Password must be at least 6 characters")
        .max(255, "Password must not exceed 255 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
        .max(100, "Email must not exceed 100 characters"),

    password: z
        .string()
        .min(1, "Password is required")
        .max(255, "Password must not exceed 255 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
    refreshToken: z
        .string()
        .trim()
        .min(1, "refreshToken cannot be empty"),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const driverApplicationSchema = z.object({
    licenseNumber: z
        .string()
        .trim()
        .min(1, "License number is required")
        .max(50, "License number must not exceed 50 characters"),

    vehicleModel: z
        .string()
        .trim()
        .min(1, "Vehicle model is required")
        .max(50, "Vehicle model must not exceed 50 characters"),

    vehiclePlateNumber: z
        .string()
        .trim()
        .min(1, "Vehicle plate number is required")
        .max(20, "Vehicle plate number must not exceed 20 characters"),
});

export type DriverApplicationInput = z.infer<typeof driverApplicationSchema>;
