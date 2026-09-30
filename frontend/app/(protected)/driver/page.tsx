import { Container } from "@/components/site/container";

const driverFeatures = [
  {
    title: "Vehicle",
    description: "Vehicle details will be managed here in a future update.",
  },
  {
    title: "Ride Requests",
    description: "Available ride requests will appear here when implemented.",
  },
  {
    title: "Pools",
    description: "Pool tools are planned for a later milestone.",
  },
  {
    title: "Ride History",
    description: "Your completed rides will be listed here in a future update.",
  },
  {
    title: "Payments",
    description: "Payment tools are coming in a later milestone.",
  },
];

export default function DriverPage() {
  return (
    <main>
      <Container className="py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Driver space
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
          Welcome to your driver space.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Your driver tools will live here. Vehicle and ride management are not available yet.
        </p>

        <section aria-label="Driver features coming soon" className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {driverFeatures.map((feature) => (
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
