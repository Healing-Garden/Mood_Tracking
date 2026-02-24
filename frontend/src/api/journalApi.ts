import http from "./http";

export interface Journal {
  _id: string;
  title: string;             
  mood: string;
  energy_level: number;
  text: string;
  images: string[];
  voice_note_url?: string;
  trigger_tags: string[];
  created_at: string;
  deleted_at?: string | null;
}

export const journalApi = {
  // CREATE (multipart)
  async create(formData: FormData): Promise<Journal> {
    const res = await http.post("/journals", formData, {
    });
    return res.data;
  },

  async getAll(): Promise<Journal[]> {
    const res = await http.get("/journals");
    return res.data;
  },

  async getDeleted(): Promise<Journal[]> {
    const res = await http.get("/journals/deleted");
    return res.data;
  },

  async search(query: string): Promise<Journal[]> {
    const res = await http.get(`/journals/search?q=${query}`);
    return res.data;
  },

  async update(id: string, formData: FormData): Promise<Journal> {
    const res = await http.put(`/journals/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
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
