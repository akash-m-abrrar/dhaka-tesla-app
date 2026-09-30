"use client";

import { Container } from "@/components/site/container";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";

export default function DriverPage() {
  const { data: user } = useCurrentUserQuery();

  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Your driver workspace will appear here as your vehicle and ride tools become available.
        </p>
      </section>
      <section aria-label="Driver workspace status" className="mt-10 border-t border-border pt-7 sm:mt-14 sm:pt-9">
        <h2 className="text-lg font-semibold tracking-[-0.02em]">Your driver space</h2>
        <p className="mt-2 text-sm text-muted-foreground">Driver tools are not available yet.</p>
      </section>
    </Container>
  );
}
