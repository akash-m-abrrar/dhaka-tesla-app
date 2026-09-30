"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { formatFare } from "@/lib/features/ride-requests/format";
import { useDriverPoolHistoryQuery } from "@/lib/features/pools/hooks";
import type { DriverPoolHistoryItem } from "@/lib/features/pools/types";

const dateTimeFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function DriverRideHistory() {
  const query = useDriverPoolHistoryQuery();

  if (query.isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading ride history…
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
        <p className="mt-2 text-sm text-muted-foreground">Completed and other pool trips will appear here when available.</p>
      </section>
    );
  }

  return (
    <ol aria-label="Driver ride history" className="grid gap-4">
      {query.data.map((ride) => <RideHistoryCard key={ride.id} ride={ride} />)}
    </ol>
  );
}

function RideHistoryCard({ ride }: { ride: DriverPoolHistoryItem }) {
  const fareLabel = ride.actualFare === null ? "Estimated total" : "Actual total";
  const fare = ride.actualFare ?? ride.estimatedFare;

  return (
    <li className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <article>
        <header className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground"><time dateTime={ride.createdAt}>{formatDate(ride.createdAt)}</time></p>
            <h2 className="mt-1 break-words text-lg font-semibold">{ride.vehicle.model}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{ride.vehicle.plateNumber} · {ride.vehicle.capacity} seats</p>
          </div>
          <span className="w-fit rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">{ride.status.replaceAll("_", " ")}</span>
        </header>

        <dl className="grid grid-cols-2 gap-4 border-b border-border py-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">{fareLabel}</dt>
            <dd className="mt-1 text-sm font-semibold">{formatFare(fare)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pool status</dt>
            <dd className="mt-1 text-sm font-medium">{ride.status.replaceAll("_", " ")}</dd>
          </div>
          {ride.startedAt && <div><dt className="text-xs text-muted-foreground">Started</dt><dd className="mt-1 text-sm"><time dateTime={ride.startedAt}>{formatDate(ride.startedAt)}</time></dd></div>}
          {ride.completedAt && <div><dt className="text-xs text-muted-foreground">Completed</dt><dd className="mt-1 text-sm"><time dateTime={ride.completedAt}>{formatDate(ride.completedAt)}</time></dd></div>}
        </dl>

        <section aria-label="Passengers" className="pt-4">
          <h3 className="text-sm font-semibold">Passengers and routes</h3>
          {ride.members.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No passenger members in this pool.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {ride.members.map((member) => (
                <li className="rounded-xl border border-border p-4" key={member.id}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{member.passenger.name}</p>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{member.rideRequest.pickupZone.name} <span aria-hidden="true">→</span> {member.rideRequest.destinationZone.name}</p>
                    </div>
                    <span className="rounded-full border border-border px-2 py-1 text-[10px] font-semibold uppercase">{member.status}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Seat {member.seatNumber} · {member.rideRequest.requestedSeats} {member.rideRequest.requestedSeats === 1 ? "seat" : "seats"} requested</p>
                  <p className="mt-1 text-sm font-medium">{formatFare(member.fare)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {ride.history.length > 0 && (
          <details className="mt-4 border-t border-border pt-4">
            <summary className="min-h-10 cursor-pointer py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Trip timeline</summary>
            <ol className="mt-2 grid gap-2 pl-4">
              {ride.history.map((event) => (
                <li className="list-disc text-sm" key={event.id}>
                  <span className="font-medium">{event.eventType.replaceAll("_", " ")}</span>
                  <time className="ml-2 text-xs text-muted-foreground" dateTime={event.createdAt}>{formatDate(event.createdAt)}</time>
                  {event.note && <p className="mt-1 text-xs text-muted-foreground">{event.note}</p>}
                </li>
              ))}
            </ol>
          </details>
        )}
      </article>
    </li>
  );
}
