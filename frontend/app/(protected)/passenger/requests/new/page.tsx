import { Container } from "@/components/site/container";
import { RideRequestForm } from "@/components/ride-requests/ride-request-form";

export default function NewRideRequestPage() {
  return (
    <main>
      <Container className="py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Passenger · New request
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Where are you headed?
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Choose your pickup, destination, and seats. The backend calculates the fare after submission.
        </p>
        <div className="mt-8 max-w-3xl">
          <RideRequestForm />
        </div>
      </Container>
    </main>
  );
}
