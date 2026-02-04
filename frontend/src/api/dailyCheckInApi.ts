import http from "./http";

export interface DailyCheckInPayload {
  mood: number;
  energy: number;
  note?: string;
}

export interface DailyCheckInResponse {
  _id: string;
  user: string;
  mood: number;
  energy: number;
  note?: string;
  date: string;
  theme: "low" | "neutral" | "positive";
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
};

