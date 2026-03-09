export interface Action {
  id: string;
  title: string;
  description: string;
  type: string;        
  duration_min: number;
  difficulty: string;   
  mood_category: string[];
}