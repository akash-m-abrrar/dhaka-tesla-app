import { z } from "zod";
import { PaymentMethod } from "../../generated/prisma/client.js";

export const poolMemberIdSchema = z.string().uuid("Pool member ID must be a valid UUID");
export const paymentIdSchema = z.string().uuid("Payment ID must be a valid UUID");
export const poolIdSchema = z.string().uuid("Pool ID must be a valid UUID");

export const createPaymentSchema = z.object({
    method: z.enum(PaymentMethod),
}).strict();

