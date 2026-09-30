import { Container } from "@/components/site/container";
import { DriverRideRequests } from "@/components/driver/driver-ride-requests";

export default function DriverRideRequestsPage() {
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Ride requests</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Review pending passenger requests and add one to an active pool.</p>
      </header>
      <div className="mt-8 max-w-4xl sm:mt-10"><DriverRideRequests /></div>
    </Container>
  );
}
