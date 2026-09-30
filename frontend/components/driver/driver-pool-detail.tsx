"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle, RotateCw } from "lucide-react";
import { useState } from "react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useDriverRideRequestsQuery } from "@/lib/features/driver-ride-requests/hooks";
import { useAcceptRideRequestMutation, usePoolDetailQuery, useTransitionPoolMutation } from "@/lib/features/pools/hooks";
import type { PoolLifecycleAction, PoolStatus } from "@/lib/features/pools/types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function lifecycleAction(status: PoolStatus): { action: PoolLifecycleAction; label: string } | null {
  if (status === "MATCHED") return { action: "arrive", label: "Mark arrived" };
  if (status === "DRIVER_ARRIVED") return { action: "start", label: "Start trip" };
  if (status === "STARTED") return { action: "complete", label: "Complete trip" };
  return null;
}

export function DriverPoolDetail({ poolId }: { poolId: string }) {
  const poolQuery = usePoolDetailQuery(poolId);
  const requestsQuery = useDriverRideRequestsQuery();
  const acceptMutation = useAcceptRideRequestMutation();
  const transitionMutation = useTransitionPoolMutation();
  const [actionError, setActionError] = useState<string | null>(null);
  const action = poolQuery.data ? lifecycleAction(poolQuery.data.status) : null;
  const canAccept = poolQuery.data && (poolQuery.data.status === "REQUESTED" || poolQuery.data.status === "MATCHED");

  async function onAccept(rideRequestId: string) {
    setActionError(null);
    try {
      await acceptMutation.mutateAsync({ poolId, rideRequestId });
    } catch (error) {
      setActionError(errorMessage(error, "Could not add this request. Refresh the pool and try again."));
    }
  }

  async function onTransition() {
    if (!action) return;
    setActionError(null);
    try {
      await transitionMutation.mutateAsync({ poolId, action: action.action });
    } catch (error) {
      setActionError(errorMessage(error, "The pool state changed. Refresh and try again."));
    }
  }

  if (poolQuery.isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading pool…</p>;
  if (poolQuery.isError) return <section className="rounded-xl border border-border bg-card p-5" role="alert"><p className="text-sm">{errorMessage(poolQuery.error, "Could not load this pool.")}</p><Button className="mt-4" onClick={() => void poolQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button></section>;

  const pool = poolQuery.data;

  return (
    <div className="grid gap-6">
      <Link className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" href="/driver/pools"><ArrowLeft aria-hidden="true" className="size-4" />Active pools</Link>

      <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pool status</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{pool.status}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{pool.vehicle.model} · {pool.vehicle.status}</p>
          </div>
          {action && (
            <Button className="min-h-11 w-full sm:w-auto" disabled={transitionMutation.isPending} onClick={() => void onTransition()} type="button">
              {transitionMutation.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
              {transitionMutation.isPending ? "Updating pool…" : action.label}
            </Button>
          )}
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-sm font-medium">{pool.occupancy.occupiedSeats} / {pool.occupancy.capacity} seats occupied</p>
          <p className="mt-1 text-xs text-muted-foreground">Capacity and occupancy are reported by the backend.</p>
        </div>
      </section>

      {actionError && <p className="text-sm text-destructive" role="alert">{actionError}</p>}

      <section aria-labelledby="pool-members-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold" id="pool-members-title">Passengers</h2>
        {pool.members.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No passengers have joined this pool yet.</p>
        ) : (
          <ul className="mt-4 grid gap-3">
            {pool.members.map((member) => (
              <li className="rounded-lg border border-border p-4" key={member.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium">{member.passenger.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{member.rideRequest.pickupZone.name} <span aria-hidden="true">→</span> {member.rideRequest.destinationZone.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{member.rideRequest.requestedSeats} {member.rideRequest.requestedSeats === 1 ? "seat" : "seats"}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-[0.1em]">{member.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {canAccept && pool.vehicle.status === "ONLINE" && (
        <section aria-labelledby="pending-requests-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Available requests</p>
              <h2 className="mt-2 text-lg font-semibold" id="pending-requests-title">Add a passenger</h2>
            </div>
            <Button onClick={() => void requestsQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Refresh</Button>
          </div>
          {requestsQuery.isPending && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading requests…</p>}
          {requestsQuery.isError && <p className="mt-4 text-sm text-destructive" role="alert">{errorMessage(requestsQuery.error, "Could not load available requests.")}</p>}
          {!requestsQuery.isPending && !requestsQuery.isError && requestsQuery.data.length === 0 && <p className="mt-4 text-sm text-muted-foreground">No pending requests are available right now.</p>}
          {!requestsQuery.isPending && !requestsQuery.isError && requestsQuery.data.length > 0 && (
            <ul className="mt-4 grid gap-3">
              {requestsQuery.data.map((request) => (
                <li className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between" key={request.id}>
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-medium">{request.pickupZone.name} <span aria-hidden="true">→</span> {request.destinationZone.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{request.requestedSeats} {request.requestedSeats === 1 ? "seat" : "seats"} requested</p>
                  </div>
                  <Button className="min-h-11 w-full sm:w-auto" disabled={acceptMutation.isPending} onClick={() => void onAccept(request.id)} type="button">
                    {acceptMutation.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                    Add passenger
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {canAccept && pool.vehicle.status !== "ONLINE" && <p className="text-sm text-muted-foreground">Set this vehicle online to add passengers to the pool.</p>}
      {pool.status === "REQUESTED" && pool.members.length === 0 && <p className="text-sm text-muted-foreground">Add a pending ride request to match this pool before marking arrival.</p>}
      {pool.status === "COMPLETED" && <p className="text-sm text-muted-foreground">This trip is complete. No further lifecycle actions are available.</p>}
      {pool.status === "CANCELLED" && <p className="text-sm text-muted-foreground">This pool has been cancelled.</p>}
    </div>
  );
}
