import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/site/container";
import { ThemeToggle } from "@/components/site/theme-toggle";

interface AuthPageShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  footerLinkText: string;
  footerHref: string;
}

export function AuthPageShell({
  eyebrow,
  title,
  description,
  children,
  footerText,
  footerLinkText,
  footerHref,
}: AuthPageShellProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Container className="flex min-h-svh max-w-[1240px] flex-col py-6 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            aria-label="Tesla Bullet home"
            className="inline-flex items-center gap-3 rounded-md focus-visible:outline-none"
            href="/"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-foreground text-sm font-bold tracking-[-0.08em] text-background">
              TB
            </span>
            <span className="text-sm font-semibold tracking-[0.12em]">
              TESLA BULLET
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              Back to home
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <section className="w-full max-w-[470px]" aria-labelledby="auth-title">
            <div className="mb-7 space-y-3 text-center sm:mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1
                className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
                id="auth-title"
              >
                {title}
              </h1>
              <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground sm:text-base">
                {description}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-8">
              {children}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {footerText}{" "}
              <Link
                className="font-semibold text-foreground underline-offset-4 hover:underline"
                href={footerHref}
              >
                {footerLinkText}
              </Link>
            </p>
          </section>
        </main>

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Tesla Bullet
        </footer>
      </Container>
    </div>
  );
}
