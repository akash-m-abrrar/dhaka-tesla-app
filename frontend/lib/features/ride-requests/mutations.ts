import { mutationOptions } from "@tanstack/react-query";
import {
  cancelRideRequest,
  createRideRequest,
} from "@/lib/features/ride-requests/api";
import type { CreateRideRequestInput } from "@/lib/features/ride-requests/types";

export function createRideRequestMutationOptions(accessToken: string | null) {
  return mutationOptions({
    mutationFn: (input: CreateRideRequestInput) => {
      if (!accessToken) {
        throw new Error("An access token is required to create a ride request.");
      }

      return createRideRequest(input, accessToken);
    },
  });
}

export function cancelRideRequestMutationOptions(
  id: string,
  accessToken: string | null,
) {
  return mutationOptions({
    mutationFn: () => {
      if (!accessToken) {
        throw new Error("An access token is required to cancel this ride request.");
      }

      return cancelRideRequest(id, accessToken);
    },
  });
}
