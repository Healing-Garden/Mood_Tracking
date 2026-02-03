import http from "./http";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface VerifyRegisterOtpRequest {
  email: string;
  otp: string;
}

export const authApi = {
  register(data: RegisterRequest) {
    return http.post("/auth/register", data);
  },

  verifyRegisterOtp(data: VerifyRegisterOtpRequest) {
    return http.post("/auth/register/verify-otp", data);
  },

  login(data: LoginRequest): Promise<LoginResponse> {
    return http.post("/auth/login", data) as Promise<LoginResponse>;
  },

  logout(): Promise<void> {
    return http.post("/auth/logout") as Promise<void>;
  },

  refreshToken(): Promise<{ accessToken: string }> {
    return http.post("/auth/refresh-token") as Promise<{ accessToken: string }>;
  },
};
