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

      // New Actions
      setImproveGoals: (improveGoals) => set({ improveGoals }),
      setFrequentFeeling: (frequentFeeling) => set({ frequentFeeling }),
      setPersonalGoalDescription: (personalGoalDescription) => set({ personalGoalDescription }),
      setStressLevel: (stressLevel) => set({ stressLevel }),
      setRecentState: (recentState) => set({ recentState }),
      setEmotionalClarity: (emotionalClarity) => set({ emotionalClarity }),
      setReflectionFrequency: (reflectionFrequency) => set({ reflectionFrequency }),
      setNegativeEmotionHandling: (negativeEmotionHandling) => set({ negativeEmotionHandling }),
      setExperienceLearning: (experienceLearning) => set({ experienceLearning }),

      // Legacy Actions
      setGoals: (goals) => set({ goals }),
      setEmotionalSensitivity: (emotionalSensitivity: EmotionalSensitivity) =>
        set({ emotionalSensitivity }),
      setReminderTone: (reminderTone: ReminderTone) => set({ reminderTone }),
      setThemePreference: (themePreference: ThemePreference) =>
        set({ themePreference }),
      
      // Navigation
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
          improveGoals: state.improveGoals,
          frequentFeeling: state.frequentFeeling,
          personalGoalDescription: state.personalGoalDescription,
          stressLevel: state.stressLevel,
          recentState: state.recentState,
          emotionalClarity: state.emotionalClarity,
          reflectionFrequency: state.reflectionFrequency,
          negativeEmotionHandling: state.negativeEmotionHandling,
          experienceLearning: state.experienceLearning,
          
          // Legacy fields
          goals: state.goals,
          emotionalSensitivity: state.emotionalSensitivity,
          reminderTone: state.reminderTone,
          themePreference: state.themePreference,
          isOnboarded: state.isOnboarded,
        } as OnboardingPreferences
      },
    }),
    {
      name: 'onboarding-storage',
      skipHydration: true,
      storage: {
        getItem: (name: string): Promise<any> => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`;
            const data = localStorage.getItem(key);
            return Promise.resolve(data);
          } catch {
            return Promise.resolve(localStorage.getItem(`${name}:anon`));
          }
        },
        setItem: (name: string, value: any) => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`;
            localStorage.setItem(key, value);
          } catch {
            localStorage.setItem(`${name}:anon`, value);
          }
        },
        removeItem: (name: string) => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`;
            localStorage.removeItem(key);
          } catch {
            localStorage.removeItem(`${name}:anon`);
          }
        },
      },
    }
  )
)

export type { OnboardingState, OnboardingPreferences, EmotionalSensitivity, ReminderTone, ThemePreference } from '../types/onboarding'
