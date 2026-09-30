import { Container } from "@/components/site/container";
import { DriverPoolList } from "@/components/driver/driver-pool-list";

export default function DriverPoolsPage() {
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Pools</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Follow active trips and review completed pool payments.</p>
      </header>
      <div className="mt-8 max-w-4xl sm:mt-10"><DriverPoolList /></div>
    </Container>
  );
}
