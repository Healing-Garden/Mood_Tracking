export type EmotionalSensitivity = 'soft' | 'balanced' | 'vibrant'
export type ReminderTone = 'gentle' | 'neutral' | 'motivational'
export type ThemePreference = 'light' | 'dark'

export interface OnboardingPreferences {
  // Step 1: Personal Goals
  improveGoals: string[] // max 2
  frequentFeeling: string
  personalGoalDescription: string

  // Step 2: Current Situation
  stressLevel: string
  recentState: string
  emotionalClarity: string

  // Step 3: Self-Reflection Habits
  reflectionFrequency: string
  negativeEmotionHandling: string
  experienceLearning: string

  // Legacy Fields (kept for backward compatibility or future use)
  goals?: string[]
  emotionalSensitivity?: EmotionalSensitivity
  reminderTone?: ReminderTone
  themePreference?: ThemePreference

  // Completion status
  isOnboarded?: boolean
}

export interface OnboardingState extends OnboardingPreferences {
  // Progress tracking
  isOnboarded: boolean
  currentStep: number

  // Actions
  setImproveGoals: (goals: string[]) => void
  setFrequentFeeling: (feeling: string) => void
  setPersonalGoalDescription: (desc: string) => void
  setStressLevel: (level: string) => void
  setRecentState: (state: string) => void
  setEmotionalClarity: (clarity: string) => void
  setReflectionFrequency: (frequency: string) => void
  setNegativeEmotionHandling: (handling: string) => void
  setExperienceLearning: (learning: string) => void
  
  // Legacy actions
  setGoals: (goals: string[]) => void
  setEmotionalSensitivity: (sensitivity: EmotionalSensitivity) => void
  setReminderTone: (tone: ReminderTone) => void
  setThemePreference: (theme: ThemePreference) => void
  
  // Navigation
  setCurrentStep: (step: number) => void
  completeOnboarding: () => void
  resetOnboarding: () => void
  getPreferences: () => OnboardingPreferences
}

// Default values
export const DEFAULT_PREFERENCES: OnboardingPreferences = {
  improveGoals: [],
  frequentFeeling: '',
  personalGoalDescription: '',
  stressLevel: '',
  recentState: '',
  emotionalClarity: '',
  reflectionFrequency: '',
  negativeEmotionHandling: '',
  experienceLearning: '',
  
  // Legacy defaults
  goals: [],
  emotionalSensitivity: 'balanced',
  reminderTone: 'gentle',
  themePreference: 'light',
}
