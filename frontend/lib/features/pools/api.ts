import { apiRequest } from "@/lib/api/client";
import type {
  AcceptRideRequestInput,
  AcceptRideRequestResult,
  DriverPoolHistoryItem,
  PoolDetail,
  PoolLifecycleAction,
  PoolLifecycleResult,
  PoolSummary,
} from "@/lib/features/pools/types";

export function createPool(vehicleId: string, accessToken: string) {
  return apiRequest<PoolSummary>("/pools", { method: "POST", body: { vehicleId }, accessToken });
}

export function acceptRideRequest(poolId: string, input: AcceptRideRequestInput, accessToken: string) {
  return apiRequest<AcceptRideRequestResult>(`/pools/${poolId}/members`, { method: "POST", body: input, accessToken });
}

export function getPoolDetail(poolId: string, accessToken: string, signal?: AbortSignal) {
  return apiRequest<PoolDetail>(`/pools/${poolId}`, { accessToken, signal });
}

export function getDriverPoolHistory(accessToken: string, signal?: AbortSignal) {
  return apiRequest<DriverPoolHistoryItem[]>("/driver/ride-history", { accessToken, signal });
}

export function transitionPool(poolId: string, action: PoolLifecycleAction, accessToken: string) {
  return apiRequest<PoolLifecycleResult>(`/pools/${poolId}/${action}`, { method: "PATCH", body: {}, accessToken });
}
