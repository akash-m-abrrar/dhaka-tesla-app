"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList, MapPin } from "lucide-react";
import { Container } from "@/components/site/container";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";

export default function PassengerPage() {
  const { data: user } = useCurrentUserQuery();

  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Passenger overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Plan your next trip around Dhaka with a simple ride request.
        </p>
      </section>

      <section aria-label="Passenger quick actions" className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
        <Link
          className="group flex min-h-44 flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
          href="/passenger/requests/new"
        >
          <span className="grid size-10 place-items-center rounded-lg bg-foreground text-background">
            <MapPin aria-hidden="true" className="size-5" />
          </span>
          <span className="mt-8 flex items-end justify-between gap-4">
            <span>
              <span className="block text-lg font-semibold">Request a ride</span>
              <span className="mt-1 block text-sm text-muted-foreground">Choose your pickup, destination, and seats.</span>
            </span>
            <ArrowUpRight aria-hidden="true" className="mb-1 size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          className="group flex min-h-44 flex-col justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
          href="/passenger/requests"
        >
          <span className="grid size-10 place-items-center rounded-lg border border-border">
            <ClipboardList aria-hidden="true" className="size-5" />
          </span>
          <span className="mt-8 flex items-end justify-between gap-4">
            <span>
              <span className="block text-lg font-semibold">My requests</span>
              <span className="mt-1 block text-sm text-muted-foreground">Review your requests and their latest status.</span>
            </span>
            <ArrowUpRight aria-hidden="true" className="mb-1 size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      <section aria-labelledby="recent-activity-title" className="mt-10 border-t border-border pt-7 sm:mt-14 sm:pt-9">
        <h2 className="text-lg font-semibold tracking-[-0.02em]" id="recent-activity-title">Recent activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">No recent rides yet.</p>
      </section>
    </Container>
  );
}
