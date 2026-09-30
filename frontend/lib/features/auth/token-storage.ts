"use client";

const REFRESH_TOKEN_STORAGE_KEY = "tesla-bullet.refresh-token";

export function readPersistedRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function persistRefreshToken(refreshToken: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } catch {
    // Keep the session usable in memory if browser storage is unavailable.
  }
}

export function removePersistedRefreshToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    // The caller still clears the in-memory session if storage is unavailable.
  }
}
