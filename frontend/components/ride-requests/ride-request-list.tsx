"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePassengerRideRequestsQuery } from "@/lib/features/ride-requests/hooks";
import { formatFare } from "@/lib/features/ride-requests/format";

const createdAtFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function RideRequestList() {
  const requestsQuery = usePassengerRideRequestsQuery();

  if (requestsQuery.isPending) {
    return (
      <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading your requests…
      </p>
    );
  }

  if (requestsQuery.isError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5" role="alert">
        <p className="text-sm font-medium">We couldn’t load your ride requests.</p>
        <Button
          className="mt-4 rounded-full px-4"
          onClick={() => void requestsQuery.refetch()}
          type="button"
          variant="outline"
        >
          <RotateCw aria-hidden="true" /> Retry
        </Button>
      </section>
    );
  }

  if (!requestsQuery.data?.length) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">No ride requests yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your requests will appear here after you submit one.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
          href="/passenger/requests/new"
        >
          Request a ride <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    );
  }

  return (
    <ul className="grid gap-4">
      {requestsQuery.data.map((request) => {
        const fare = request.poolMember?.fare ?? request.estimatedFare;
        const fareLabel = request.poolMember ? "Member fare" : "Estimated fare";

        return (
          <li key={request.id}>
            <Link
              className="group block rounded-3xl border border-border bg-card p-5 transition-colors hover:border-foreground/30 sm:p-6"
              href={`/passenger/requests/${request.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    <time dateTime={request.createdAt}>
                      {createdAtFormatter.format(new Date(request.createdAt))}
                    </time>
                  </p>
                  <h2 className="mt-2 break-words text-lg font-semibold tracking-[-0.025em]">
                    {request.pickupZone.name} <span aria-hidden="true" className="text-muted-foreground">→</span>{" "}
                    {request.destinationZone.name}
                  </h2>
                </div>
                <span className="rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {request.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground">Seats</p>
                    <p className="mt-1 text-sm font-medium">{request.requestedSeats}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{fareLabel}</p>
                    <p className="mt-1 text-sm font-medium">{formatFare(fare)}</p>
                  </div>
                  {request.poolMember && (
                    <div>
                      <p className="text-xs text-muted-foreground">Pool</p>
                      <p className="mt-1 text-sm font-medium">{request.poolMember.pool.status}</p>
                    </div>
                  )}
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium">
                  View details
                  <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
