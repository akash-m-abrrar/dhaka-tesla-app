import { mutationOptions } from "@tanstack/react-query";
import { acceptRideRequest, createPool, transitionPool } from "@/lib/features/pools/api";
import type { AcceptRideRequestInput, PoolLifecycleAction } from "@/lib/features/pools/types";

export function createPoolMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: (vehicleId: string) => {
      if (!accessToken) throw new Error("Sign in again to create a pool.");
      return createPool(vehicleId, accessToken);
    },
  });
}

export function acceptRideRequestMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: ({ poolId, ...input }: AcceptRideRequestInput & { poolId: string }) => {
      if (!accessToken) throw new Error("Sign in again to add a passenger.");
      return acceptRideRequest(poolId, input, accessToken);
    },
  });
}

export function transitionPoolMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: ({ poolId, action }: { poolId: string; action: PoolLifecycleAction }) => {
      if (!accessToken) throw new Error("Sign in again to update the pool.");
      return transitionPool(poolId, action, accessToken);
    },
  });
}
