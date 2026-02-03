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

export const dailyCheckInApi = {
  submit(
    payload: DailyCheckInPayload
  ): Promise<DailyCheckInResponse> {
    return http.post("/user/checkins", payload) as Promise<DailyCheckInResponse>;
  },

  getToday(): Promise<DailyCheckInResponse> {
    return http.get("/user/checkins/today") as Promise<DailyCheckInResponse>;
  },
};

