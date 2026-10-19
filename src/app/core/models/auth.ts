export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface LoginResponse {
  success: true;
  message: string;
  data: LoginResponseData;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  success: true;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface MeResponse {
  success: true;
  message: string;
  data: AuthUser;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: true;
  message: string;
}
