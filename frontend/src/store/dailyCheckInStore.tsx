import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export const moodLevelToString = (level: MoodLevel): string => {
  switch (level) {
    case 1: return 'very sad'
    case 2: return 'sad'
    case 3: return 'neutral'
    case 4: return 'happy'
    case 5: return 'very happy'
    default: return 'neutral'
  }
}

export interface DailyCheckInEntry {
  mood: MoodLevel
  energy: number
  note?: string
  date: string 
  theme?: 'low' | 'neutral' | 'positive'
}

export interface DailyCheckInState {
  lastCheckInDate: string | null
  currentCheckIn: DailyCheckInEntry | null
  showModal: boolean
  lastMood: string | null
  setLastMood: (mood: string | null) => void

  // Actions
  setShowModal: (show: boolean) => void
  submitCheckIn: (entry: Omit<DailyCheckInEntry, 'date'>) => void
  hasCheckedInToday: () => boolean
  getThemeByMood: (mood: MoodLevel) => 'low' | 'neutral' | 'positive'
  resetStore: () => void
}

export const useDailyCheckInStore = create<DailyCheckInState>()(
  persist(
    (set, get) => ({
      lastCheckInDate: null,
      currentCheckIn: null,
      showModal: false,
      lastMood: null,
      setLastMood: (mood) => set({ lastMood: mood }),

      setShowModal: (show) => set({ showModal: show }),

      submitCheckIn: (entry) => {
        const today = new Date().toISOString().split('T')[0]
        const theme = get().getThemeByMood(entry.mood)
        const moodString = moodLevelToString(entry.mood)

        set({
          lastCheckInDate: today,
          currentCheckIn: { ...entry, date: today, theme },
          showModal: false,
          lastMood: moodString, 
        })
      },

      hasCheckedInToday: () => {
        const today = new Date().toISOString().split('T')[0]
        return get().lastCheckInDate === today
      },

      getThemeByMood: (mood: MoodLevel) => {
        if (mood <= 2) return 'low'
        if (mood === 3) return 'neutral'
        return 'positive'
      },

      resetStore: () =>
        set({
          lastCheckInDate: null,
          currentCheckIn: null,
          showModal: false,
          lastMood: null,
        }),
    }),
    {
      name: 'daily-checkin-storage',
      skipHydration: true,
      partialize: (state) => ({
        lastCheckInDate: state.lastCheckInDate,
        currentCheckIn: state.currentCheckIn,
        lastMood: state.lastMood,
      }),
      storage: {
        getItem: (name: string): Promise<any> => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`
            return Promise.resolve(localStorage.getItem(key))
          } catch {
            return Promise.resolve(localStorage.getItem(`${name}:anon`))
          }
        },
        setItem: (name: string, value: any) => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`
            localStorage.setItem(key, value)
          } catch {
            localStorage.setItem(`${name}:anon`, value)
          }
        },
        removeItem: (name: string) => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null')
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`
            localStorage.removeItem(key)
          } catch {
            localStorage.removeItem(`${name}:anon`)
          }
        },
      },
    }
  )
)