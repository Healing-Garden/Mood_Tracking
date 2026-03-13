import http from "./http";
import type { HealingContent } from "../services/healingContentService";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  age?: number;
  heightCm?: number;
  weight?: number;
  avatarUrl?: string;
  hasPassword?: boolean;
  appLockEnabled?: boolean;
  hasAppLockPin?: boolean;
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
  getOnboardingStatus(): Promise<{ isOnboarded: boolean; onboardedAt?: string }> {
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

  removeAvatar(): Promise<{ message: string; user: UserProfile }> {
    return http.delete("/user/avatar");
  },

  changePassword(payload: {
    currentPassword: string;
    newPassword: string;
    recoveryCode?: string;
  }): Promise<{ message: string }> {
    return http.post("/user/change-password", payload);
  },

  getAdminRecoveryCodes(): Promise<{ count: number; hasDownloaded: boolean }> {
    return http.get("/user/admin/recovery-codes");
  },

  markAdminRecoveryCodesDownloaded(): Promise<{ codes: string[]; message: string }> {
    return http.post("/user/admin/recovery-codes/download");
  },

  setAppLockPin(pin: string): Promise<{ message: string }> {
    return http.put("/user/app-lock/pin", { pin });
  },

  verifyAppLockPin(pin: string): Promise<{ message: string }> {
    return http.post("/user/app-lock/verify", { pin });
  },

  toggleAppLock(enabled: boolean): Promise<{ message: string }> {
    return http.put("/user/app-lock/toggle", { enabled });
  },

  getHealingContent(type?: string): Promise<HealingContent[]> {
    const params = type ? { type } : {};
    return http.get("/user/healing-content", { params });
  },

  getDashboardData(): Promise<any> {
    return http.get("/user/dashboard/data");
  },
};
