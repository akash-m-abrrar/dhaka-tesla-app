export type VehicleStatus = "ONLINE" | "OFFLINE";

export interface Vehicle {
  id: string;
  ownerId: string;
  model: string;
  capacity: number;
  plateNumber: string;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleInput {
  model: string;
  plateNumber: string;
}

export interface UpdateVehicleStatusInput {
  status: VehicleStatus;
}
