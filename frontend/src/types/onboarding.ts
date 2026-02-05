export type EmotionalSensitivity = 'soft' | 'balanced' | 'vibrant'
export type ReminderTone = 'gentle' | 'neutral' | 'motivational'
export type ThemePreference = 'light' | 'dark'

export interface OnboardingPreferences {
  // Step 1: Goals selection
  goals: string[]

  // Step 2: Emotional sensitivity
  emotionalSensitivity: EmotionalSensitivity

  // Step 3: Reminder tone
  reminderTone: ReminderTone

  // Step 4: Theme preference
  themePreference: ThemePreference

  // Completion status
  isOnboarded?: boolean
}

export interface OnboardingState extends OnboardingPreferences {
  // Progress tracking
  isOnboarded: boolean
  currentStep: number

  // Actions
  setGoals: (goals: string[]) => void
  setEmotionalSensitivity: (sensitivity: EmotionalSensitivity) => void
  setReminderTone: (tone: ReminderTone) => void
  setThemePreference: (theme: ThemePreference) => void
  setCurrentStep: (step: number) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  getPreferences: () => OnboardingPreferences
}

// Default values
export const DEFAULT_PREFERENCES: OnboardingPreferences = {
  goals: [],
  emotionalSensitivity: 'balanced',
  reminderTone: 'gentle',
  themePreference: 'light',
}
