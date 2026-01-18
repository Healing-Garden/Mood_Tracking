import type { MoodType } from "./mood";

export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  height?: number;
  weight?: number;
  avatar?: string;
  moodTrackingGoals?: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface AuthError {
  message: string;
  code: string;
}

export interface UserProfile extends User {
  totalCheckIns: number;
  currentStreak: number;
  averageMood: MoodType;     
  journalEntries: number;
}