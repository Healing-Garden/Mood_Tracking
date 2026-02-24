export type SessionStatus =
  | 'active'
  | 'ended'
  | 'interrupted'
  | 'crisis';

export type SessionState =
  | 'initial'
  | 'assessment'
  | 'intervention'
  | 'closure';

export type SentimentType =
  | 'positive'
  | 'negative'
  | 'neutral';

export interface Sentiment {
  sentiment: SentimentType;
  score: number;
  confidence: number;
  emotions?: Array<{
    label: string;
    score: number;
  }>;
}

export interface MoodContext {
  recentMood: string;     
  energyLevel: number;     
  timestamp: Date | string;
}

export interface ChatMessage {
  _id?: string;
  id?: string;           
  sessionId?: string;    

  sender: 'user' | 'bot';
  text: string;
  timestamp: Date | string;

  sentiment?: Sentiment;
  intent?: string;

  technique?: string;      
  exercise?: string;

  isCrisis?: boolean;  
}

export interface ChatSession {
  _id: string;
  userId: string;             

  startTime: Date;              
  endTime?: Date;               

  status: SessionStatus;
  currentState: SessionState;

  riskLevel: number;          
  cbtTechniquesUsed: string[]; 

  sessionSummary?: string;     

  moodContext?: MoodContext;  

  metadata?: Record<string, unknown>;

  createdAt: Date;           
  updatedAt: Date;             
}

export interface DailySummary {
  keyTheme: string;
  growthMoment: string;
  quote: string;
}
