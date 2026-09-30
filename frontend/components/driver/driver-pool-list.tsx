"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useDriverPoolHistoryQuery } from "@/lib/features/pools/hooks";
import type { DriverPoolHistoryItem } from "@/lib/features/pools/types";

const activeStatuses = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"] as const;

function isActivePool(pool: DriverPoolHistoryItem) {
  return activeStatuses.includes(pool.status as (typeof activeStatuses)[number]);
}

export function DriverPoolList() {
  const query = useDriverPoolHistoryQuery();

  if (query.isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading active pools…</p>;
  if (query.isError) return <section className="rounded-xl border border-border bg-card p-5" role="alert"><p className="text-sm">{query.error instanceof ApiError ? query.error.message : "Could not load active pools."}</p><Button className="mt-4" onClick={() => void query.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button></section>;

  const activePools = query.data.filter(isActivePool);
  if (activePools.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">No active pools</h2>
        <p className="mt-2 text-sm text-muted-foreground">Create a pool from your available ride requests when a vehicle is online.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background" href="/driver/ride-requests">View ride requests <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </section>
    );
  }

  return (
    <ul className="grid gap-3">
      {activePools.map((pool) => (
        <li key={pool.id}>
          <Link className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/driver/pools/${pool.id}`}>
            <span className="min-w-0">
              <span className="block truncate font-semibold">{pool.vehicle.model} <span className="font-normal text-muted-foreground">· {pool.status}</span></span>
              <span className="mt-1 block text-sm text-muted-foreground">{pool.vehicle.plateNumber}</span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
