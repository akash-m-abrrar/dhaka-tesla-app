import { Container } from "@/components/site/container";
import { RideRequestDetail } from "@/components/ride-requests/ride-request-detail";

export default async function RideRequestDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;

  return (
    <main>
      <Container className="py-10 sm:py-14">
        <div className="max-w-3xl">
          <RideRequestDetail id={id} />
        </div>
      </Container>
    </main>
  );
}
