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

export const authApi = {
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
