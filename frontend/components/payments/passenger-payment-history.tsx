"use client";

import { LoaderCircle, RotateCw } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { formatFare } from "@/lib/features/ride-requests/format";
import { useMyPaymentsQuery } from "@/lib/features/payments/hooks";

const paidAtFormatter = new Intl.DateTimeFormat("en-BD", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function PassengerPaymentHistory() {
  const query = useMyPaymentsQuery();

  if (query.isPending) return <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Loading payments…</p>;
  if (query.isError) return <section className="rounded-2xl border border-border bg-card p-5" role="alert"><p className="text-sm">{query.error instanceof ApiError ? query.error.message : "Could not load payment history."}</p><Button className="mt-4" onClick={() => void query.refetch()} type="button" variant="outline"><RotateCw aria-hidden="true" />Try again</Button></section>;
  if (!query.data.length) return <section className="rounded-3xl border border-border bg-card p-6 sm:p-8"><h2 className="font-semibold">No payments yet</h2><p className="mt-2 text-sm text-muted-foreground">Payments appear here after a completed trip.</p></section>;

  return (
    <ul className="grid gap-3">
      {query.data.map((payment) => (
        <li className="rounded-2xl border border-border bg-card p-5" key={payment.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{formatFare(payment.amount)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{payment.method}{payment.method === "TESLAPAY" ? " · simulated" : ""} · Pool {payment.poolMember.pool.id}</p>
            </div>
            <span className="rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]">{payment.status}</span>
          </div>
          <p className="mt-3 break-all text-xs text-muted-foreground">Reference: {payment.transactionRef}</p>
          <p className="mt-1 text-xs text-muted-foreground">Pool member: {payment.poolMember.status} · Pool: {payment.poolMember.pool.status}</p>
          {payment.paidAt && <time className="mt-1 block text-xs text-muted-foreground" dateTime={payment.paidAt}>Paid {paidAtFormatter.format(new Date(payment.paidAt))}</time>}
        </li>
      ))}
    </ul>
  );
}
