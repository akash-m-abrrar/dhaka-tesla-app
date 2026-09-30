import { apiRequest } from "@/lib/api/client";
import type {
  DriverApplicationRequest,
  LoginUserData,
  LoginUserRequest,
  RefreshAccessTokenData,
  RefreshAccessTokenRequest,
  RegisterUserData,
  RegisterUserRequest,
  User,
} from "@/lib/features/auth/types";

export function registerUser(
  input: RegisterUserRequest,
): Promise<RegisterUserData> {
  return apiRequest<RegisterUserData>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export function loginUser(input: LoginUserRequest): Promise<LoginUserData> {
  return apiRequest<LoginUserData>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export function refreshAccessToken(
  input: RefreshAccessTokenRequest,
): Promise<RefreshAccessTokenData> {
  return apiRequest<RefreshAccessTokenData>("/auth/refresh", {
    method: "POST",
    body: input,
  });
}

export function getCurrentUser(
  accessToken: string,
  signal?: AbortSignal,
): Promise<User> {
  return apiRequest<{ user: User }>("/auth/me", {
    accessToken,
    signal,
  }).then(({ user }) => user);
}

export function submitDriverApplication(
  input: DriverApplicationRequest,
  accessToken: string,
): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/auth/driver-application", {
    method: "POST",
    body: input,
    accessToken,
  });
}
