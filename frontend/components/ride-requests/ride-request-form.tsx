"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, RotateCw } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateRideRequestMutation, useZonesQuery } from "@/lib/features/ride-requests/hooks";
import { formatFare } from "@/lib/features/ride-requests/format";
import { getRideRequestErrorMessage } from "@/lib/features/ride-requests/errors";
import {
  createRideRequestSchema,
  type CreateRideRequestFormValues,
} from "@/lib/features/ride-requests/schemas";

function FieldError({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-destructive" id={id}>
      {message}
    </p>
  );
}

export function RideRequestForm() {
  const zonesQuery = useZonesQuery();
  const mutation = useCreateRideRequestMutation();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<CreateRideRequestFormValues>({
    resolver: zodResolver(createRideRequestSchema),
    defaultValues: {
      pickupZoneId: "",
      destinationZoneId: "",
      requestedSeats: 1,
    },
  });
  const pickupZoneId = useWatch({ control, name: "pickupZoneId" });
  const destinationZoneId = useWatch({ control, name: "destinationZoneId" });

  async function onSubmit(values: CreateRideRequestFormValues) {
    mutation.reset();
    try {
      await mutation.mutateAsync(values);
    } catch {
      // The mutation state renders the server error below the form.
    }
  }

  if (zonesQuery.isPending) {
    return (
      <p aria-live="polite" className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground" role="status">
        Loading available zones…
      </p>
    );
  }

  if (zonesQuery.isError) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5" role="alert">
        <p className="text-sm font-medium">We couldn’t load the available zones.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button
          className="mt-4 rounded-full px-4"
          onClick={() => void zonesQuery.refetch()}
          type="button"
          variant="outline"
        >
          <RotateCw aria-hidden="true" /> Retry
        </Button>
      </section>
    );
  }

  if (!zonesQuery.data?.length) {
    return (
      <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        No pickup zones are available yet. Please check back later.
      </p>
    );
  }

  if (mutation.data) {
    return (
      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Request created
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
          Your ride request is in.
        </h2>
        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Status</dt>
            <dd className="mt-1 text-sm font-semibold">{mutation.data.status}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Requested seats</dt>
            <dd className="mt-1 text-sm font-semibold">{mutation.data.requestedSeats}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Estimated fare</dt>
            <dd className="mt-1 text-sm font-semibold">{formatFare(mutation.data.estimatedFare)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">Fare is calculated by the ride service and shown as a total for this request.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            href={`/passenger/requests/${mutation.data.id}`}
          >
            View request
          </Link>
          <Button className="rounded-full px-5" onClick={() => mutation.reset()} type="button" variant="outline">
            Create another
          </Button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-8"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="pickup-zone">Pickup zone</label>
          <select
            aria-describedby={errors.pickupZoneId ? "pickup-zone-error" : undefined}
            aria-invalid={Boolean(errors.pickupZoneId)}
            className="mt-2 flex h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
            id="pickup-zone"
            {...register("pickupZoneId")}
          >
            <option value="">Choose pickup</option>
            {zonesQuery.data.map((zone) => (
              <option disabled={zone.id === destinationZoneId} key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
          <FieldError id="pickup-zone-error" message={errors.pickupZoneId?.message} />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="destination-zone">Destination zone</label>
          <select
            aria-describedby={errors.destinationZoneId ? "destination-zone-error" : undefined}
            aria-invalid={Boolean(errors.destinationZoneId)}
            className="mt-2 flex h-12 w-full rounded-xl border border-input bg-background px-4 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20"
            id="destination-zone"
            {...register("destinationZoneId")}
          >
            <option value="">Choose destination</option>
            {zonesQuery.data.map((zone) => (
              <option disabled={zone.id === pickupZoneId} key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
          <FieldError id="destination-zone-error" message={errors.destinationZoneId?.message} />
        </div>
      </div>

      <div className="max-w-xs">
        <label className="text-sm font-medium" htmlFor="requested-seats">Requested seats</label>
        <Input
          aria-describedby={errors.requestedSeats ? "requested-seats-error" : undefined}
          aria-invalid={Boolean(errors.requestedSeats)}
          className="mt-2"
          id="requested-seats"
          min={1}
          step={1}
          type="number"
          {...register("requestedSeats", { valueAsNumber: true })}
        />
        <FieldError id="requested-seats-error" message={errors.requestedSeats?.message} />
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        The backend calculates the estimated fare after you submit. No fare is predicted in this form.
      </p>

      {mutation.isError && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
          {getRideRequestErrorMessage(mutation.error, "create")}
        </p>
      )}

      <Button className="h-12 w-full rounded-full sm:w-auto sm:px-7" disabled={mutation.isPending} type="submit">
        {mutation.isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Sending request…
          </>
        ) : (
          "Create ride request"
        )}
      </Button>
    </form>
  );
}
