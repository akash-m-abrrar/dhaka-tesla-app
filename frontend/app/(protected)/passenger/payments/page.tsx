import { Container } from "@/components/site/container";
import { PassengerPaymentHistory } from "@/components/payments/passenger-payment-history";

export default function PassengerPaymentsPage() {
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Passenger workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Payments</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Review payments and their current status.</p>
      </header>
      <div className="mt-8 max-w-4xl sm:mt-10"><PassengerPaymentHistory /></div>
    </Container>
  );
}
