import { apiRequest } from "@/lib/api/client";
import type { CreatePaymentInput, DriverPoolPayment, PassengerPayment, Payment } from "@/lib/features/payments/types";

export function getMyPayments(accessToken: string, signal?: AbortSignal) {
  return apiRequest<PassengerPayment[]>("/payments/my", { accessToken, signal });
}

export function createPayment(poolMemberId: string, input: CreatePaymentInput, accessToken: string) {
  return apiRequest<Payment>(`/payments/pool-members/${poolMemberId}`, {
    method: "POST",
    body: input,
    accessToken,
  });
}

export function getPoolPayments(poolId: string, accessToken: string, signal?: AbortSignal) {
  return apiRequest<DriverPoolPayment[]>(`/payments/pools/${poolId}`, { accessToken, signal });
}

export function confirmCashPayment(paymentId: string, accessToken: string) {
  return apiRequest<Payment>(`/payments/${paymentId}/confirm`, {
    method: "PATCH",
    accessToken,
  });
}
