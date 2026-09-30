import type { VehicleStatus } from "@/lib/features/vehicles/types";

export type PoolStatus = "REQUESTED" | "MATCHED" | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";
export type PoolMemberStatus = "PENDING" | "PAID" | "CANCELLED";
export type RideRequestStatus = "PENDING" | "MATCHED" | "ACCEPTED" | "CANCELLED";
export type PoolLifecycleAction = "arrive" | "start" | "complete";

export interface PoolSummary {
  id: string;
  vehicleId: string;
  status: "REQUESTED";
  createdAt: string;
}

export interface PoolOccupancy {
  occupiedSeats: number;
  capacity: number;
}

export interface PoolDetail {
  id: string;
  status: PoolStatus;
  createdAt: string;
  vehicle: { id: string; model: string; capacity: number; status: VehicleStatus };
  members: Array<{
    id: string;
    seatNumber: number;
    status: PoolMemberStatus;
    passenger: { name: string };
    rideRequest: {
      id: string;
      requestedSeats: number;
      status: RideRequestStatus;
      pickupZone: { name: string };
      destinationZone: { name: string };
    };
  }>;
  occupancy: PoolOccupancy;
}

export interface DriverPoolHistoryItem {
  id: string;
  status: PoolStatus;
  estimatedFare: number;
  actualFare: number | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  vehicle: { id: string; model: string; plateNumber: string; capacity: number };
  members: Array<{
    id: string;
    passengerId: string;
    seatNumber: number;
    fare: number;
    status: PoolMemberStatus;
    joinedAt: string;
    leftAt: string | null;
    passenger: { id: string; name: string };
    rideRequest: {
      id: string;
      requestedSeats: number;
      estimatedFare: number;
      status: RideRequestStatus;
      pickupZone: { id: string; name: string };
      destinationZone: { id: string; name: string };
    };
  }>;
  history: Array<{ id: string; eventType: string; note: string | null; createdAt: string }>;
}

export interface AcceptRideRequestInput {
  rideRequestId: string;
}

export interface AcceptRideRequestResult {
  member: {
    id: string;
    poolId: string;
    rideRequestId: string;
    seatNumber: number;
    status: PoolMemberStatus;
  };
  occupancy: PoolOccupancy;
}

export interface PoolLifecycleResult {
  poolId: string;
  status: PoolStatus;
  occurredAt: string;
}
