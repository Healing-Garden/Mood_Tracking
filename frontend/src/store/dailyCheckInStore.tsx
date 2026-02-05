import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface DailyCheckInEntry {
  mood: MoodLevel
  energy: number
  note?: string
  date: string // YYYY-MM-DD format
  theme?: 'low' | 'neutral' | 'positive'
}

export interface DailyCheckInState {
  lastCheckInDate: string | null
  currentCheckIn: DailyCheckInEntry | null
  showModal: boolean
  
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

      setShowModal: (show) => set({ showModal: show }),

      submitCheckIn: (entry) => {
        const today = new Date().toISOString().split('T')[0]
        const theme = get().getThemeByMood(entry.mood)
        
        set({
          lastCheckInDate: today,
          currentCheckIn: { ...entry, date: today, theme },
          showModal: false,
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
      // Reset store (useful when switching user accounts)
      resetStore: () =>
        set({
          lastCheckInDate: null,
          currentCheckIn: null,
          showModal: false,
        }),
    }),
    {
      name: 'daily-checkin-storage',
      skipHydration: true,
      storage: {
        getItem: (name: string): Promise<any> => {
          try {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            const key = user?.id ? `${name}:${user.id}` : `${name}:anon`;
            return Promise.resolve(localStorage.getItem(key));
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
