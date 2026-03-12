export interface Action {
  id: string;
  title: string;
  description: string;
  type: string; // "quote" | "video" | "podcast"
  duration_seconds: number;
  difficulty: string; // "easy" | "medium" | "hard"
  mood_category: string[];
  thumbnail?: string | null;
  video_url?: string | null;
  content?: string | null;
}