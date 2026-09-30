"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rideRequestQueryKeys } from "@/lib/features/ride-requests/queries";
import { poolQueryKeys } from "@/lib/features/pools/queries";
import { useAppSelector } from "@/lib/hooks";
import { confirmCashPaymentMutationOptions, createPaymentMutationOptions } from "@/lib/features/payments/mutations";
import { myPaymentsQueryOptions, paymentQueryKeys, poolPaymentsQueryOptions } from "@/lib/features/payments/queries";
import type { CreatePaymentInput } from "@/lib/features/payments/types";

export function useMyPaymentsQuery(enabled = true) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(myPaymentsQueryOptions(accessToken, enabled));
}

export function usePoolPaymentsQuery(poolId: string, enabled = true) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(poolPaymentsQueryOptions(poolId, accessToken, enabled));
}

export function useCreatePaymentMutation(poolMemberId: string, input: CreatePaymentInput) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...createPaymentMutationOptions(poolMemberId, input, accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentQueryKeys.mine() }),
        queryClient.invalidateQueries({ queryKey: rideRequestQueryKeys.all }),
      ]);
    },
  });
}

export function useConfirmCashPaymentMutation(poolId: string) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...confirmCashPaymentMutationOptions(accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: paymentQueryKeys.pool(poolId) }),
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(poolId) }),
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.history() }),
      ]);
    },
  });
}
