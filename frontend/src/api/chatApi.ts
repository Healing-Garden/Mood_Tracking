import http from './http';
import type { ChatSession, ChatMessage, DailySummary } from '../types/chat';

export const chatApi = {
    getUserSessions: async (userId: string): Promise<ChatSession[]> => {
        const res: any = await http.get(`/chat/sessions/${userId}`);
        return Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    },

    getSessionDetail: async (
        sessionId: string
    ): Promise<{ session: ChatSession; messages: ChatMessage[] }> => {
        const res: any = await http.get(`/chat/session/${sessionId}`);
        return res.data || res;
    },

    saveJournalNote: async (sessionId: string, note: string): Promise<void> => {
        await http.post(`/chat/session/${sessionId}/journal`, { note });
    },

    getDailySummary: async (userId: string): Promise<DailySummary> => {
        const res: any = await http.post(`/ai/summary/daily`, { userId });
        return res.summary || res;
    },

    saveSession: async (sessionData: ChatSession): Promise<void> => {
        await http.post('/chat/sessions', sessionData);
    },

    deleteSession: async (sessionId: string): Promise<void> => {
        await http.delete(`/chat/session/${sessionId}`);
    },

    loadSessionMessages: async (sessionId: string): Promise<ChatMessage[]> => {
        const res: any = await http.get(`/chat/session/${sessionId}/messages`);
        return Array.isArray(res.messages) ? res.messages : (Array.isArray(res) ? res : []);
    }
};