import { Container } from "@/components/site/container";

const passengerFeatures = [
  {
    title: "Request Ride",
    description: "Choose a pickup and destination when ride requests are ready.",
  },
  {
    title: "My Requests",
    description: "Review your ride requests in a future update.",
  },
  {
    title: "Ride History",
    description: "Completed trips will appear here when the feature is available.",
  },
  {
    title: "Payments",
    description: "Payment tools are coming in a later milestone.",
  },
];

export default function PassengerPage() {
  return (
    <main>
      <Container className="py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Passenger space
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Welcome to your ride space.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Your passenger tools will live here. Ride booking is not available yet.
        </p>

        <section aria-label="Passenger features coming soon" className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {passengerFeatures.map((feature) => (
            <article className="min-h-44 rounded-3xl border border-border bg-card p-5" key={feature.title}>
              <span className="inline-flex rounded-full border border-border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Coming next
              </span>
              <h2 className="mt-5 text-base font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </article>
          ))}
        </section>
      </Container>
    </main>
  );
}
