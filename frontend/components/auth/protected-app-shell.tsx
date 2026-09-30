"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AppSidebar } from "@/components/auth/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { logout } from "@/lib/features/auth/session";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";
import type { UserRole } from "@/lib/features/auth/types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

function LoadingState({ message }: { message: string }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5">
      <p aria-live="polite" className="text-sm text-muted-foreground" role="status">{message}</p>
    </main>
  );
}

function getRedirectPath(pathname: string, role: UserRole): string | null {
  if (pathname === "/dashboard") return role === "PASSENGER" ? "/passenger" : "/driver";

  if ((pathname === "/passenger" || pathname.startsWith("/passenger/")) && role !== "PASSENGER") {
    return "/unauthorized";
  }

  if ((pathname === "/driver" || pathname.startsWith("/driver/")) && role !== "DRIVER") {
    return "/unauthorized";
  }

  return null;
}

export function ProtectedAppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [logoutRequested, setLogoutRequested] = useState(false);
  const authStatus = useAppSelector((state) => state.auth.status);
  const currentUserQuery = useCurrentUserQuery();
  const currentUser = currentUserQuery.data;
  const redirectPath = currentUser ? getRedirectPath(pathname, currentUser.role) : null;

  useEffect(() => {
    if (authStatus === "unauthenticated" && !logoutRequested) {
      router.replace("/login");
      return;
    }
    if (authStatus === "authenticated" && redirectPath) router.replace(redirectPath);
  }, [authStatus, logoutRequested, redirectPath, router]);

  function handleLogout() {
    setLogoutRequested(true);
    logout(dispatch, queryClient);
    router.replace("/");
  }

  if (authStatus === "initializing") return <LoadingState message="Restoring your session…" />;
  if (authStatus === "unauthenticated") return <LoadingState message="Taking you to sign in…" />;
  if (currentUserQuery.isPending) return <LoadingState message="Loading your account…" />;

  if (currentUserQuery.isError) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-5">
        <section className="max-w-md rounded-2xl border border-border bg-card p-7 text-center">
          <h1 className="text-lg font-semibold">We couldn’t load your account</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Check your connection and try again.</p>
          <Button className="mt-5" onClick={() => void currentUserQuery.refetch()} type="button" variant="outline">
            Try again
          </Button>
        </section>
      </main>
    );
  }

  if (!currentUser || redirectPath) return <LoadingState message="Opening your workspace…" />;

  return (
    <SidebarProvider>
      <AppSidebar
        name={currentUser.name}
        onLogout={handleLogout}
        pathname={pathname}
        role={currentUser.role}
      />
      <div className="flex min-h-svh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
          <SidebarTrigger
            aria-label="Open navigation menu"
            className="size-11 rounded-lg border border-border hover:bg-muted"
          />
          <Link className="truncate text-xs font-semibold tracking-[0.16em]" href="/dashboard">
            TBTESLA BULLET
          </Link>
        </header>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SidebarProvider>
  );
}
