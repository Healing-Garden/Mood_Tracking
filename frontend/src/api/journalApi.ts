import http from "./http";
import type { Journal, JournalRequest } from "../types/journal";

export const journalApi = {
  async create(data: JournalRequest): Promise<Journal> {
    const res = await http.post("/journals", data);
    return res.data;
  },

  async getAll(): Promise<Journal[]> {
    return await http.get("/journals");
  },

  async getDeleted(): Promise<Journal[]> {
    return await http.get("/journals/deleted");
  },

  async search(query: string): Promise<Journal[]> {
    return await http.get(`/journals/search?q=${query}`);
  },

  async update(id: string, data: JournalRequest): Promise<Journal> {
    return await http.put(`/journals/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/journals/${id}`);
  },

  async restore(id: string): Promise<void> {
    await http.patch(`/journals/${id}/restore`);
  },

  async permanentDelete(id: string): Promise<void> {
    await http.delete(`/journals/${id}/permanent`);
  },
};
