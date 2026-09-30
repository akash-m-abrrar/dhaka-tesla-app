"use client";

import Link from "next/link";
import { ArrowRight, LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { formatFare } from "@/lib/features/ride-requests/format";
import { usePassengerRideRequestsQuery } from "@/lib/features/ride-requests/hooks";
import type { PassengerRideRequestHistory } from "@/lib/features/ride-requests/types";

const dateTimeFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function PassengerRideHistory() {
  const query = usePassengerRideRequestsQuery();

  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading your ride history…
      </p>
    );
  }

  if (query.isError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5" role="alert">
        <p className="text-sm">{query.error instanceof ApiError ? query.error.message : "Could not load your ride history."}</p>
        <Button className="mt-4" onClick={() => void query.refetch()} type="button" variant="outline">
          <RotateCw aria-hidden="true" />Try again
        </Button>
      </section>
    );
  }

  if (query.data.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-semibold">No rides in your history yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Your ride requests will appear here after you make one.</p>
        <Link className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background" href="/passenger/requests/new">
          Request a ride <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-4">
      {query.data.map((request) => <RideHistoryCard key={request.id} request={request} />)}
    </div>
  );
}

function RideHistoryCard({ request }: { request: PassengerRideRequestHistory }) {
  const fare = request.poolMember?.fare ?? request.estimatedFare;
  const fareLabel = request.poolMember ? "Member fare" : "Estimated fare";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground"><time dateTime={request.createdAt}>{formatDate(request.createdAt)}</time></p>
          <h2 className="mt-2 break-words text-lg font-semibold">
            {request.pickupZone.name} <span aria-hidden="true" className="text-muted-foreground">→</span> {request.destinationZone.name}
          </h2>
        </div>
        <span className="w-fit rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{request.status}</span>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Seats</dt>
          <dd className="mt-1 text-sm font-medium">{request.requestedSeats}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{fareLabel}</dt>
          <dd className="mt-1 text-sm font-medium">{formatFare(fare)}</dd>
        </div>
        {request.poolMember && (
          <>
            <div>
              <dt className="text-xs text-muted-foreground">Pool</dt>
              <dd className="mt-1 text-sm font-medium">{request.poolMember.pool.status.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Member</dt>
              <dd className="mt-1 text-sm font-medium">{request.poolMember.status}{request.poolMember.seatNumber ? ` · seat ${request.poolMember.seatNumber}` : ""}</dd>
            </div>
          </>
        )}
        {request.poolMember?.pool.startedAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Trip started</dt>
            <dd className="mt-1 text-sm"><time dateTime={request.poolMember.pool.startedAt}>{formatDate(request.poolMember.pool.startedAt)}</time></dd>
          </div>
        )}
        {request.poolMember?.pool.completedAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Trip completed</dt>
            <dd className="mt-1 text-sm"><time dateTime={request.poolMember.pool.completedAt}>{formatDate(request.poolMember.pool.completedAt)}</time></dd>
          </div>
        )}
        {request.poolMember?.leftAt && (
          <div>
            <dt className="text-xs text-muted-foreground">Membership ended</dt>
            <dd className="mt-1 text-sm"><time dateTime={request.poolMember.leftAt}>{formatDate(request.poolMember.leftAt)}</time></dd>
          </div>
        )}
        <div>
          <dt className="text-xs text-muted-foreground">Last updated</dt>
          <dd className="mt-1 text-sm"><time dateTime={request.updatedAt}>{formatDate(request.updatedAt)}</time></dd>
        </div>
      </dl>

      {request.poolMember?.pool.history.length ? (
        <details className="mt-4 border-t border-border pt-3">
          <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Trip timeline</summary>
          <ol className="mt-2 grid gap-2 pl-4">
            {request.poolMember.pool.history.map((event) => (
              <li className="list-disc text-sm" key={event.id}>
                <span className="font-medium">{event.eventType.replaceAll("_", " ")}</span>
                <time className="ml-2 text-xs text-muted-foreground" dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                {event.note && <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>}
              </li>
            ))}
          </ol>
        </details>
      ) : request.status === "CANCELLED" ? (
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">This request was cancelled. Last updated <time dateTime={request.updatedAt}>{formatDate(request.updatedAt)}</time>.</p>
      ) : null}

      <Link className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/passenger/requests/${request.id}`}>
        View request details <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}
