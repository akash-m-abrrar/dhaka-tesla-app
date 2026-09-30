import { mutationOptions } from "@tanstack/react-query";
import { createVehicle, updateVehicleStatus } from "@/lib/features/vehicles/api";
import type { CreateVehicleInput, UpdateVehicleStatusInput, Vehicle } from "@/lib/features/vehicles/types";

export function createVehicleMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: (input: CreateVehicleInput) => {
      if (!accessToken) throw new Error("Sign in again to create a vehicle.");
      return createVehicle(input, accessToken);
    },
  });
}

export function updateVehicleStatusMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: ({ id, status }: { id: string; status: UpdateVehicleStatusInput["status"] }) => {
      if (!accessToken) throw new Error("Sign in again to update vehicle status.");
      return updateVehicleStatus(id, { status }, accessToken);
    },
  });
}

export type CreateVehicleResult = Vehicle;
