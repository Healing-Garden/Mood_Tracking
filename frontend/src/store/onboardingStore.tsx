import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OnboardingState, EmotionalSensitivity, ReminderTone, ThemePreference, OnboardingPreferences } from '../types/onboarding'
import { DEFAULT_PREFERENCES } from '../types/onboarding'

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnboarded: false,
      currentStep: 1,
      ...DEFAULT_PREFERENCES,

      // Actions
      setGoals: (goals) => set({ goals }),
      setEmotionalSensitivity: (emotionalSensitivity: EmotionalSensitivity) => 
        set({ emotionalSensitivity }),
      setReminderTone: (reminderTone: ReminderTone) => 
        set({ reminderTone }),
      setThemePreference: (themePreference: ThemePreference) => 
        set({ themePreference }),
      setCurrentStep: (currentStep) => set({ currentStep }),

      completeOnboarding: () =>
        set({
          isOnboarded: true,
          currentStep: 1,
        }),

      resetOnboarding: () =>
        set({
          isOnboarded: false,
          currentStep: 1,
          ...DEFAULT_PREFERENCES,
        }),

      // Helper: Get all preferences as object
      getPreferences: () => {
        const state = get()
        return {
          goals: state.goals,
          emotionalSensitivity: state.emotionalSensitivity,
          reminderTone: state.reminderTone,
          themePreference: state.themePreference,
        } as OnboardingPreferences
      },
    }),
    {
      name: 'onboarding-storage',
      skipHydration: true,
    }
  )
)

// Export types for convenience
export type { OnboardingState, OnboardingPreferences, EmotionalSensitivity, ReminderTone, ThemePreference } from '../types/onboarding'
