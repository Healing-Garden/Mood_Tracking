import http from './http';
import type { ChatSession, ChatMessage, DailySummary } from '../types/chat';

export const chatApi = {
    getUserSessions: async (userId: string): Promise<ChatSession[]> => {
        const res = await http.get<{ success: boolean; data: ChatSession[] }>(`/chat/sessions/${userId}`);
        return Array.isArray(res.data) ? res.data : [];
    },

    getSessionDetail: async (
        sessionId: string
    ): Promise<{ session: ChatSession; messages: ChatMessage[] }> => {
        const res = await http.get<{ success: boolean; data: { session: ChatSession; messages: ChatMessage[] } }>(
            `/chat/session/${sessionId}`
        );
        return res.data;
    },

    saveJournalNote: async (sessionId: string, note: string): Promise<void> => {
        await http.post(`/chat/session/${sessionId}/journal`, { note });
    },

    getDailySummary: async (userId: string): Promise<DailySummary> => {
        const res = await http.post<{ summary: DailySummary }>(`/ai/summary/daily`, { userId });
        return res.summary;
    },

    saveSession: async (sessionData: ChatSession): Promise<void> => {
        await http.post('/chat/sessions', sessionData);
    },

    deleteSession: async (sessionId: string): Promise<void> => {
        await http.delete(`/chat/session/${sessionId}`);
    },

    loadSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const res = await http.get<{ success: boolean; messages: ChatMessage[] }>(`/chat/session/${sessionId}/messages`);
        return Array.isArray(res.messages) ? res.messages : [];
    }
};