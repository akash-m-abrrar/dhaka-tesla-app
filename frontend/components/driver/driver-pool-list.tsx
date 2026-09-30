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

  if (query.isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading pools…</p>;
  if (query.isError) return <section className="rounded-xl border border-border bg-card p-5" role="alert"><p className="text-sm">{query.error instanceof ApiError ? query.error.message : "Could not load pools."}</p><Button className="mt-4" onClick={() => void query.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button></section>;

  const activePools = query.data.filter(isActivePool);
  const completedPools = query.data.filter((pool) => pool.status === "COMPLETED");
  if (activePools.length === 0 && completedPools.length === 0) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">No active or completed pools</h2>
        <p className="mt-2 text-sm text-muted-foreground">New pools and completed trips will appear here.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background" href="/driver/ride-requests">View ride requests <ArrowRight aria-hidden="true" className="size-4" /></Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8">
      {activePools.length > 0 && <PoolGroup heading="Active pools" pools={activePools} />}
      {completedPools.length > 0 && <PoolGroup heading="Completed trips · payments" pools={completedPools} />}
    </div>
  );
}

function PoolGroup({ heading, pools }: { heading: string; pools: DriverPoolHistoryItem[] }) {
  return (
    <section aria-label={heading}>
      <h2 className="mb-3 text-lg font-semibold">{heading}</h2>
      <ul className="grid gap-3">
        {pools.map((pool) => (
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
    </section>
  );
}
