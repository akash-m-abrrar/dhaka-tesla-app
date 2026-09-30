"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { submitDriverApplicationMutationOptions } from "@/lib/features/auth/mutations";
import { useAppSelector } from "@/lib/hooks";
import { currentUserQueryOptions } from "@/lib/features/auth/queries";

export function useCurrentUserQuery() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useQuery(currentUserQueryOptions(accessToken));
}

export function useDriverApplicationMutation() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return useMutation(
    submitDriverApplicationMutationOptions(accessToken ?? ""),
  );
}
