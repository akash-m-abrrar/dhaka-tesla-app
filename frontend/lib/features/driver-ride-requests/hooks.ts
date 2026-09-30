"use client";

import { useQuery } from "@tanstack/react-query";
import { driverRideRequestsQueryOptions } from "@/lib/features/driver-ride-requests/queries";
import { useAppSelector } from "@/lib/hooks";

export function useDriverRideRequestsQuery() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  return useQuery(driverRideRequestsQueryOptions(accessToken));
}
