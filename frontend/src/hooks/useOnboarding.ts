import { useOnboardingStore } from '../store/onboardingStore'

export function useOnboarding() {
  // Destructure store
  const store = useOnboardingStore()

  // Easy access to common values
  const step = store.currentStep
  const isCompleted = store.isOnboarded
  const goalsSelected = store.goals
  const sensitivity = store.emotionalSensitivity
  const tone = store.reminderTone
  const theme = store.themePreference

  // All preferences in one object
  const preferences = store.getPreferences()

  // Helper functions
  const goToStep = (stepNumber: number) => {
    store.setCurrentStep(stepNumber)
  }

  const nextStep = () => {
    store.setCurrentStep(store.currentStep + 1)
  }

  const prevStep = () => {
    if (store.currentStep > 1) {
      store.setCurrentStep(store.currentStep - 1)
    }
  }

  // Combined actions (do multiple things at once)
  const setGoalsAndMove = (goals: string[], nextStepNumber: number) => {
    store.setGoals(goals)
    store.setCurrentStep(nextStepNumber)
  }

  const setSensitivityAndMove = (sensitivity: 'soft' | 'balanced' | 'vibrant', nextStepNumber: number) => {
    store.setEmotionalSensitivity(sensitivity)
    store.setCurrentStep(nextStepNumber)
  }

  const setToneAndMove = (tone: 'gentle' | 'neutral' | 'motivational', nextStepNumber: number) => {
    store.setReminderTone(tone)
    store.setCurrentStep(nextStepNumber)
  }

  const setThemeAndMove = (theme: 'light' | 'dark', nextStepNumber: number) => {
    store.setThemePreference(theme)
    store.setCurrentStep(nextStepNumber)
  }

  return {
    // Current state
    step,
    isCompleted,
    goalsSelected,
    sensitivity,
    tone,
    theme,
    preferences,

    // Single actions
    setGoals: store.setGoals,
    setSensitivity: store.setEmotionalSensitivity,
    setTone: store.setReminderTone,
    setTheme: store.setThemePreference,
    setCurrentStep: store.setCurrentStep,
    completeOnboarding: store.completeOnboarding,
    resetOnboarding: store.resetOnboarding,

    // Navigation helpers
    goToStep,
    nextStep,
    prevStep,

    // Combined actions
    setGoalsAndMove,
    setSensitivityAndMove,
    setToneAndMove,
    setThemeAndMove,
  }
}
