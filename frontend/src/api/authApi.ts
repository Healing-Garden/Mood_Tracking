import http from "./http";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    http.post("/auth/login", data),

  register: (data: {
    fullName: string;
    email: string;
    password: string;
  }) => http.post("/auth/register", data),

  logout: () => http.post("/auth/logout"),
};
