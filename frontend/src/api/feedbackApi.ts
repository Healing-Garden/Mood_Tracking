import http from './http';

export type FeedbackType = 'feature' | 'bug' | 'content_rating';
export type FeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export interface FeedbackSubmission {
    type: FeedbackType;
    subject: string;
    message: string;
    rating?: number;
}

export interface FeedbackRecord extends FeedbackSubmission {
    _id: string;
    user_id: string;
    status: FeedbackStatus;
    admin_response: string;
    created_at: string;
    updated_at: string;
}

export interface FeedbackResponse {
    success: boolean;
    message: string;
    data: FeedbackRecord;
}

export interface FeedbackHistoryResponse {
    success: boolean;
    data: FeedbackRecord[];
}

export const feedbackApi = {
    /**
     * Submit new feedback
     */
    submit: async (data: FeedbackSubmission): Promise<FeedbackResponse> => {
        const res = await http.post<FeedbackResponse>('/feedback/submit', data);
        return res.data;
    },

    /**
     * Get feedback history for current user
     */
    getHistory: async (): Promise<FeedbackHistoryResponse> => {
        const res = await http.get<FeedbackHistoryResponse>('/feedback/my-history');
        return res.data;
    }
};
