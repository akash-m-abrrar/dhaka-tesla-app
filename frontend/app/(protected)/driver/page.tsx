"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Container } from "@/components/site/container";
import { useCurrentUserQuery } from "@/lib/features/auth/hooks";
import { useDriverPoolHistoryQuery } from "@/lib/features/pools/hooks";
import type { DriverPoolHistoryItem } from "@/lib/features/pools/types";
import { useMyVehiclesQuery } from "@/lib/features/vehicles/hooks";

const activeStatuses = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"] as const;

function isActivePool(pool: DriverPoolHistoryItem) {
  return activeStatuses.includes(pool.status as (typeof activeStatuses)[number]);
}

export default function DriverPage() {
  const { data: user } = useCurrentUserQuery();
  const vehiclesQuery = useMyVehiclesQuery();
  const poolsQuery = useDriverPoolHistoryQuery();
  const vehicle = vehiclesQuery.data?.[0];
  const onlineVehicle = vehiclesQuery.data?.find((item) => item.status === "ONLINE");
  const activePool = poolsQuery.data?.find(isActivePool);

  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver overview</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">{user?.role ?? "DRIVER"}</p>
      </section>

      <section aria-label="Driver workspace" className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Vehicle</p>
          {vehiclesQuery.isPending ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading vehicle…</p>
          ) : vehiclesQuery.isError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">Could not load your vehicle status.</p>
          ) : vehicle ? (
            <>
              <h2 className="mt-3 font-semibold">{vehicle.model}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{vehicle.plateNumber} · {vehicle.status} · {vehicle.capacity} seats</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No vehicle registered yet.</p>
          )}
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/driver/vehicle">
            {onlineVehicle ? "Manage vehicle" : "Get online / manage vehicle"}<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Ride requests</p>
          <h2 className="mt-3 font-semibold">{onlineVehicle ? "Check pending requests" : "Set a vehicle online first"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pending passenger requests are available when you have an online vehicle.</p>
          <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/driver/ride-requests">
            View ride requests<ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </article>

        <article className="rounded-xl border border-border bg-card p-5 sm:col-span-2 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active pool</p>
          {poolsQuery.isPending ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading active pool…</p>
          ) : poolsQuery.isError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">Could not load your active pool.</p>
          ) : activePool ? (
            <>
              <h2 className="mt-3 font-semibold">{activePool.vehicle.model} · {activePool.status}</h2>
              <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/driver/pools/${activePool.id}`}>
                Open active pool<ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted-foreground">No active pool right now.</p>
              <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/driver/pools">
                View active pools<ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </>
          )}
        </article>
      </section>
    </Container>
  );
}
