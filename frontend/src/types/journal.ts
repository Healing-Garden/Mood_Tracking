export interface JournalVersion {
  id: string
  content: string
  images: string[]
  audioUrl?: string
  timestamp: number
  changes: string
}

export interface JournalEntry {
  id: string
  date: string
  title: string
  content: string
  images: string[]
  audioUrl?: string
  mood: string
  emotions: string[]
  suggestedPrompts?: string[]
  versions: JournalVersion[]
  isDeleted: boolean
  deletedAt?: number
  createdAt: number
  updatedAt: number
}

export interface JournalState {
  entries: JournalEntry[]
  addEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt' | 'versions' | 'isDeleted'>) => string
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void
  restoreEntry: (id: string) => void
  permanentlyDeleteEntry: (id: string) => void
  getEntryById: (id: string) => JournalEntry | undefined
  getAllEntries: () => JournalEntry[]
  getDeletedEntries: () => JournalEntry[]
  searchEntries: (query: string) => JournalEntry[]
  getEntryVersions: (id: string) => JournalVersion[]
  restoreVersion: (entryId: string, versionId: string) => void
}

export interface JournalRequest {
  title: string;
  text: string;
  mood: string;
  energy_level?: number;
  trigger_tags: string[];
  images: string[];
  voice_note_url?: string | null;
}

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

export interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
    confidence: number;
  };
}

export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResult[];
}

export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;

  start(): void;
  stop(): void;

  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}