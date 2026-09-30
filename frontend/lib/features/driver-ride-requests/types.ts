export interface DriverRideRequest {
  id: string;
  requestedSeats: number;
  createdAt: string;
  pickupZone: { name: string };
  destinationZone: { name: string };
}
