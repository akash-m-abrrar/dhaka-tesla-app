"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toggleTheme } from "@/lib/features/theme/theme-slice";
import { Container } from "@/components/site/container";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "How it works", href: "#how-it-works" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.theme.mode);
  const isDark = theme === "dark";

  return (
    <Button
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      className="size-10 rounded-full border-border bg-background p-0"
      onClick={() => dispatch(toggleTheme())}
      type="button"
      variant="outline"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  );
}

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

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

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
          <Link
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            href="#get-started"
          >
            Log in
          </Link>
          <Link
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            href="#get-started"
          >
            Sign up
          </Link>
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
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <Link
                className="rounded-full border border-border px-4 py-3 text-center text-sm font-medium"
                href="#get-started"
                onClick={() => setMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                className="rounded-full bg-foreground px-4 py-3 text-center text-sm font-semibold text-background"
                href="#get-started"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
