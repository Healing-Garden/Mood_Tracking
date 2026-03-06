import http from "./http";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  age?: number;
  heightCm?: number;
  weight?: number;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateProfilePayload {
  fullName?: string;
  age?: number;
  heightCm?: number;
  weight?: number;
}

export const userApi = {
  getOnboardingStatus(): Promise<{ isOnboarded: boolean }> {
    return http.get("/user/onboarding/status");
  },

  // Profile endpoints
  getProfile(): Promise<UserProfile> {
    return http.get("/user/profile");
  },

  updateProfile(payload: UpdateProfilePayload): Promise<{ message: string; user: UserProfile }> {
    return http.put("/user/profile", payload);
  },

  uploadAvatar(file: File): Promise<{ message: string; user: UserProfile; imageUrl: string }> {
    const formData = new FormData();
    formData.append("avatar", file);
    return http.post("/user/avatar", formData);
  },

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    recoveryCode?: string;
  }): Promise<{ message: string }> {
    return http.post("/user/change-password", payload);
  },

  getAdminRecoveryCodes(): Promise<{ codes: string[] }> {
    return http.get("/user/admin/recovery-codes");
  },

  regenerateAdminRecoveryCodes(): Promise<{ message: string; codes: string[] }> {
    return http.post("/user/admin/recovery-codes/regenerate");
  },
};
