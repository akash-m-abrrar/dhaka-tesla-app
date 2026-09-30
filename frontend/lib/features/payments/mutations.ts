import { createPayment, confirmCashPayment } from "@/lib/features/payments/api";
import type { CreatePaymentInput } from "@/lib/features/payments/types";

export function createPaymentMutationOptions(
  poolMemberId: string,
  input: CreatePaymentInput,
  accessToken: string | null,
) {
  return {
    mutationFn: () => {
      if (!accessToken) throw new Error("An access token is required to create a payment.");
      return createPayment(poolMemberId, input, accessToken);
    },
  };
}

export function confirmCashPaymentMutationOptions(accessToken: string | null) {
  return {
    mutationFn: (paymentId: string) => {
      if (!accessToken) throw new Error("An access token is required to confirm a payment.");
      return confirmCashPayment(paymentId, accessToken);
    },
  };
}
