export interface Action {
  id: string;
  title: string;
  description: string;
  type: string;
  duration_seconds: number;
  difficulty: string;
  mood_category: string[];
}