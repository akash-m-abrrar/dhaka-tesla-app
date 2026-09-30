"use client";

import { useState } from "react";
import { LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { formatFare } from "@/lib/features/ride-requests/format";
import { useCreatePaymentMutation, useMyPaymentsQuery } from "@/lib/features/payments/hooks";
import type { PaymentMethod } from "@/lib/features/payments/types";

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function PassengerPaymentPanel({
  poolMemberId,
  poolStatus,
  memberStatus,
  fare,
}: {
  poolMemberId: string;
  poolStatus: string;
  memberStatus: "PENDING" | "PAID" | "CANCELLED";
  fare: number;
}) {
  const paymentsQuery = useMyPaymentsQuery(poolStatus === "COMPLETED");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const createMutation = useCreatePaymentMutation(poolMemberId, { method });
  const existingPayment = paymentsQuery.data?.find((payment) => payment.poolMemberId === poolMemberId);

  async function onPay() {
    createMutation.reset();
    try {
      await createMutation.mutateAsync();
    } catch {
      // The backend error is rendered below.
    }
  }

  return (
    <section aria-labelledby="payment-title" className="mt-8 border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Payment</p>
          <h2 className="mt-2 text-lg font-semibold" id="payment-title">{formatFare(fare)}</h2>
        </div>
        <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{memberStatus}</span>
      </div>

      {poolStatus !== "COMPLETED" && <p className="mt-3 text-sm text-muted-foreground">Payment becomes available after the trip is completed.</p>}
      {poolStatus === "COMPLETED" && memberStatus === "CANCELLED" && <p className="mt-3 text-sm text-muted-foreground">Cancelled pool members cannot be charged.</p>}
      {poolStatus === "COMPLETED" && memberStatus === "PAID" && !paymentsQuery.isPending && <p className="mt-3 text-sm text-muted-foreground">This pool member is marked paid.</p>}

      {poolStatus === "COMPLETED" && memberStatus === "PENDING" && paymentsQuery.isPending && (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Checking payment status…</p>
      )}

      {poolStatus === "COMPLETED" && paymentsQuery.isError && (
        <div className="mt-4" role="alert">
          <p className="text-sm text-destructive">{message(paymentsQuery.error, "Could not load your payment status.")}</p>
          <Button className="mt-3" onClick={() => void paymentsQuery.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button>
        </div>
      )}

      {poolStatus === "COMPLETED" && memberStatus === "PENDING" && !paymentsQuery.isPending && !paymentsQuery.isError && existingPayment && (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">{existingPayment.status === "SUCCESS" ? "Payment complete" : existingPayment.method === "CASH" ? "Cash payment awaiting driver confirmation" : `Payment ${existingPayment.status.toLowerCase()}`}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{existingPayment.method} · {existingPayment.transactionRef}</p>
        </div>
      )}

      {poolStatus === "COMPLETED" && memberStatus === "PENDING" && !paymentsQuery.isPending && !paymentsQuery.isError && !existingPayment && (
        <div className="mt-4 grid gap-4">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Choose a payment method</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {([
                ["CASH", "Cash", "Pay the driver in cash; they confirm receipt."],
                ["TESLAPAY", "TeslaPay (simulated)", "Demo only; no wallet or payment gateway is charged."],
              ] as const).map(([value, label, description]) => (
                <label className={`cursor-pointer rounded-xl border p-3 focus-within:ring-2 focus-within:ring-ring ${method === value ? "border-foreground" : "border-border"}`} key={value}>
                  <input className="sr-only" checked={method === value} name={`payment-method-${poolMemberId}`} onChange={() => setMethod(value)} type="radio" value={value} />
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {createMutation.isError && <p className="text-sm text-destructive" role="alert">{message(createMutation.error, "Could not create the payment.")}</p>}
          <Button className="min-h-11 w-full sm:w-fit" disabled={createMutation.isPending} onClick={() => void onPay()} type="button">
            {createMutation.isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {createMutation.isPending ? "Creating payment…" : `Continue · ${formatFare(fare)}`}
          </Button>
        </div>
      )}
    </section>
  );
}
