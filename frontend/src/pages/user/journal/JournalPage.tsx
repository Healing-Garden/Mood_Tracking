import { useState, useEffect, useRef} from 'react';
import type { ChangeEvent } from 'react';
import { Button } from '../../../components/ui/Button';
import { Textarea } from '../../../components/ui/Textarea';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import {
  Save,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  Menu,
  X,
  Mic,
  MicOff,
  Search,
  Trash,
  Image as ImageIcon,
} from 'lucide-react';
import DashboardSidebar from '../../../components/layout/DashboardSideBar';
import { useJournalStore } from '../../../store/journalStore';

// Constants
const DAILY_PROMPTS = [
  {
    title: 'How did that moment make you feel?',
    subtitle: 'Take a deep breath and describe the colors of your mood today...',
  },
  {
    title: 'What are you grateful for today?',
    subtitle: 'Share three moments that brought you peace...',
  },
  {
    title: 'Describe your inner weather',
    subtitle: 'What storms or sunshine do you notice within?',
  },
];

const EMOTIONS = [
  'Happy',
  'Sad',
  'Anxious',
  'Grateful',
  'Peaceful',
  'Energized',
  'Overwhelmed',
  'Hopeful',
];

const MOODS = ['😊', '😢', '😡', '😠', '😐', '🙂', '🙃', '😍'];

export default function JournalPage() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'write' | 'entries' | 'search' | 'trash'>('entries');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('😊');
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store
  const {
    addEntry,
    updateEntry,
    deleteEntry,
    getAllEntries,
    getDeletedEntries,
    searchEntries,
  } = useJournalStore();

  const allEntries = getAllEntries();
  const filteredEntries = searchQuery ? searchEntries(searchQuery) : allEntries;
  const deletedEntries = getDeletedEntries();

  // Hydration check
  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages((prev) => [...prev, event.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!content.trim()) {
      alert('Please write something in your journal');
      return;
    }

    setIsSaving(true);
    try {
      const entryData: Partial<JournalEntry> = {
        date: new Date().toISOString().split('T')[0],
        title: title || content.substring(0, 50),
        content,
        mood: selectedMood,
        emotions: selectedEmotions,
        images,
        audioUrl: audioUrl || undefined,
      };

      if (editingId) {
        updateEntry(editingId, entryData);
        setEditingId(null);
      } else {
        addEntry(entryData as JournalEntry);
      }

      // Reset form
      setTitle('');
      setContent('');
      setSelectedMood('😊');
      setSelectedEmotions([]);
      setImages([]);
      setAudioUrl(null);
      setActiveTab('entries');
    } catch (error) {
      console.error('Error saving entry:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    if (confirm('Delete this entry? It will be moved to trash.')) {
      deleteEntry(id);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]
    );
  };

  const currentPrompt = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];

  if (!hydrated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Multimedia Journal</h1>
              <p className="text-sm text-muted-foreground">Capturing your journey of growth</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-4">
                <TabsTrigger value="write" className="gap-2">
                  <Plus size={18} />
                  <span className="hidden sm:inline">Write</span>
                </TabsTrigger>
                <TabsTrigger value="entries" className="gap-2">
                  <BookOpen size={18} />
                  <span className="hidden sm:inline">My Entries</span>
                </TabsTrigger>
                <TabsTrigger value="trash" className="gap-2 hidden lg:flex">
                  <Trash size={18} />
                  Trash
                </TabsTrigger>
              </TabsList>

              {/* Write Tab */}
              <TabsContent value="write" className="space-y-6">
                {/* Daily Prompt */}
                <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
                  <CardHeader className="pb-3">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Daily Sanctuary</p>
                    <CardTitle className="text-2xl mt-2">{currentPrompt.title}</CardTitle>
                    <CardDescription className="text-sm mt-2">{currentPrompt.subtitle}</CardDescription>
                  </CardHeader>
                </Card>

                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {/* Textarea */}
                    <Textarea
                      placeholder="Start your journey here, share your soul..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-56 resize-none text-base"
                    />
                    <p className="text-xs text-right text-muted-foreground">{content.length} characters</p>

                    {/* Mood Selection */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Feeling:</span>
                      <div className="flex gap-1">
                        {MOODS.map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`text-2xl p-1.5 rounded transition-all ${
                              selectedMood === mood ? 'bg-primary/20 scale-110' : 'hover:bg-secondary/50'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Emotions */}
                    <div className="space-y-2">
                      <span className="text-sm font-semibold">Emotions:</span>
                      <div className="flex flex-wrap gap-2">
                        {EMOTIONS.map((emotion) => (
                          <button
                            key={emotion}
                            onClick={() => toggleEmotion(emotion)}
                            className={`px-3 py-1 rounded-full text-xs transition ${
                              selectedEmotions.includes(emotion)
                                ? 'bg-primary text-white'
                                : 'bg-secondary text-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {emotion}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Attachments Row */}
                    <div className="flex items-center gap-3 pt-2 border-t">
                      {/* Image Upload */}
                      <label className="cursor-pointer hover:text-primary transition flex items-center gap-1.5">
                        <ImageIcon size={18} />
                        <span className="text-xs">{images.length > 0 ? `${images.length} images` : 'Images'}</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>

                      {/* Audio Recording */}
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center gap-1.5 text-xs transition ${
                          isRecording ? 'text-red-600 animate-pulse' : 'hover:text-primary'
                        }`}
                      >
                        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                        <span>{audioUrl ? 'Audio attached' : isRecording ? 'Recording...' : 'Voice'}</span>
                      </button>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Action Buttons */}
                      <Button
                        onClick={() => {
                          setContent('');
                          setSelectedMood('😊');
                          setSelectedEmotions([]);
                          setImages([]);
                          setAudioUrl(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="bg-transparent"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveEntry}
                        disabled={!content.trim() || isSaving}
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white gap-1"
                      >
                        <Save size={16} />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Entry ${idx}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-lg"
                        >
                          <X size={20} className="text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Entries Tab */}
              <TabsContent value="entries" className="space-y-4">
                {/* Search Bar */}
                <Input
                  placeholder="Search entries by content, mood, or emotions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10"
                />
                {allEntries.length === 0 ? (
                  <Card className="text-center p-12">
                    <BookOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No entries yet. Start writing your first entry!</p>
                  </Card>
                ) : filteredEntries.length === 0 ? (
                  <Card className="text-center p-12">
                    <Search size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No entries found matching your search</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEntries.map((entry) => (
                      <Card key={entry.id} className="hover:shadow-lg transition-shadow flex flex-col">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl">{entry.mood}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(entry.date).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-base line-clamp-2">{entry.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-1 flex flex-col">
                          <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                          {entry.emotions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {entry.emotions.map((emotion) => (
                                <span key={emotion} className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                                  {emotion}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 pt-2 border-t mt-auto">
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent h-8">
                              Read
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="flex-1 bg-transparent border-red-200 text-red-600 hover:bg-red-50 h-8"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Trash Tab */}
              <TabsContent value="trash" className="space-y-6">
                {deletedEntries.length === 0 ? (
                  <Card className="text-center p-12">
                    <Trash size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No deleted entries</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {deletedEntries.map((entry) => (
                      <Card key={entry.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>{entry.title}</CardTitle>
                              <CardDescription>
                                Deleted {entry.deletedAt && new Date(entry.deletedAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex gap-2">
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">
                            Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-transparent border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Delete Permanently
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}