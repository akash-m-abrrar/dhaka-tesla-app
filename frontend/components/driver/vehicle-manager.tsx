"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CarFront, LoaderCircle, RotateCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateVehicleMutation, useMyVehiclesQuery, useUpdateVehicleStatusMutation } from "@/lib/features/vehicles/hooks";
import { createVehicleSchema } from "@/lib/features/vehicles/schemas";
import type { CreateVehicleInput } from "@/lib/features/vehicles/types";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function CreateVehicleForm() {
  const mutation = useCreateVehicleMutation();
  const [created, setCreated] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { model: "", plateNumber: "" },
  });

  async function onSubmit(values: CreateVehicleInput) {
    setCreated(false);
    try {
      await mutation.mutateAsync(values);
      reset({ model: "", plateNumber: "" });
      setCreated(true);
    } catch {
      // The mutation error below is shown to the driver.
    }
  }

  const pending = mutation.isPending || isSubmitting;

  return (
    <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="vehicle-model">Vehicle model</label>
        <Input
          aria-describedby={errors.model ? "vehicle-model-error" : undefined}
          aria-invalid={Boolean(errors.model)}
          autoComplete="off"
          id="vehicle-model"
          maxLength={50}
          placeholder="Tesla Model 3"
          {...register("model")}
        />
        {errors.model && <p className="mt-1.5 text-xs text-destructive" id="vehicle-model-error">{errors.model.message}</p>}
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium" htmlFor="vehicle-plate">Plate number</label>
        <Input
          aria-describedby={errors.plateNumber ? "vehicle-plate-error" : undefined}
          aria-invalid={Boolean(errors.plateNumber)}
          autoComplete="off"
          id="vehicle-plate"
          maxLength={20}
          placeholder="DHAKA METRO-GA-0000"
          {...register("plateNumber")}
        />
        {errors.plateNumber && <p className="mt-1.5 text-xs text-destructive" id="vehicle-plate-error">{errors.plateNumber.message}</p>}
      </div>
      {mutation.isError && <p className="text-sm text-destructive sm:col-span-2" role="alert">{errorMessage(mutation.error, "Could not create the vehicle. Try again.")}</p>}
      {created && <p className="text-sm text-foreground sm:col-span-2" role="status">Vehicle created. It is currently offline.</p>}
      <div className="sm:col-span-2">
        <Button className="min-h-11 w-full sm:w-auto" disabled={pending} type="submit">
          {pending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
          {pending ? "Saving vehicle…" : "Add vehicle"}
        </Button>
      </div>
    </form>
  );
}

export function VehicleManager() {
  const vehiclesQuery = useMyVehiclesQuery();
  const statusMutation = useUpdateVehicleStatusMutation();
  const [statusError, setStatusError] = useState<string | null>(null);

  async function toggleStatus(id: string, status: "ONLINE" | "OFFLINE") {
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({ id, status });
    } catch (error) {
      setStatusError(errorMessage(error, "Could not update vehicle status. Try again."));
    }
  }

  if (vehiclesQuery.isPending) {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading your vehicles…</p>;
  }

  if (vehiclesQuery.isError) {
    return (
      <section className="rounded-xl border border-border bg-card p-5" role="alert">
        <p className="text-sm">{errorMessage(vehiclesQuery.error, "Could not load vehicles.")}</p>
        <Button className="mt-4" onClick={() => void vehiclesQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button>
      </section>
    );
  }

  return (
    <div className="grid gap-6">
      {vehiclesQuery.data.length > 0 && (
        <section aria-label="Your vehicles" className="grid gap-3">
          {vehiclesQuery.data.map((vehicle) => {
            const nextStatus = vehicle.status === "ONLINE" ? "OFFLINE" : "ONLINE";
            const isUpdating = statusMutation.isPending && statusMutation.variables?.id === vehicle.id;
            return (
              <article className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between" key={vehicle.id}>
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-border"><CarFront aria-hidden="true" className="size-5" /></span>
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold">{vehicle.model}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{vehicle.plateNumber} <span aria-hidden="true">·</span> Capacity {vehicle.capacity}</p>
                    <p className={`mt-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${vehicle.status === "ONLINE" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      <span className={`size-2 rounded-full ${vehicle.status === "ONLINE" ? "bg-emerald-600 dark:bg-emerald-400" : "bg-muted-foreground/50"}`} />
                      {vehicle.status}
                    </p>
                  </div>
                </div>
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  disabled={statusMutation.isPending}
                  onClick={() => void toggleStatus(vehicle.id, nextStatus)}
                  type="button"
                  variant={vehicle.status === "ONLINE" ? "outline" : "default"}
                >
                  {isUpdating && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
                  {isUpdating ? "Updating…" : `Set ${nextStatus.toLowerCase()}`}
                </Button>
              </article>
            );
          })}
        </section>
      )}

      {statusError && <p className="text-sm text-destructive" role="alert">{statusError}</p>}

      <section aria-labelledby="add-vehicle-heading" className="rounded-xl border border-border bg-card p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Vehicle setup</p>
        <h2 className="mt-2 text-lg font-semibold" id="add-vehicle-heading">{vehiclesQuery.data.length ? "Add another vehicle" : "Add your vehicle"}</h2>
        <p className="mb-5 mt-1 text-sm text-muted-foreground">Capacity is set to 3 by the backend. New vehicles start offline.</p>
        <CreateVehicleForm />
      </section>
    </div>
  );
}
