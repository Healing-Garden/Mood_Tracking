export type MoodType = 'happy' | 'calm' | 'neutral' | 'anxious' | 'sad' | 'hopeful' | 'energetic';

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodType;
  energy: number;
  notes?: string;
  timestamp: string;
}

export interface MoodTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
}