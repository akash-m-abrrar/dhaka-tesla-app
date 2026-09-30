"use client";

import type { QueryClient } from "@tanstack/react-query";
import { authQueryKeys } from "@/lib/features/auth/queries";
import {
  refreshTokenRestored,
  sessionCleared,
  sessionEstablished,
  sessionInitializationFinished,
  type SessionTokens,
} from "@/lib/features/auth/auth-slice";
import { refreshAccessToken } from "@/lib/features/auth/api";
import type { AppDispatch } from "@/lib/store";
import {
  persistRefreshToken,
  readPersistedRefreshToken,
  removePersistedRefreshToken,
} from "@/lib/features/auth/token-storage";

export async function bootstrapAuthSession(dispatch: AppDispatch): Promise<void> {
  const refreshToken = readPersistedRefreshToken();

  if (!refreshToken) {
    dispatch(sessionInitializationFinished());
    return;
  }

  dispatch(refreshTokenRestored(refreshToken));

  try {
    const { accessToken } = await refreshAccessToken({ refreshToken });
    dispatch(sessionEstablished({ accessToken, refreshToken }));
  } catch {
    removePersistedRefreshToken();
    dispatch(sessionCleared());
  }
}

export function startAuthenticatedSession(
  dispatch: AppDispatch,
  queryClient: QueryClient,
  tokens: SessionTokens,
): void {
  persistRefreshToken(tokens.refreshToken);
  dispatch(sessionEstablished(tokens));
  queryClient.removeQueries({ queryKey: authQueryKeys.currentUser() });
}

export function logout(
  dispatch: AppDispatch,
  queryClient: QueryClient,
): void {
  removePersistedRefreshToken();
  dispatch(sessionCleared());
  queryClient.removeQueries({ queryKey: authQueryKeys.currentUser() });
}
