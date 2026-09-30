import { queryOptions } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/features/auth/api";

export const authQueryKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authQueryKeys.all, "me"] as const,
};

export function currentUserQueryOptions(accessToken: string | null) {
  return queryOptions({
    queryKey: authQueryKeys.currentUser(),
    enabled: Boolean(accessToken),
    retry: false,
    queryFn: ({ signal }) => {
      if (!accessToken) {
        throw new Error("An access token is required to fetch the current user.");
      }

      return getCurrentUser(accessToken, signal);
    },
  });
}
