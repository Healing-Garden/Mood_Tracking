// src/contexts/MoodThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Mood = 'happy' | 'calm' | 'neutral' | 'anxious' | 'sad' | 'hopeful' | 'energetic';

interface MoodColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

const MOOD_THEMES: Record<Mood, MoodColors> = {
  happy: {
    primary: '156 55% 39%',
    secondary: '45 95% 50%',
    accent: '210 90% 75%',
    background: '0 0% 100%',
  },
  calm: {
    primary: '210 90% 75%',
    secondary: '156 55% 39%',
    accent: '120 40% 65%',
    background: '210 40% 98%',
  },
  neutral: {
    primary: '156 55% 39%',
    secondary: '210 90% 75%',
    accent: '45 95% 50%',
    background: '0 0% 100%',
  },
  anxious: {
    primary: '210 90% 65%',
    secondary: '45 85% 60%',
    accent: '120 40% 65%',
    background: '45 40% 98%',
  },
  sad: {
    primary: '210 70% 60%',
    secondary: '45 80% 65%',
    accent: '120 50% 70%',
    background: '210 40% 98%',
  },
  hopeful: {
    primary: '45 95% 50%',
    secondary: '156 55% 39%',
    accent: '210 90% 75%',
    background: '45 40% 98%',
  },
  energetic: {
    primary: '335 80% 65%',
    secondary: '45 95% 50%',
    accent: '156 55% 39%',
    background: '0 0% 100%',
  },
};

interface MoodThemeContextType {
  mood: Mood;
  setMood: React.Dispatch<React.SetStateAction<Mood>>;
}

const MoodThemeContext = createContext<MoodThemeContextType | undefined>(undefined);

export function MoodThemeProvider({ children }: { children: React.ReactNode }) {
  const [mood, setMood] = useState<Mood>('neutral');

  useEffect(() => {
    const savedMood = localStorage.getItem('userMood') as Mood | null;
    if (savedMood && MOOD_THEMES[savedMood]) {
      setMood(savedMood);
    }
  }, []);

  useEffect(() => {
    const colors = MOOD_THEMES[mood];
    document.documentElement.style.setProperty('--primary', colors.primary);
    document.documentElement.style.setProperty('--secondary', colors.secondary);
    document.documentElement.style.setProperty('--accent', colors.accent);
    document.documentElement.style.setProperty('--background', colors.background);
    localStorage.setItem('userMood', mood);
  }, [mood]);

  return (
    <MoodThemeContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodThemeContext.Provider>
  );
}

export function useMoodTheme(): MoodThemeContextType {
  const context = useContext(MoodThemeContext);
  if (!context) {
    throw new Error('useMoodTheme must be used within a MoodThemeProvider');
  }
  return context;
}