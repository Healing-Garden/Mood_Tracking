import http from "./http";

export const userApi = {
  getOnboardingStatus(): Promise<{ isOnboarded: boolean }> {
    return http.get("/user/onboarding/status");
  },
};
