import http from "./http";

export const TRIGGER_OPTIONS = [
  "Family",
  "Work",
  "Health",
  "Relationships",
  "Finance",
  "Sleep",
  "Social",
  "Self-care",
  "Other",
] as const;

export type TriggerTag = (typeof TRIGGER_OPTIONS)[number];

export interface DailyCheckInPayload {
  mood: number;
  energy: number;
  note?: string;
  triggers?: string[];
}

export interface DailyCheckInResponse {
  _id: string;
  user: string;
  mood: number;
  energy: number;
  note?: string;
  date: string;
  theme: "low" | "neutral" | "positive";
  triggers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodFlowResponse {
  period: "week" | "month" | "year";
  from: string;
  to: string;
  items: DailyCheckInResponse[];
}

export const dailyCheckInApi = {
  submit(
    payload: DailyCheckInPayload
  ): Promise<DailyCheckInResponse> {
    return http.post("/user/checkins", payload) as Promise<DailyCheckInResponse>;
  },

  getToday(): Promise<DailyCheckInResponse> {
    return http.get("/user/checkins/today") as Promise<DailyCheckInResponse>;
  },

  getFlow(period: "week" | "month" | "year" = "week"): Promise<MoodFlowResponse> {
    return http.get(`/user/checkins/flow?period=${period}`) as Promise<MoodFlowResponse>;
  },

  getTriggerHeatmap(period: "week" | "month" | "year" = "month"): Promise<TriggerHeatmapResponse> {
    return http.get(`/user/analytics/trigger-heatmap?period=${period}`) as Promise<TriggerHeatmapResponse>;
  },

  getWordCloud(period: "week" | "month" | "year" = "month"): Promise<WordCloudResponse> {
    return http.get(`/user/analytics/word-cloud?period=${period}`) as Promise<WordCloudResponse>;
  },

  getMoodHistory(month: number, year: number): Promise<MoodHistoryResponse> {
    return http.get(`/user/analytics/mood-history?month=${month}&year=${year}`) as Promise<MoodHistoryResponse>;
  },
};

export interface MoodHistoryItem {
  date: string;
  mood: number;
  theme: "low" | "neutral" | "positive";
}

export interface MoodHistoryResponse {
  month: number;
  year: number;
  items: MoodHistoryItem[];
}

export interface TriggerHeatmapRow {
  trigger: string;
  negative: number;
  neutral: number;
  positive: number;
}

export interface TriggerHeatmapResponse {
  period: string;
  from: string;
  to: string;
  moodLevels: ["negative", "neutral", "positive"];
  rows: TriggerHeatmapRow[];
}

export interface WordCloudWord {
  text: string;
  value: number;
}

export interface WordCloudResponse {
  period: string;
  from: string;
  to: string;
  words: WordCloudWord[];
}

