import { apiRequest } from "@/lib/api/client";
import type { CreateVehicleInput, UpdateVehicleStatusInput, Vehicle } from "@/lib/features/vehicles/types";

export function getMyVehicles(accessToken: string, signal?: AbortSignal) {
  return apiRequest<Vehicle[]>("/vehicles", { accessToken, signal });
}

export function createVehicle(input: CreateVehicleInput, accessToken: string) {
  return apiRequest<Vehicle>("/vehicles", { method: "POST", body: input, accessToken });
}

export function updateVehicleStatus(id: string, input: UpdateVehicleStatusInput, accessToken: string) {
  return apiRequest<Pick<Vehicle, "id" | "status" | "updatedAt">>(`/vehicles/${id}/status`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
}
