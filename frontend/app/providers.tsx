"use client";

import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthBootstrap } from "@/components/auth/auth-bootstrap";
import { ThemeSync } from "@/components/site/theme-sync";
import { configureApiAuth } from "@/lib/api/client";
import { accessTokenUpdated } from "@/lib/features/auth/auth-slice";
import { logout } from "@/lib/features/auth/session";
import { useAppSelector } from "@/lib/hooks";
import { makeStore } from "@/lib/store";

interface ProviderRuntime {
  store: ReturnType<typeof makeStore>;
  queryClient: QueryClient;
}

let clientRuntime: ProviderRuntime | undefined;

function createRuntime(): ProviderRuntime {
  return {
    store: makeStore(),
    queryClient: new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
        },
      },
    }),
  };
}

function getRuntime(): ProviderRuntime {
  if (typeof window === "undefined") {
    return createRuntime();
  }

  if (!clientRuntime) {
    const runtime = createRuntime();

    configureApiAuth({
      getSessionTokens: () => {
        const { accessToken, refreshToken } = runtime.store.getState().auth;
        return { accessToken, refreshToken };
      },
      updateAccessToken: (accessToken) => {
        runtime.store.dispatch(accessTokenUpdated(accessToken));
      },
      clearSession: () => {
        logout(runtime.store.dispatch, runtime.queryClient);
      },
    });

    clientRuntime = runtime;
  }

  return clientRuntime;
}

function ThemedToaster() {
  const theme = useAppSelector((state) => state.theme.mode);

  return <Toaster position="top-right" theme={theme} closeButton />;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [runtime] = useState(getRuntime);
  const { store, queryClient } = runtime;

  return (
    <ReduxProvider store={store}>
      <AuthBootstrap />
      <ThemeSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
