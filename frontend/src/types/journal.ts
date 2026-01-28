import type { MoodType } from "./mood";

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: MoodType;
  energy: number;
  tags: string[];
  attachments?: string[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}