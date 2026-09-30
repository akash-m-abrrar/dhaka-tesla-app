"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { myVehiclesQueryOptions, vehicleQueryKeys } from "@/lib/features/vehicles/queries";
import { createVehicleMutationOptions, updateVehicleStatusMutationOptions } from "@/lib/features/vehicles/mutations";
import { driverRequestQueryKeys } from "@/lib/features/driver-ride-requests/queries";
import { useAppSelector } from "@/lib/hooks";

export function useMyVehiclesQuery() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(myVehiclesQueryOptions(accessToken));
}

export function useCreateVehicleMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...createVehicleMutationOptions(accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.my() });
    },
  });
}

export function useUpdateVehicleStatusMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  return useMutation({
    ...updateVehicleStatusMutationOptions(accessToken),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.my() }),
        queryClient.invalidateQueries({ queryKey: driverRequestQueryKeys.all }),
      ]);
    },
  });
}
