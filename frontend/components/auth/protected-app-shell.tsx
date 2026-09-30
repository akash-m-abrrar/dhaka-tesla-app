"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/site/container";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { logout } from "@/lib/features/auth/session";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";
import type { UserRole } from "@/lib/features/auth/types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

const passengerFeatures = [
  "Request Ride",
  "My Requests",
  "Ride History",
  "Payments",
];

const driverFeatures = [
  "Vehicle",
  "Ride Requests",
  "Pools",
  "Ride History",
  "Payments",
];

function LoadingState({ message = "Checking your session…" }: { message?: string }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5">
      <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
        {message}
      </p>
    </main>
  );
}

function RoleNavigation({ role }: { role: UserRole }) {
  const features = role === "PASSENGER" ? passengerFeatures : driverFeatures;

  return (
    <nav aria-label="Application navigation" className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-5">
      <Link
        className="rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
        href="/dashboard"
      >
        Dashboard
      </Link>
      {features.map((feature) => (
        <span
          aria-disabled="true"
          className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground"
          key={feature}
        >
          {feature}
          <span className="text-[9px] font-semibold uppercase tracking-wider">Soon</span>
        </span>
      ))}
    </nav>
  );
}

function ProtectedHeader({
  name,
  role,
  onLogout,
}: {
  name: string;
  role: UserRole;
  onLogout: () => void;
}) {
  return (
    <header className="border-b border-border/70 bg-background">
      <Container className="flex min-h-[76px] flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3">
        <Link aria-label="Tesla Bullet home" className="inline-flex items-center gap-3" href="/">
          <span className="grid size-9 place-items-center rounded-xl bg-foreground text-sm font-bold tracking-[-0.08em] text-background">
            TB
          </span>
          <span className="text-sm font-semibold tracking-[0.12em]">TESLA BULLET</span>
        </Link>

        <div className="min-w-0 max-w-[96px] sm:max-w-40">
          <p className="max-w-40 truncate text-sm font-medium">{name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {role}
          </p>
        </div>

        <div className="hidden lg:block">
          <RoleNavigation role={role} />
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            aria-label="Log out"
            className="size-10 rounded-full border-border px-0 sm:w-auto sm:px-4"
            onClick={onLogout}
            type="button"
            variant="outline"
          >
            <LogOut aria-hidden="true" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Log out</span>
          </Button>

          <details className="relative lg:hidden">
            <summary className="flex h-10 cursor-pointer list-none items-center rounded-full border border-border px-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-12 z-30 min-w-56 rounded-2xl border border-border bg-background p-3 shadow-xl">
              <RoleNavigation role={role} />
            </div>
          </details>
        </div>
      </Container>
    </header>
  );
}

function getRedirectPath(pathname: string, role: UserRole): string | null {
  if (pathname === "/dashboard") {
    return role === "PASSENGER" ? "/passenger" : "/driver";
  }

  if (pathname === "/passenger" && role !== "PASSENGER") {
    return "/unauthorized";
  }

  if (pathname === "/driver" && role !== "DRIVER") {
    return "/unauthorized";
  }

  return null;
}

export function ProtectedAppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [logoutRequested, setLogoutRequested] = useState(false);
  const authStatus = useAppSelector((state) => state.auth.status);
  const currentUserQuery = useCurrentUserQuery();
  const currentUser = currentUserQuery.data;
  const redirectPath = currentUser
    ? getRedirectPath(pathname, currentUser.role)
    : null;

  useEffect(() => {
    if (authStatus === "unauthenticated" && !logoutRequested) {
      router.replace("/login");
      return;
    }

    if (authStatus === "authenticated" && redirectPath) {
      router.replace(redirectPath);
    }
  }, [authStatus, logoutRequested, redirectPath, router]);

  function handleLogout() {
    setLogoutRequested(true);
    logout(dispatch, queryClient);
    router.replace("/");
  }

  if (authStatus === "initializing") {
    return <LoadingState message="Restoring your session…" />;
  }

  if (authStatus === "unauthenticated") {
    return <LoadingState message="Taking you to sign in…" />;
  }

  if (currentUserQuery.isPending) {
    return <LoadingState message="Loading your account…" />;
  }

  if (currentUserQuery.isError) {
    return (
      <main className="grid min-h-[70vh] place-items-center px-5">
        <section className="max-w-md rounded-3xl border border-border bg-card p-7 text-center">
          <h1 className="text-lg font-semibold">We couldn’t load your account</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Check your connection and try again.
          </p>
          <Button
            className="mt-5 rounded-full px-5"
            onClick={() => void currentUserQuery.refetch()}
            type="button"
          >
            Try again
          </Button>
        </section>
      </main>
    );
  }

  if (!currentUser || redirectPath) {
    return <LoadingState message="Opening your workspace…" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedHeader
        name={currentUser.name}
        onLogout={handleLogout}
        role={currentUser.role}
      />
      {children}
    </div>
  );
}
