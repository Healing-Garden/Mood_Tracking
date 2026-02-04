import http from "./http";

export interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  age?: number;
  weight?: number;
  heightCm?: number;
  dateOfBirth?: string;
  avatarUrl?: string;
  role: string;
  accountStatus: string;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  age?: number;
  weight?: number;
  heightCm?: number;
  dateOfBirth?: string;
  healthGoals?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface SetPinRequest {
  pin: string;
}

export interface AvatarUploadResponse {
  message: string;
  user: UserProfile;
  imageUrl: string;
}

export const profileApi = {
  getProfile(): Promise<{ user: UserProfile }> {
    return http.get("/profile") as Promise<{ user: UserProfile }>;
  },

  updateProfile(
    data: UpdateProfileRequest
  ): Promise<{ message: string; user: UserProfile }> {
    return http.put("/profile", data) as Promise<{
      message: string;
      user: UserProfile;
    }>;
  },

  uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append("avatar", file);

    return http.post("/profile/avatar", formData) as Promise<AvatarUploadResponse>;
  },

  deleteAvatar(): Promise<{ message: string; user: UserProfile }> {
    return http.delete("/profile/avatar") as Promise<{
      message: string;
      user: UserProfile;
    }>;
  },

  changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    return http.post("/profile/change-password", data) as Promise<{
      message: string;
    }>;
  },

  setAppLockPin(
    data: SetPinRequest
  ): Promise<{ message: string; user: UserProfile }> {
    return http.post("/profile/set-pin", data) as Promise<{
      message: string;
      user: UserProfile;
    }>;
  },
};
