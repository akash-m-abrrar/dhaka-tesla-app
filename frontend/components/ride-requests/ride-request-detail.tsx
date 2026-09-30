"use client";

import Link from "next/link";
import { ArrowLeft, LoaderCircle, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCancelRideRequestMutation, useRideRequestQuery, useZonesQuery } from "@/lib/features/ride-requests/hooks";
import { formatFare } from "@/lib/features/ride-requests/format";
import { getRideRequestErrorMessage } from "@/lib/features/ride-requests/errors";

const createdAtFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeZone: "UTC",
});

const cancellableStatuses = new Set(["PENDING", "MATCHED", "ACCEPTED"]);

export function RideRequestDetail({ id }: { id: string }) {
  const requestQuery = useRideRequestQuery(id);
  const zonesQuery = useZonesQuery();
  const cancelMutation = useCancelRideRequestMutation(id);

  if (requestQuery.isPending) {
    return (
      <p aria-live="polite" className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        Loading request details…
      </p>
    );
  }

  if (requestQuery.isError || !requestQuery.data) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5" role="alert">
        <p className="text-sm font-medium">We couldn’t load this ride request.</p>
        <p className="mt-1 text-sm text-muted-foreground">It may no longer be available.</p>
        <Button
          className="mt-4 rounded-full px-4"
          onClick={() => void requestQuery.refetch()}
          type="button"
          variant="outline"
        >
          <RotateCw aria-hidden="true" /> Retry
        </Button>
      </section>
    );
  }

  const request = requestQuery.data;
  const pickupName = zonesQuery.data?.find((zone) => zone.id === request.pickupZoneId)?.name;
  const destinationName = zonesQuery.data?.find((zone) => zone.id === request.destinationZoneId)?.name;
  const canCancel = cancellableStatuses.has(request.status);

  async function handleCancel() {
    cancelMutation.reset();
    try {
      await cancelMutation.mutateAsync();
      toast.success("Ride request cancelled");
    } catch {
      // The mutation state renders the server error below.
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 sm:p-8">
      <Link className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground" href="/passenger/requests">
        <ArrowLeft aria-hidden="true" className="size-4" /> My requests
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ride request</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
            {pickupName ?? request.pickupZoneId} <span aria-hidden="true" className="text-muted-foreground">→</span>{" "}
            {destinationName ?? request.destinationZoneId}
          </h1>
        </div>
        <span className="rounded-full border border-border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em]">
          {request.status}
        </span>
      </div>

      {zonesQuery.isError && (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Zone names are temporarily unavailable; showing the request’s zone IDs.
        </p>
      )}

      <dl className="mt-8 grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Requested seats</dt>
          <dd className="mt-1 text-sm font-medium">{request.requestedSeats}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Estimated fare · total request</dt>
          <dd className="mt-1 text-sm font-medium">{formatFare(request.estimatedFare)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Created</dt>
          <dd className="mt-1 text-sm font-medium">
            <time dateTime={request.createdAt}>
              {createdAtFormatter.format(new Date(request.createdAt))}
            </time>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Request ID</dt>
          <dd className="mt-1 break-all font-mono text-xs">{request.id}</dd>
        </div>
      </dl>

      {cancelMutation.isSuccess && (
        <p className="mt-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm" role="status">
          The backend confirmed cancellation. Current status: {cancelMutation.data.status}.
        </p>
      )}

      {cancelMutation.isError && (
        <p className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {getRideRequestErrorMessage(cancelMutation.error, "cancel")}
        </p>
      )}

      {canCancel && (
        <Button
          className="mt-7 rounded-full px-5"
          disabled={cancelMutation.isPending}
          onClick={handleCancel}
          type="button"
          variant="outline"
        >
          {cancelMutation.isPending ? (
            <>
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              Cancelling…
            </>
          ) : (
            "Cancel request"
          )}
        </Button>
      )}
    </section>
  );
}
