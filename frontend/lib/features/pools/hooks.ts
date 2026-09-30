"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptRideRequestMutationOptions, createPoolMutationOptions, transitionPoolMutationOptions } from "@/lib/features/pools/mutations";
import { driverPoolHistoryQueryOptions, poolDetailQueryOptions, poolQueryKeys } from "@/lib/features/pools/queries";
import { driverRequestQueryKeys } from "@/lib/features/driver-ride-requests/queries";
import { useAppSelector } from "@/lib/hooks";

export function useDriverPoolHistoryQuery() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(driverPoolHistoryQueryOptions(accessToken));
}

export function usePoolDetailQuery(poolId: string) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(poolDetailQueryOptions(poolId, accessToken));
}

export function useCreatePoolMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...createPoolMutationOptions(accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.history() }),
        queryClient.invalidateQueries({ queryKey: driverRequestQueryKeys.all }),
      ]);
    },
  });
}

export function useAcceptRideRequestMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...acceptRideRequestMutationOptions(accessToken),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(variables.poolId) }),
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.history() }),
        queryClient.invalidateQueries({ queryKey: driverRequestQueryKeys.all }),
      ]);
    },
  });
}

export function useTransitionPoolMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...transitionPoolMutationOptions(accessToken),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.detail(variables.poolId) }),
        queryClient.invalidateQueries({ queryKey: poolQueryKeys.history() }),
      ]);
    },
  });
}
