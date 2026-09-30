"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ClipboardList, LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { useDriverRideRequestsQuery } from "@/lib/features/driver-ride-requests/hooks";
import { useMyVehiclesQuery } from "@/lib/features/vehicles/hooks";
import { useAcceptRideRequestMutation, useCreatePoolMutation, useDriverPoolHistoryQuery } from "@/lib/features/pools/hooks";
import type { DriverPoolHistoryItem } from "@/lib/features/pools/types";

const activeStatuses = ["REQUESTED", "MATCHED", "DRIVER_ARRIVED", "STARTED"] as const;
const acceptingStatuses = ["REQUESTED", "MATCHED"] as const;

function isActivePool(pool: DriverPoolHistoryItem) {
  return activeStatuses.includes(pool.status as (typeof activeStatuses)[number]);
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function DriverRideRequests() {
  const router = useRouter();
  const requestsQuery = useDriverRideRequestsQuery();
  const vehiclesQuery = useMyVehiclesQuery();
  const poolHistoryQuery = useDriverPoolHistoryQuery();
  const createPoolMutation = useCreatePoolMutation();
  const acceptMutation = useAcceptRideRequestMutation();
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const onlineVehicles = (vehiclesQuery.data ?? []).filter((vehicle) => vehicle.status === "ONLINE");
  const activePools = (poolHistoryQuery.data ?? []).filter(isActivePool);
  const acceptingPools = activePools.filter((pool) => acceptingStatuses.includes(pool.status as (typeof acceptingStatuses)[number]));
  const eligibleVehicles = onlineVehicles.filter((vehicle) => !activePools.some((pool) => pool.vehicle.id === vehicle.id));
  const chosenVehicleId = selectedVehicleId || eligibleVehicles[0]?.id;
  const chosenPoolId = selectedPoolId || acceptingPools[0]?.id;

  async function onCreatePool() {
    if (!chosenVehicleId) return;
    setActionError(null);
    try {
      const pool = await createPoolMutation.mutateAsync(chosenVehicleId);
      router.push(`/driver/pools/${pool.id}`);
    } catch (error) {
      setActionError(errorMessage(error, "Could not create a pool. Refresh and try again."));
    }
  }

  async function onAccept(rideRequestId: string) {
    if (!chosenPoolId) return;
    setActionError(null);
    try {
      await acceptMutation.mutateAsync({ poolId: chosenPoolId, rideRequestId });
    } catch (error) {
      setActionError(errorMessage(error, "Could not add this request. Refresh the pool and try again."));
    }
  }

  return (
    <div className="grid gap-8">
      {poolHistoryQuery.isError && (
        <section className="rounded-xl border border-border bg-card p-5" role="alert">
          <p className="text-sm">{errorMessage(poolHistoryQuery.error, "Could not check active pools.")}</p>
          <Button className="mt-4" onClick={() => void poolHistoryQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button>
        </section>
      )}

      {activePools.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Active pool</p>
          <div className="mt-3 grid gap-3">
            {activePools.map((pool) => (
              <Link className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/driver/pools/${pool.id}`} key={pool.id}>
                <span>{pool.vehicle.model} <span className="font-normal text-muted-foreground">· {pool.status}</span></span>
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {vehiclesQuery.isError && (
        <section className="rounded-xl border border-border bg-card p-5" role="alert">
          <p className="text-sm">{errorMessage(vehiclesQuery.error, "Could not load your vehicles.")}</p>
          <Button className="mt-4" onClick={() => void vehiclesQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button>
        </section>
      )}

      {acceptingPools.length === 0 && eligibleVehicles.length > 0 && !poolHistoryQuery.isError && !poolHistoryQuery.isPending && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Pool setup</p>
          <h2 className="mt-2 text-lg font-semibold">Create a pool to receive passengers</h2>
          {eligibleVehicles.length > 1 && (
            <div className="mt-4 max-w-sm">
              <label className="mb-2 block text-sm font-medium" htmlFor="pool-vehicle">Online vehicle</label>
              <select className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" id="pool-vehicle" onChange={(event) => setSelectedVehicleId(event.target.value)} value={chosenVehicleId}>
                {eligibleVehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.model} · {vehicle.plateNumber}</option>)}
              </select>
            </div>
          )}
          <Button className="mt-5 min-h-11" disabled={createPoolMutation.isPending || !chosenVehicleId} onClick={() => void onCreatePool()} type="button">
            {createPoolMutation.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {createPoolMutation.isPending ? "Creating pool…" : "Create pool"}
          </Button>
        </section>
      )}

      {onlineVehicles.length === 0 && !vehiclesQuery.isPending && !vehiclesQuery.isError && (
        <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <h2 className="font-semibold">A vehicle must be online to receive requests</h2>
          <p className="mt-2 text-sm text-muted-foreground">Set one of your vehicles online before opening the request list.</p>
          <Link className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-foreground px-4 text-sm font-medium text-background" href="/driver/vehicle">Manage vehicle <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </section>
      )}

      {acceptingPools.length > 1 && (
        <div className="max-w-sm">
          <label className="mb-2 block text-sm font-medium" htmlFor="accept-pool">Add requests to pool</label>
          <select className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" id="accept-pool" onChange={(event) => setSelectedPoolId(event.target.value)} value={chosenPoolId}>
            {acceptingPools.map((pool) => <option key={pool.id} value={pool.id}>{pool.vehicle.model} · {pool.status}</option>)}
          </select>
        </div>
      )}

      <section aria-labelledby="driver-requests-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Driver · Requests</p>
            <h2 className="mt-2 text-xl font-semibold" id="driver-requests-title">Available ride requests</h2>
          </div>
          <Button onClick={() => void requestsQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Refresh</Button>
        </div>

        {requestsQuery.isPending && <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading available requests…</p>}
        {requestsQuery.isError && <div className="mt-5 rounded-xl border border-border bg-card p-5" role="alert"><p className="text-sm">{errorMessage(requestsQuery.error, "Could not load available requests.")}</p><Button className="mt-4" onClick={() => void requestsQuery.refetch()} type="button" variant="outline">Try again</Button></div>}

        {actionError && (acceptMutation.isError || createPoolMutation.isError) && <p className="mt-4 text-sm text-destructive" role="alert">{actionError}</p>}

        {!requestsQuery.isPending && !requestsQuery.isError && requestsQuery.data.length === 0 && (
          <div className="mt-5 rounded-xl border border-border bg-card p-6">
            <ClipboardList aria-hidden="true" className="size-5 text-muted-foreground" />
            <h3 className="mt-3 font-semibold">No pending ride requests</h3>
            <p className="mt-1 text-sm text-muted-foreground">New passenger requests will appear here while your vehicle is online.</p>
          </div>
        )}

        {!requestsQuery.isPending && !requestsQuery.isError && requestsQuery.data.length > 0 && (
          <ul className="mt-5 grid gap-3">
            {requestsQuery.data.map((request) => (
              <li className="rounded-xl border border-border bg-card p-5" key={request.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">{request.pickupZone.name} <span aria-hidden="true" className="text-muted-foreground">→</span> {request.destinationZone.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{request.requestedSeats} {request.requestedSeats === 1 ? "seat" : "seats"} requested</p>
                  </div>
                  {chosenPoolId ? (
                    <Button className="min-h-11 w-full sm:w-auto" disabled={acceptMutation.isPending} onClick={() => void onAccept(request.id)} type="button">
                      {acceptMutation.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                      Add to pool
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Create a pool to add this request.</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
