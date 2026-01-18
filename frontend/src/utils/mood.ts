import type { MoodType, MoodTheme } from '../types/mood';

const moodEmojis: Record<MoodType, string> = {
  happy: '😊',
  calm: '😌',
  neutral: '😐',
  anxious: '😰',
  sad: '😢',
  hopeful: '🌟',
  energetic: '⚡',
};

const moodThemes: Record<MoodType, MoodTheme> = {
  happy: {
    primary: '#258246',
    secondary: '#65a5f3',
    accent: '#e4ba22',
    background: '#f6f8f9',
    foreground: '#172f21',
  },
  calm: {
    primary: '#4a90e2',
    secondary: '#7bb8d4',
    accent: '#a8d5ba',
    background: '#f0f7ff',
    foreground: '#1a3a52',
  },
  neutral: {
    primary: '#808080',
    secondary: '#a9a9a9',
    accent: '#d3d3d3',
    background: '#f5f5f5',
    foreground: '#333333',
  },
  anxious: {
    primary: '#ff6b6b',
    secondary: '#ffa500',
    accent: '#ffe5b4',
    background: '#fff5f0',
    foreground: '#5c1a1a',
  },
  sad: {
    primary: '#4a5568',
    secondary: '#7ba3c0',
    accent: '#b8c5d6',
    background: '#f0f4f8',
    foreground: '#1a1f2e',
  },
  hopeful: {
    primary: '#f4b942',
    secondary: '#6dd5ed',
    accent: '#a8e6cf',
    background: '#fffef5',
    foreground: '#3d3d3d',
  },
  energetic: {
    primary: '#ff6b35',
    secondary: '#f7931e',
    accent: '#ffb400',
    background: '#fff8f0',
    foreground: '#5c2415',
  },
};

export function getMoodEmoji(mood: MoodType): string {
  return moodEmojis[mood];
}

export function getMoodTheme(mood: MoodType): MoodTheme {
  return moodThemes[mood];
}

export function getAllMoods(): Array<{ value: MoodType; emoji: string; label: string }> {
  return [
    { value: 'happy', emoji: moodEmojis.happy, label: 'Happy' },
    { value: 'calm', emoji: moodEmojis.calm, label: 'Calm' },
    { value: 'neutral', emoji: moodEmojis.neutral, label: 'Neutral' },
    { value: 'anxious', emoji: moodEmojis.anxious, label: 'Anxious' },
    { value: 'sad', emoji: moodEmojis.sad, label: 'Sad' },
    { value: 'hopeful', emoji: moodEmojis.hopeful, label: 'Hopeful' },
    { value: 'energetic', emoji: moodEmojis.energetic, label: 'Energetic' },
  ];
}
