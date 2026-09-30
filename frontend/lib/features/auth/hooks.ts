"use client";

import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/lib/hooks";
import { currentUserQueryOptions } from "@/lib/features/auth/queries";

export function useCurrentUserQuery() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery(currentUserQueryOptions(accessToken));
}
