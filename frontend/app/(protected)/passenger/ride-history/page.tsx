import { Container } from "@/components/site/container";
import { PassengerRideHistory } from "@/components/ride-requests/passenger-ride-history";

export default function PassengerRideHistoryPage() {
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Passenger workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Ride history</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Review your ride requests, trip status, and timeline.</p>
      </header>
      <div className="mt-8 max-w-5xl sm:mt-10">
        <PassengerRideHistory />
      </div>
    </Container>
  );
}
