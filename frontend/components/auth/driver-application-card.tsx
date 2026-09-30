"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { refreshAccessToken } from "@/lib/features/auth/api";
import { getValidationFieldError } from "@/lib/features/auth/form-errors";
import {
  authQueryKeys,
  currentUserQueryOptions,
} from "@/lib/features/auth/queries";
import {
  driverApplicationFormSchema,
  type DriverApplicationFormValues,
} from "@/lib/features/auth/schemas";
import { startAuthenticatedSession } from "@/lib/features/auth/session";
import { useDriverApplicationMutation } from "@/lib/features/auth/hooks";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { toast } from "sonner";

const applicationFields = [
  "licenseNumber",
  "vehicleModel",
  "vehiclePlateNumber",
] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function DriverApplicationCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [approvedNeedsSessionRefresh, setApprovedNeedsSessionRefresh] =
    useState(false);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const router = useRouter();
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const applicationMutation = useDriverApplicationMutation();
  const {
    handleSubmit,
    register,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<DriverApplicationFormValues>({
    resolver: zodResolver(driverApplicationFormSchema),
    defaultValues: {
      licenseNumber: "",
      vehicleModel: "",
      vehiclePlateNumber: "",
    },
  });

  async function refreshSessionAndRedirect() {
    if (!refreshToken) {
      throw new Error("Your session could not be refreshed. Please sign in again.");
    }

    const { accessToken } = await refreshAccessToken({ refreshToken });
    startAuthenticatedSession(dispatch, queryClient, {
      accessToken,
      refreshToken,
    });

    await queryClient.invalidateQueries({
      queryKey: authQueryKeys.currentUser(),
      refetchType: "none",
    });
    const user = await queryClient.fetchQuery(
      currentUserQueryOptions(accessToken),
    );

    if (user.role !== "DRIVER") {
      throw new Error("Your driver role could not be confirmed. Please try again.");
    }

    toast.success("Driver application approved", {
      description: "Your account is ready for the driver dashboard.",
    });
    router.replace("/driver");
  }

  async function onSubmit(values: DriverApplicationFormValues) {
    let applicationApproved = false;
    clearErrors("root.server");

    try {
      await applicationMutation.mutateAsync(values);
      applicationApproved = true;
      setApprovedNeedsSessionRefresh(true);
      await refreshSessionAndRedirect();
    } catch (error) {
      if (applicationApproved) {
        setError("root.server", {
          type: "server",
          message: "Your application was approved, but we couldn’t refresh your account. Retry to continue.",
        });
        return;
      }

      const validationError = getValidationFieldError(error, applicationFields);

      if (validationError) {
        setError(validationError.field as keyof DriverApplicationFormValues, {
          type: "server",
          message: validationError.message,
        });
        return;
      }

      setError("root.server", {
        type: "server",
        message: getErrorMessage(error, "We couldn’t submit your application. Please try again."),
      });
    }
  }

  async function retrySessionRefresh() {
    setIsRefreshingSession(true);
    clearErrors("root.server");
    try {
      await refreshSessionAndRedirect();
    } catch {
      setError("root.server", {
        type: "server",
        message: "Your application is approved, but your session is still being updated. Please try again.",
      });
    } finally {
      setIsRefreshingSession(false);
    }
  }

  const pending = isSubmitting || applicationMutation.isPending || isRefreshingSession;

  return (
    <section
      aria-labelledby="become-driver-title"
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Drive with Tesla Bullet
          </p>
          <h2 className="mt-2 text-lg font-semibold" id="become-driver-title">
            Become a Driver
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Apply with your license and vehicle details to open your driver workspace.
          </p>
        </div>
        {!isOpen && (
          <Button
            className="min-h-11 w-full shrink-0 sm:w-auto"
            onClick={() => setIsOpen(true)}
            type="button"
            variant="outline"
          >
            Become a Driver <ArrowUpRight aria-hidden="true" />
          </Button>
        )}
      </div>

      {isOpen && (
        <form
          className="mt-6 grid gap-4 sm:grid-cols-2"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {approvedNeedsSessionRefresh ? (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted-foreground" role="status">
                Your application is approved. Refresh your account to open the driver workspace.
              </p>
              {errors.root?.server?.message && (
                <p className="mt-3 text-sm text-destructive" role="alert">
                  {errors.root.server.message}
                </p>
              )}
              <Button
                className="mt-4 min-h-11"
                disabled={pending}
                onClick={() => void retrySessionRefresh()}
                type="button"
              >
                {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
                {pending ? "Refreshing account…" : "Continue to driver dashboard"}
              </Button>
            </div>
          ) : (
            <>
          <AuthField
            error={errors.licenseNumber?.message}
            id="driver-license-number"
            label="License number"
          >
            <Input
              autoComplete="off"
              aria-invalid={Boolean(errors.licenseNumber)}
              id="driver-license-number"
              maxLength={50}
              {...register("licenseNumber")}
            />
          </AuthField>
          <AuthField
            error={errors.vehicleModel?.message}
            id="driver-vehicle-model"
            label="Vehicle model"
          >
            <Input
              autoComplete="off"
              aria-invalid={Boolean(errors.vehicleModel)}
              id="driver-vehicle-model"
              maxLength={50}
              placeholder="Tesla Model 3"
              {...register("vehicleModel")}
            />
          </AuthField>
          <div className="sm:col-span-2">
            <AuthField
              error={errors.vehiclePlateNumber?.message}
              id="driver-vehicle-plate"
              label="Vehicle plate number"
            >
              <Input
                autoComplete="off"
                aria-invalid={Boolean(errors.vehiclePlateNumber)}
                id="driver-vehicle-plate"
                maxLength={20}
                {...register("vehiclePlateNumber")}
              />
            </AuthField>
          </div>

          {errors.root?.server?.message && (
            <p className="text-sm text-destructive sm:col-span-2" role="alert">
              {errors.root.server.message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button
              className="min-h-11"
              disabled={pending}
              onClick={() => setIsOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button className="min-h-11" disabled={pending} type="submit">
              {pending && <LoaderCircle aria-hidden="true" className="animate-spin" />}
              {pending ? "Submitting application…" : "Submit application"}
            </Button>
          </div>
            </>
          )}
        </form>
      )}
    </section>
  );
}
