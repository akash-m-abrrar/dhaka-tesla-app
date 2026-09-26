import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce.number().int().positive().default(5000),

    HOST: z.string().default("0.0.0.0"),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),

    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
});

export const env = envSchema.parse(process.env);