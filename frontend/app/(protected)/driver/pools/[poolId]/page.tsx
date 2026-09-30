import { Container } from "@/components/site/container";
import { DriverPoolDetail } from "@/components/driver/driver-pool-detail";

export default async function DriverPoolDetailPage({ params }: { params: Promise<{ poolId: string }> }) {
  const { poolId } = await params;
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver workspace · Pool</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Pool details</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Manage passengers and valid trip actions for this pool.</p>
      </header>
      <div className="mt-8 max-w-4xl sm:mt-10"><DriverPoolDetail poolId={poolId} /></div>
    </Container>
  );
}
