import { Container } from "@/components/site/container";
import { VehicleManager } from "@/components/driver/vehicle-manager";

export default function DriverVehiclePage() {
  return (
    <Container className="py-8 sm:py-12 lg:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Driver · Vehicle</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Your vehicle</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">Manage your vehicle and set its availability for ride requests.</p>
      </header>
      <div className="mt-8 max-w-4xl sm:mt-10"><VehicleManager /></div>
    </Container>
  );
}
