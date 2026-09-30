"use client";

import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { LoaderCircle, RotateCw } from "lucide-react";
import { formatFare } from "@/lib/features/ride-requests/format";
import { useConfirmCashPaymentMutation, usePoolPaymentsQuery } from "@/lib/features/payments/hooks";

export function DriverPoolPayments({ poolId }: { poolId: string }) {
  const query = usePoolPaymentsQuery(poolId);
  const confirmMutation = useConfirmCashPaymentMutation(poolId);

  async function onConfirm(paymentId: string) {
    try {
      await confirmMutation.mutateAsync(paymentId);
    } catch {
      // The backend error is shown below.
    }
  }

  return (
    <section aria-labelledby="pool-payments-title" className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">Completed trip</p>
      <h2 className="mt-2 text-lg font-semibold" id="pool-payments-title">Payments</h2>
      {query.isPending && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading payments…</p>}
      {query.isError && <div className="mt-4" role="alert"><p className="text-sm text-destructive">{query.error instanceof ApiError ? query.error.message : "Could not load pool payments."}</p><Button className="mt-3" onClick={() => void query.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button></div>}
      {confirmMutation.isError && <p className="mt-4 text-sm text-destructive" role="alert">{confirmMutation.error instanceof ApiError ? confirmMutation.error.message : "Could not confirm cash payment."}</p>}
      {!query.isPending && !query.isError && query.data.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No payments have been created for this pool.</p>}
      {!query.isPending && !query.isError && query.data.length > 0 && (
        <ul className="mt-4 grid gap-3">
          {query.data.map((payment) => {
            const isConfirming = confirmMutation.isPending && confirmMutation.variables === payment.id;
            const canConfirm = payment.method === "CASH" && payment.status === "PENDING" && payment.poolMember.status === "PENDING";
            return (
              <li className="rounded-lg border border-border p-4" key={payment.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{formatFare(payment.amount)} · {payment.method}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Payment {payment.status} · Member {payment.poolMember.status}</p>
                    <p className="mt-1 break-all text-xs text-muted-foreground">{payment.transactionRef}</p>
                  </div>
                  {canConfirm && <Button className="min-h-11 w-full sm:w-auto" disabled={confirmMutation.isPending} onClick={() => void onConfirm(payment.id)} type="button">{isConfirming && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{isConfirming ? "Confirming…" : "Confirm cash received"}</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
