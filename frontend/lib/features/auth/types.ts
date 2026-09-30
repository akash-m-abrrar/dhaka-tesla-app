export type UserRole = "PASSENGER" | "DRIVER";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface RefreshAccessTokenRequest {
  refreshToken: string;
}

export interface DriverApplicationRequest {
  licenseNumber: string;
  vehicleModel: string;
  vehiclePlateNumber: string;
}

export interface RegisterUserData {
  user: User;
}

export interface LoginUserData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshAccessTokenData {
  accessToken: string;
}
