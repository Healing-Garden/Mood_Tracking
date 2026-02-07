import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JournalEntry, JournalState } from '../types/journal'

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entry) => {
        const id = Date.now().toString()
        const newEntry: JournalEntry = {
          ...entry,
          id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          versions: [
            {
              id: '1',
              content: entry.content,
              images: entry.images,
              audioUrl: entry.audioUrl,
              timestamp: Date.now(),
              changes: 'Initial entry',
            },
          ],
          isDeleted: false,
        }
        set((state) => ({
          entries: [newEntry, ...state.entries],
        }))
        return id
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === id && !entry.isDeleted) {
              const updatedEntry = { ...entry, ...updates, updatedAt: Date.now() }
              if (updates.content !== entry.content || JSON.stringify(updates.images) !== JSON.stringify(entry.images)) {
                updatedEntry.versions = [
                  {
                    id: Date.now().toString(),
                    content: updates.content || entry.content,
                    images: updates.images || entry.images,
                    audioUrl: updates.audioUrl || entry.audioUrl,
                    timestamp: Date.now(),
                    changes: `Updated at ${new Date().toLocaleTimeString()}`,
                  },
                  ...entry.versions,
                ]
              }
              return updatedEntry
            }
            return entry
          }),
        }))
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, isDeleted: true, deletedAt: Date.now() } : entry
          ),
        }))
      },

      restoreEntry: (id) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, isDeleted: false, deletedAt: undefined } : entry
          ),
        }))
      },

      permanentlyDeleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }))
      },

      getEntryById: (id) => {
        return get().entries.find((entry) => entry.id === id && !entry.isDeleted)
      },

      getAllEntries: () => {
        return get()
          .entries.filter((entry) => !entry.isDeleted)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },

      getDeletedEntries: () => {
        return get()
          .entries.filter((entry) => entry.isDeleted)
          .sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0))
      },

      searchEntries: (query) => {
        const lowerQuery = query.toLowerCase()
        return get()
          .entries.filter(
            (entry) =>
              !entry.isDeleted &&
              (entry.title.toLowerCase().includes(lowerQuery) ||
                entry.content.toLowerCase().includes(lowerQuery) ||
                entry.emotions.some((e) => e.toLowerCase().includes(lowerQuery)))
          )
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      },

      getEntryVersions: (id) => {
        const entry = get().entries.find((e) => e.id === id)
        return entry?.versions || []
      },

      restoreVersion: (entryId, versionId) => {
        set((state) => ({
          entries: state.entries.map((entry) => {
            if (entry.id === entryId) {
              const versionToRestore = entry.versions.find((v) => v.id === versionId)
              if (versionToRestore) {
                return {
                  ...entry,
                  content: versionToRestore.content,
                  images: versionToRestore.images,
                  audioUrl: versionToRestore.audioUrl,
                  versions: [
                    {
                      id: Date.now().toString(),
                      content: versionToRestore.content,
                      images: versionToRestore.images,
                      audioUrl: versionToRestore.audioUrl,
                      timestamp: Date.now(),
                      changes: `Restored from version ${versionToRestore.timestamp}`,
                    },
                    ...entry.versions,
                  ],
                  updatedAt: Date.now(),
                }
              }
            }
            return entry
          }),
        }))
      },
    }),
    {
      name: 'journal-storage',
      skipHydration: true,
    }
  )
)
