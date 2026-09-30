import { mutationOptions } from "@tanstack/react-query";
import {
  loginUser,
  refreshAccessToken,
  registerUser,
  submitDriverApplication,
} from "@/lib/features/auth/api";
import type { DriverApplicationRequest } from "@/lib/features/auth/types";

export const registerUserMutationOptions = mutationOptions({
  mutationFn: registerUser,
});

export const loginUserMutationOptions = mutationOptions({
  mutationFn: loginUser,
});

export const refreshAccessTokenMutationOptions = mutationOptions({
  mutationFn: refreshAccessToken,
});

export function submitDriverApplicationMutationOptions(accessToken: string) {
  return mutationOptions({
    mutationFn: (input: DriverApplicationRequest) =>
      submitDriverApplication(input, accessToken),
  });
}
