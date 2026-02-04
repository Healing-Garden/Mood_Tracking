import { useState, useCallback, useEffect } from "react";
import {
  profileApi,
  type UserProfile,
  type UpdateProfileRequest,
  type ChangePasswordRequest,
} from "../api/profileApi";
import { useToast } from "./use-toast";

interface UseProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  setAppLockPin: (pin: string) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileApi.getProfile();
      setProfile(response.user);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to fetch profile";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await profileApi.updateProfile(data);
        setProfile(response.user);
        toast({
          title: "Success",
          description: response.message,
        });
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || "Failed to update profile";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const uploadAvatar = useCallback(
    async (file: File): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        const response = await profileApi.uploadAvatar(file);
        setProfile(response.user);
        toast({
          title: "Success",
          description: response.message,
        });
        return response.imageUrl;
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || "Failed to upload avatar";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const deleteAvatar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await profileApi.deleteAvatar();
      setProfile(response.user);
      toast({
        title: "Success",
        description: response.message,
      });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Failed to delete avatar";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const changePassword = useCallback(
    async (data: ChangePasswordRequest) => {
      try {
        setLoading(true);
        setError(null);
        const response = await profileApi.changePassword(data);
        toast({
          title: "Success",
          description: response.message,
        });
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || "Failed to change password";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const setAppLockPin = useCallback(
    async (pin: string) => {
      try {
        setLoading(true);
        setError(null);
        const response = await profileApi.setAppLockPin({ pin });
        setProfile(response.user);
        toast({
          title: "Success",
          description: response.message,
        });
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.message || err?.message || "Failed to set PIN";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    changePassword,
    setAppLockPin,
  };
};
