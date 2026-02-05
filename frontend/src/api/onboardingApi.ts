import http from "./http";
import type { OnboardingPreferences } from "../types/onboarding";

export const onboardingApi = {
  save(preferences: OnboardingPreferences): Promise<OnboardingPreferences> {
    return http.post("/user/onboarding", preferences);
  },

  get(): Promise<OnboardingPreferences> {
    return http.get("/user/onboarding");
  },
};

