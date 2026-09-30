"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  cancelRideRequestMutationOptions,
  createRideRequestMutationOptions,
} from "@/lib/features/ride-requests/mutations";
import {
  passengerRideRequestsQueryOptions,
  rideRequestQueryKeys,
  rideRequestQueryOptions,
  zonesQueryOptions,
} from "@/lib/features/ride-requests/queries";
import { useAppSelector } from "@/lib/hooks";

export function useZonesQuery() {
  return useQuery(zonesQueryOptions());
}

export function usePassengerRideRequestsQuery(enabled = true) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery(passengerRideRequestsQueryOptions(accessToken, enabled));
}

export function useRideRequestQuery(id: string) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery(rideRequestQueryOptions(id, accessToken));
}

export function useCreateRideRequestMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    ...createRideRequestMutationOptions(accessToken),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: rideRequestQueryKeys.passengerList(),
      }),
  });
}

export function useCancelRideRequestMutation(id: string) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();

  function invalidateAffectedRequests() {
    return Promise.all([
      queryClient.invalidateQueries({
        queryKey: rideRequestQueryKeys.detail(id),
      }),
      queryClient.invalidateQueries({
        queryKey: rideRequestQueryKeys.passengerList(),
      }),
    ]);
  }

  return useMutation({
    ...cancelRideRequestMutationOptions(id, accessToken),
    onSuccess: invalidateAffectedRequests,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        return invalidateAffectedRequests();
      }
    },
  });
}
