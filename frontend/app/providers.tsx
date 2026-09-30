"use client";

import { useState } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ThemeSync } from "@/components/site/theme-sync";
import { useAppSelector } from "@/lib/hooks";
import { makeStore } from "@/lib/store";

function ThemedToaster() {
  const theme = useAppSelector((state) => state.theme.mode);

  return <Toaster position="top-right" theme={theme} closeButton />;
}

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const [store] = useState(makeStore);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ReduxProvider store={store}>
      <ThemeSync />
      <QueryClientProvider client={queryClient}>
        {children}
        <ThemedToaster />
      </QueryClientProvider>
    </ReduxProvider>
  );
}
