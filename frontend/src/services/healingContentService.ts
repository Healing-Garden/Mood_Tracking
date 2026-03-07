import api from '../api/http';

export interface HealingContent {
    _id: string;
    title: string;
    description: string;
    type: 'quote' | 'video' | 'article';
    content?: string;
    videoUrl?: string;
    thumbnail?: string;
    createdAt: string;
    updatedAt: string;
}

export const getHealingContent = async (type?: string): Promise<HealingContent[]> => {
    const params = type ? { type } : {};
    const response = await api.get('/admin/healing-content', { params });
    return response as unknown as HealingContent[];
};

export const createHealingContent = async (data: FormData | Record<string, any>): Promise<HealingContent> => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.post('/admin/healing-content', data, config);
    return response as unknown as HealingContent;
};

export const updateHealingContent = async (id: string, data: FormData | Record<string, any>): Promise<HealingContent> => {
    const config = data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await api.put(`/admin/healing-content/${id}`, data, config);
    return response as unknown as HealingContent;
};

export const deleteHealingContent = async (id: string): Promise<void> => {
    await api.delete(`/admin/healing-content/${id}`);
};
