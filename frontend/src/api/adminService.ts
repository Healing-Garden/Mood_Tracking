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
    }
};
