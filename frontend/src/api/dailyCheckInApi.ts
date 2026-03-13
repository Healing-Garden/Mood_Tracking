import http from "./http";

export const TRIGGER_OPTIONS = [
  "Family",
  "Work",
  "Health",
  "Relationships",
  "Friends",
  "Study",
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
  theme: "negative" | "neutral" | "positive";
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

  getAnalyticsSummary(period: "week" | "month" | "year" = "month"): Promise<SummaryResponse> {
    return http.get(`/user/analytics/summary?period=${period}`) as Promise<SummaryResponse>;
  },

  getDashboardData(): Promise<DashboardData> {
    return http.get("/user/dashboard/data") as Promise<DashboardData>;
  },
};

export interface DashboardData {
  journeyDays: number;
  weeklyStats: {
    checkIns: number;
    avgMood: number;
    journalEntries: number;
    insightsGenerated: number;
  };
  moodDistribution: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export interface SummaryResponse {
  period: string;
  current: {
    avgMood: number;
    consistency: number;
    journalEntries: number;
    insightCount: number;
  };
  previous: {
    avgMood: number;
    consistency: number;
    journalEntries: number;
    insightCount: number;
  };
  moodTrend: number;
}

export interface MoodHistoryItem {
  date: string;
  mood: number;
  theme: "negative" | "neutral" | "positive";
  note?: string;
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

