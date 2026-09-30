export type ZoneType = "AREA" | "POINT";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  latitude: string;
  longitude: string;
  createdAt: string;
  updatedAt: string;
}

export type RideRequestStatus = "PENDING" | "MATCHED" | "ACCEPTED" | "CANCELLED";
export type PoolStatus =
  | "REQUESTED"
  | "MATCHED"
  | "DRIVER_ARRIVED"
  | "STARTED"
  | "COMPLETED"
  | "CANCELLED";
export type PoolMemberStatus = "PENDING" | "PAID" | "CANCELLED";

export interface RideRequest {
  id: string;
  passengerId: string;
  pickupZoneId: string;
  destinationZoneId: string;
  requestedSeats: number;
  estimatedFare: number;
  status: RideRequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RideHistoryEvent {
  id: string;
  eventType: "REQUESTED" | "MATCHED" | "DRIVER_ARRIVED" | "STARTED" | "COMPLETED" | "CANCELLED";
  note: string | null;
  createdAt: string;
}

export interface PassengerRideRequestHistory {
  id: string;
  requestedSeats: number;
  estimatedFare: number;
  status: RideRequestStatus;
  createdAt: string;
  updatedAt: string;
  pickupZone: { id: string; name: string };
  destinationZone: { id: string; name: string };
  poolMember: null | {
    id: string;
    poolId: string;
    seatNumber: number;
    fare: number;
    status: PoolMemberStatus;
    joinedAt: string;
    leftAt: string | null;
    pool: {
      id: string;
      status: PoolStatus;
      createdAt: string;
      startedAt: string | null;
      completedAt: string | null;
      history: RideHistoryEvent[];
    };
  };
}

export interface CreateRideRequestInput {
  pickupZoneId: string;
  destinationZoneId: string;
  requestedSeats: number;
}
