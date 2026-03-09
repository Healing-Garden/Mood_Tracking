import { create } from 'zustand';
import type { Action } from '../types/action';

interface ActionSuggestionState {
  isOpen: boolean;
  mood: string | null;
  actions: Action[];
  excludeIds: string[];
  loading: boolean;
  error: string | null;
  openModal: (mood: string) => void;
  closeModal: () => void;
  setActions: (actions: Action[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addExcludeIds: (ids: string[]) => void;
  reset: () => void;
}

export const useActionSuggestionStore = create<ActionSuggestionState>((set, get) => ({
  isOpen: false,
  mood: null,
  actions: [],
  excludeIds: [],
  loading: false,
  error: null,
  openModal: (mood) => set({ isOpen: true, mood, excludeIds: [], actions: [], error: null }),
  closeModal: () => set({ isOpen: false, mood: null, actions: [], excludeIds: [], error: null }),
  setActions: (actions) => set({ actions }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addExcludeIds: (ids) => set((state) => ({ excludeIds: [...state.excludeIds, ...ids] })),
  reset: () => set({ isOpen: false, mood: null, actions: [], excludeIds: [], loading: false, error: null }),
}));