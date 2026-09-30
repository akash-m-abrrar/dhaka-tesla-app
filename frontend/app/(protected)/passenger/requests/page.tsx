import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/container";
import { RideRequestList } from "@/components/ride-requests/ride-request-list";

export default function PassengerRequestsPage() {
  return (
    <main>
      <Container className="py-10 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Passenger · Requests
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
              My requests
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
              Your ride requests and their latest backend status.
            </p>
          </div>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-80"
            href="/passenger/requests/new"
          >
            Request a ride <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-8">
          <RideRequestList />
        </div>
      </Container>
    </main>
  );
}
