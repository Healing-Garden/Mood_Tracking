import http from "./http";

export interface UserDTO {
    _id: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    isBanned: boolean;
    role: string;
    createdAt: string;
    accountStatus: string;
    banExpiresAt?: string;
    banReason?: string;
}

export interface FeedbackDTO {
    _id: string;
    user_id: {
        _id: string;
        fullName: string;
        email: string;
    };
    type: string;
    subject: string;
    message: string;
    rating?: number;
    status: string;
    admin_response?: string;
    created_at: string;
    updated_at: string;
}

export const adminService = {
    getUsers: (search?: string): Promise<UserDTO[]> => {
        const query = search ? `?search=${encodeURIComponent(search)}` : "";
        return http.get(`/admin/users${query}`) as Promise<UserDTO[]>;
    },

    banUser: (userId: string, data: { durationDays: number, reason: string }): Promise<{ message: string, user: UserDTO }> => {
        return http.patch(`/admin/users/${userId}/ban`, data) as Promise<{ message: string, user: UserDTO }>;
    },

    unbanUser: (userId: string): Promise<{ message: string, user: UserDTO }> => {
        return http.patch(`/admin/users/${userId}/unban`) as Promise<{ message: string, user: UserDTO }>;
    },

    getAllFeedback: (): Promise<FeedbackDTO[]> => {
        return http.get('/admin/feedback') as Promise<FeedbackDTO[]>;
    },

    updateFeedbackStatus: (id: string, status: string): Promise<{ message: string, feedback: FeedbackDTO }> => {
        return http.patch(`/admin/feedback/${id}/status`, { status }) as Promise<{ message: string, feedback: FeedbackDTO }>;
    }
};
