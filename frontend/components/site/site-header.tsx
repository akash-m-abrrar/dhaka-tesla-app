"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/lib/features/auth/session";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";
import { Container } from "@/components/site/container";
import { ThemeToggle } from "@/components/site/theme-toggle";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {navigation.map((item) => (
        <Link
          className="rounded-md py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          href={item.href}
          key={item.href}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

interface AuthenticationActionsProps {
  authenticated: boolean;
  initializing: boolean;
  name?: string;
  mobile?: boolean;
  onLogout: () => void;
  onNavigate: () => void;
}

function AuthenticationActions({
  authenticated,
  initializing,
  name,
  mobile = false,
  onLogout,
  onNavigate,
}: AuthenticationActionsProps) {
  if (initializing) {
    return (
      <span
        aria-live="polite"
        className="text-sm text-muted-foreground"
        role="status"
      >
        Checking session…
      </span>
    );
  }

  if (authenticated) {
    return (
      <>
        <span className="max-w-40 truncate text-sm text-muted-foreground">
          {name ? `Hi, ${name}` : "Signed in"}
        </span>
        <Button
          className={mobile ? "w-full rounded-full" : "rounded-full"}
          onClick={onLogout}
          type="button"
          variant="outline"
        >
          Log out
        </Button>
      </>
    );
  }

  return (
    <>
      <Link
        className={
          mobile
            ? "rounded-full border border-border px-4 py-3 text-center text-sm font-medium"
            : "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
        }
        href="/login"
        onClick={onNavigate}
      >
        Log in
      </Link>
      <Link
        className={
          mobile
            ? "rounded-full bg-foreground px-4 py-3 text-center text-sm font-semibold text-background"
            : "rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
        }
        href="/register"
        onClick={onNavigate}
      >
        Sign up
      </Link>
    </>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const authStatus = useAppSelector((state) => state.auth.status);
  const { data: currentUser } = useCurrentUserQuery();
  const authenticated = authStatus === "authenticated";
  const initializing = authStatus === "initializing";

  function handleLogout() {
    logout(dispatch, queryClient);
    setMenuOpen(false);
    toast.success("You’re logged out");
    router.replace("/");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="relative z-20 border-b border-border/70 bg-background">
      <Container className="flex h-[76px] items-center justify-between gap-4">
        <Link
          aria-label="Tesla Bullet home"
          className="inline-flex items-center gap-3 rounded-md"
          href="#home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-foreground text-sm font-bold tracking-[-0.08em] text-background">
            TB
          </span>
          <span className="text-sm font-semibold tracking-[0.12em]">
            TESLA BULLET
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-8 md:flex">
          <NavigationLinks />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <AuthenticationActions
            authenticated={authenticated}
            initializing={initializing}
            name={currentUser?.name}
            onLogout={handleLogout}
            onNavigate={closeMenu}
          />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="size-10 rounded-full border-border bg-background p-0"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
            variant="outline"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </Container>

      {menuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="absolute inset-x-0 top-full border-b border-border bg-background px-5 py-5 shadow-lg md:hidden"
          id="mobile-navigation"
        >
          <div className="mx-auto flex max-w-[1240px] flex-col gap-1">
            <NavigationLinks onNavigate={() => setMenuOpen(false)} />
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-4">
              <AuthenticationActions
                authenticated={authenticated}
                initializing={initializing}
                name={currentUser?.name}
                mobile
                onLogout={handleLogout}
                onNavigate={closeMenu}
              />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
