import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Textarea } from "../../../components/ui/Textarea";
import { Input } from "../../../components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/Tabs";
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
  Lock,
} from "lucide-react";
import { uploadToCloudinary } from "../../../utils/cloudinary";
import { compressImage } from "../../../utils/imageOptimizer";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import { journalApi } from "../../../api/journalApi";
import { userApi } from "../../../api/userApi";
import { aiApi } from "../../../api/aiApi";
import { useAuth } from "../../../hooks/useAuth";
import type {
  SpeechRecognition,
  Journal,
  SpeechRecognitionEvent,
} from "../../../types/journal";
import type { SearchResult } from "../../../types/ai";

declare global {
  interface Window {
    SpeechRecognition?: {
      new(): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new(): SpeechRecognition;
    };
  }
}

const EMOTIONS = [
  "Happy",
  "Sad",
  "Anxious",
  "Grateful",
  "Peaceful",
  "Energized",
  "Overwhelmed",
  "Hopeful",
];

const MOODS = ["😊", "😢", "😡", "😠", "😐", "🙂", "🙃", "😍"];

export default function JournalPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<
    "write" | "entries" | "search" | "trash"
  >("write");
  const [pendingTab, setPendingTab] = useState<
    "write" | "entries" | "search" | "trash" | null
  >(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleTabChange = (v: string) => {
    const targetTab = v as "write" | "entries" | "search" | "trash";
    if (isCheckingLock) return;
    if ((targetTab === "entries" || targetTab === "trash") && (isLocked || isSettingPin)) {
      setPendingTab(targetTab);
      setShowPinModal(true);
      return;
    }
    setActiveTab(targetTab);
  };

  // Form state
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedMood, setSelectedMood] = useState<string>("😊");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<{ searchType: string } | null>(
    null
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>(""); // lưu tạm nội dung nói

  // Store
  const [entries, setEntries] = useState<Journal[]>([]);
  const [deletedEntries, setDeletedEntries] = useState<Journal[]>([]);

  const [selectedEntry, setSelectedEntry] = useState<Journal | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editMood, setEditMood] = useState("");
  const [editEnergy, setEditEnergy] = useState(0);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [voiceFile, setVoiceFile] = useState<File | null>(null);

  const loadEntries = async () => {
    try {
      const data = await journalApi.getAll();
      setEntries(Array.isArray(data) ? data : []);
      console.log("FRONTEND RECEIVED:", data);
      console.log("TYPE:", typeof data);
      console.log("IS ARRAY:", Array.isArray(data));
    } catch (err) {
      console.error("Load entries error:", err);
    }
  };

  const loadDeletedEntries = async () => {
    try {
      const data = await journalApi.getDeleted();
      setDeletedEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load deleted entries error:", err);
    }
  };

  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isSettingPin, setIsSettingPin] = useState<boolean>(false);
  const [isCheckingLock, setIsCheckingLock] = useState<boolean>(true);
  const [pinInput, setPinInput] = useState<string[]>(Array(6).fill(''));
  const [confirmPinInput, setConfirmPinInput] = useState<string[]>(Array(6).fill(''));
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [verifyingPin, setVerifyingPin] = useState<boolean>(false);

  const checkAppLock = async () => {
    try {
      setIsCheckingLock(true);
      if (sessionStorage.getItem("journalUnlocked") === "true") {
        setIsLocked(false);
        setIsCheckingLock(false);
        return;
      }

      const profile = await userApi.getProfile();
      if (!(profile as any).hasAppLockPin) {
        setIsSettingPin(true);
      } else if ((profile as any).appLockEnabled) {
        setIsLocked(true);
      }
    } catch (err) {
      console.error("Check app lock error:", err);
    } finally {
      setIsCheckingLock(false);
    }
  };

  const handleVerifyPin = async () => {
    const pin = pinInput.join('');
    if (pin.length !== 6) return;

    setVerifyingPin(true);
    try {
      await userApi.verifyAppLockPin(pin);
      sessionStorage.setItem("journalUnlocked", "true");
      setIsLocked(false);
      setShowPinModal(false);
      if (pendingTab) setActiveTab(pendingTab);
      setPendingTab(null);
    } catch (err) {
      console.error("PIN verification failed:", err);
      alert("Mã PIN không chính xác");
      setPinInput(Array(6).fill(''));
      document.getElementById('pin-0')?.focus();
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleSetPin = async () => {
    const pin = pinInput.join('');
    const confirmPin = confirmPinInput.join('');

    if (!isConfirming) {
      if (pin.length !== 6) return;
      setIsConfirming(true);
      setTimeout(() => document.getElementById('confirm-pin-0')?.focus(), 100);
      return;
    }

    if (pin !== confirmPin) {
      alert("Mã PIN xác nhận không khớp");
      setConfirmPinInput(Array(6).fill(''));
      document.getElementById('confirm-pin-0')?.focus();
      return;
    }

    setVerifyingPin(true);
    try {
      await userApi.setAppLockPin(pin);
      sessionStorage.setItem("journalUnlocked", "true");
      setIsSettingPin(false);
      setIsLocked(false);
      setShowPinModal(false);
      if (pendingTab) setActiveTab(pendingTab);
      setPendingTab(null);
    } catch (err: any) {
      console.error("Set PIN failed:", err);
      alert(err.message || "Không thể thiết lập mã PIN");
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleBackToSetPin = () => {
    setIsConfirming(false);
    setConfirmPinInput(Array(6).fill(''));
    setTimeout(() => document.getElementById('pin-0')?.focus(), 100);
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>, isConfirm: boolean = false) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      if (isConfirm) {
        document.getElementById(`confirm-pin-${index - 1}`)?.focus();
      } else {
        document.getElementById(`pin-${index - 1}`)?.focus();
      }
    }
  };

  const handlePinInputChange = (index: number, value: string, isConfirm: boolean = false) => {
    const digit = value.replace(/[^0-9]/g, '').slice(0, 1);
    if (isConfirm) {
      const newInput = [...confirmPinInput];
      newInput[index] = digit;
      setConfirmPinInput(newInput);
      if (digit && index < 5) {
        document.getElementById(`confirm-pin-${index + 1}`)?.focus();
      }
    } else {
      const newInput = [...pinInput];
      newInput[index] = digit;
      setPinInput(newInput);
      if (digit && index < 5) {
        document.getElementById(`pin-${index + 1}`)?.focus();
      }
    }
  };

  useEffect(() => {
    checkAppLock();
    loadEntries();
    loadDeletedEntries();
  }, []);

  useEffect(() => {
    if (activeTab === "write" && !content.trim()) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          fetchPromptQuestions();
        }, 5000);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [content, activeTab]);

  const fetchPromptQuestions = async () => {
    if (!user?.id) return;
    try {
      const res = await aiApi.getQuestions(user.id, selectedMood, 3, "en");
      if (res?.data?.success) {
        setSuggestedQuestions(res.data?.data?.questions || []);
      } else if (res?.data?.questions?.length) {
        setSuggestedQuestions(res.data.questions);
      }
    } catch (error) {
      console.error("Failed to fetch questions", error);
    }
  };

  // const filteredEntries = searchQuery
  //   ? entries.filter((entry) =>
  //       entry.text?.toLowerCase().includes(searchQuery.toLowerCase())
  //     )
  //   : entries;

  useEffect(() => {
    if (!searchQuery.trim() || !user?.id) {
      setSearchResults([]);
      setSearchMeta(null);
      setSearchError(null);
      return;
    }

    const handler = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const response = (await aiApi.semanticSearch(user.id, searchQuery, 10)) as any;
        if (response.success) {
          setSearchResults(response.data.results || []);
          setSearchMeta({ searchType: response.data.searchType });
        } else {
          setSearchError("Search failed");
          setSearchResults([]);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSearchError(err.message);
        } else {
          setSearchError("Search error");
        }
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery, user?.id]);

  // Hydration check
  const [hydrated, setHydrated] = useState<boolean>(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    const SpeechRecognitionConstructor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      console.warn("SpeechRecognition not supported");
      return;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.lang = "vi-VN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      transcriptRef.current = transcript;
    };

    speechRecognitionRef.current = recognition;
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
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();

      if (speechRecognitionRef.current) {
        transcriptRef.current = "";
        speechRecognitionRef.current.start();
      }

      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }

    if (transcriptRef.current.trim()) {
      setContent((prev) =>
        prev
          ? prev + " " + transcriptRef.current.trim()
          : transcriptRef.current.trim()
      );
    }

    setIsRecording(false);
  };

  // Image upload
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    setImageFiles((prev) => [...prev, ...newFiles]);

    const previews = newFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  // Save entry
  const handleSaveEntry = async () => {
    if (!content.trim()) {
      alert("Please write something in your journal");
      return;
    }

    setIsSaving(true);

    try {
      // 1️⃣ Parallelize optimization and upload
      const [imageUrls, voiceUrl] = await Promise.all([
        // Optimize and upload all images in parallel
        Promise.all(
          imageFiles.map(async (file) => {
            const compressed = await compressImage(file);
            return uploadToCloudinary(compressed as File);
          })
        ),
        // Upload audio if it exists
        audioBlob
          ? (async () => {
            const audioFile = new File([audioBlob], "voice.webm", {
              type: "audio/webm",
            });
            return uploadToCloudinary(audioFile);
          })()
          : Promise.resolve(null),
      ]);

      // 3️⃣ Gửi URL về backend
      await journalApi.create({
        title: title || "Untitled Entry",
        text: content,
        mood: selectedMood,
        trigger_tags: selectedEmotions,
        images: imageUrls,
        voice_note_url: voiceUrl,
      });

      await loadEntries();

      // Reset
      setTitle("");
      setContent("");
      setSelectedMood("😊");
      setSelectedEmotions([]);
      setImageFiles([]);
      setImagePreviews([]);
      setAudioBlob(null);
      setAudioUrl(null);
      setActiveTab("entries");
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry? It will be moved to trash.")) return;

    try {
      await journalApi.delete(id);
      await loadEntries();
      await loadDeletedEntries();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRestoreEntry = async (id: string) => {
    try {
      await journalApi.restore(id);
      await loadEntries();
      await loadDeletedEntries();
    } catch (error) {
      console.error("Restore error:", error);
    }
  };

  const handlePermanentDeleteEntry = async (id: string) => {
    if (!confirm("Delete this entry PERMANENTLY? This cannot be undone.")) return;

    try {
      await journalApi.permanentDelete(id);
      await loadDeletedEntries();
    } catch (error) {
      console.error("Permanent delete error:", error);
    }
  };

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    );
  };

  if (!hydrated) return null;

  // We removed the top-level early returns for PIN check
  // and moved the logic down so "write" tab is always accessible.

  return (
    <DashboardLayout title="Multimedia Journal">
      <div className="max-w-6xl mx-auto p-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList className="w-full grid-cols-3 lg:grid-cols-4 p-1 bg-secondary/50 rounded-lg">
            <TabsTrigger value="write" className="gap-2 flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:bg-white/50">
              <Plus size={16} />
              <span className="hidden sm:inline">Write</span>
            </TabsTrigger>
            <TabsTrigger value="entries" className="gap-2 flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:bg-white/50">
              <BookOpen size={16} />
              <span className="hidden sm:inline">My Entries</span>
            </TabsTrigger>
            <TabsTrigger value="trash" className="gap-2 hidden lg:flex flex-1 items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm text-muted-foreground hover:bg-white/50">
              <Trash size={16} />
              Trash
            </TabsTrigger>
          </TabsList>

          {/* Write Tab */}
          <TabsContent value="write" className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                {suggestedQuestions.length > 0 && (
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      ✨ Writing Suggestions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((q, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setContent(
                              (prev) => prev + (prev ? "\n" : "") + q
                            )
                          }
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Title Input */}
                <Input
                  placeholder="Journal Title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold"
                />

                {/* Textarea */}
                <Textarea
                  placeholder="Start your journey here, share your soul..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-56 resize-none text-base"
                />
                <p className="text-xs text-right text-muted-foreground">
                  {content.length} characters
                </p>

                {/* Mood Selection */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">Feeling:</span>
                  <div className="flex gap-1">
                    {MOODS.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setSelectedMood(mood)}
                        className={`text-2xl p-1.5 rounded transition-all ${selectedMood === mood
                          ? "bg-primary/20 scale-110"
                          : "hover:bg-secondary/50"
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
                        className={`px-3 py-1 rounded-full text-xs transition ${selectedEmotions.includes(emotion)
                          ? "bg-primary text-white"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
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
                    <span className="text-xs">
                      {imagePreviews.length > 0
                        ? `${imagePreviews.length} images`
                        : "Images"}
                    </span>

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
                    className={`flex items-center gap-1.5 text-xs transition ${isRecording
                      ? "text-red-600 animate-pulse"
                      : "hover:text-primary"
                      }`}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    <span>
                      {audioUrl
                        ? "Audio attached"
                        : isRecording
                          ? "Recording..."
                          : "Voice"}
                    </span>
                  </button>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Action Buttons */}
                  <Button
                    onClick={() => {
                      setContent("");
                      setSelectedMood("😊");
                      setSelectedEmotions([]);
                      setImageFiles([]);
                      setImagePreviews([]);
                      setAudioBlob(null);
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
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imagePreviews.map((img, idx) => (
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

            {searchQuery.trim() ? (
              // Kết quả tìm kiếm semantic
              isSearching ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : searchError ? (
                <Card className="text-center p-12 border-red-200">
                  <p className="text-red-600">{searchError}</p>
                </Card>
              ) : searchResults.length === 0 ? (
                <Card className="text-center p-12">
                  <Search
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-muted-foreground">
                    No entries match your search
                  </p>
                </Card>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Found {searchResults.length} results
                    {searchMeta?.searchType &&
                      ` (${searchMeta.searchType} search)`}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {searchResults.map((result) => (
                      <Card
                        key={result.entry_id}
                        className="hover:shadow-lg transition-shadow flex flex-col"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-2xl">
                              {result.mood || "😐"}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar size={14} />
                              {new Date(
                                result.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-base line-clamp-2">
                            Similarity:{" "}
                            {(result.similarity * 100).toFixed(1)}%
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 flex-1 flex flex-col">
                          <p
                            className="text-sm text-muted-foreground line-clamp-3"
                            dangerouslySetInnerHTML={{
                              __html: result.highlighted_text ?? "",
                            }}
                          />
                          <div className="flex gap-2 pt-2 border-t mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-transparent h-8"
                              onClick={() => {
                                // Xử lý xem chi tiết entry, có thể mở modal hoặc chuyển trang
                                console.log("View entry", result.entry_id);
                              }}
                            >
                              Read
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDeleteEntry(result.entry_id)
                              }
                              className="flex-1 bg-transparent border-red-200 text-red-600 hover:bg-red-50 h-8"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ) : // Hiển thị tất cả entries khi không tìm kiếm
              entries.length === 0 ? (
                <Card className="text-center p-12">
                  <BookOpen
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-muted-foreground">
                    No entries yet. Start writing your first entry!
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {entries.map((entry) => (
                    <Card
                      key={entry._id}
                      className="hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-2xl">{entry.mood}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(entry.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <CardTitle className="text-base line-clamp-2">
                          {entry.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {entry.text}
                        </p>
                        <div className="flex gap-2 pt-2 border-t mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent h-8"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setEditTitle(entry.title);
                              setEditContent(entry.text);
                              setEditMood(entry.mood);
                              setEditEnergy(entry.energy_level);

                              setNewImages([]);
                              setPreviewImages([]);
                              setRemovedImages([]);
                              setVoiceFile(null);

                              setIsEditMode(false);
                            }}
                          >
                            Read
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEntry(entry._id)}
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
                <Trash
                  size={48}
                  className="mx-auto text-muted-foreground mb-4"
                />
                <p className="text-muted-foreground">No deleted entries</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {deletedEntries.map((entry) => {
                  const deleteDate = entry.deleted_at ? new Date(entry.deleted_at) : new Date();
                  const expiryDate = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                  const now = new Date();
                  const diffDays = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                  return (
                    <Card key={entry._id} className="border-red-100 bg-red-50/10">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{entry.title}</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar size={12} />
                              Deleted on: {deleteDate.toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffDays <= 3 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                            }`}>
                            {diffDays > 0 ? `${diffDays} days left` : "Expiring soon"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleRestoreEntry(entry._id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        >
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePermanentDeleteEntry(entry._id)}
                          className="text-red-600 hover:bg-red-50 border-red-200 h-8"
                        >
                          Delete Permanently
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* PIN Lock Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm p-8 flex flex-col items-center text-center shadow-xl border-primary/20 bg-white rounded-3xl relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
              onClick={() => {
                setShowPinModal(false);
                setPendingTab(null);
                setPinInput(Array(6).fill(''));
                setConfirmPinInput(Array(6).fill(''));
                setIsConfirming(false);
              }}
            >
              <X size={20} />
            </button>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">
              {isSettingPin
                ? (isConfirming ? "Confirm Your PIN" : "Protect Your Journal")
                : "Journal Protected"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isSettingPin
                ? (isConfirming
                  ? "Please re-enter your 6-digit PIN to confirm"
                  : "Set a 6-digit PIN to view past entries")
                : "Please enter your 6-digit PIN to access past entries"}
            </p>

            <div className="grid grid-cols-6 gap-2 mb-6 w-full">
              {(isConfirming ? confirmPinInput : pinInput).map((digit, i) => (
                <Input
                  key={i}
                  id={isConfirming ? `confirm-pin-${i}` : `pin-${i}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinInputChange(i, e.target.value, isConfirming)}
                  onKeyDown={(e) => handlePinKeyDown(i, e, isConfirming)}
                  className="w-full h-10 text-center text-lg font-bold border-2 focus:border-primary rounded-lg px-0"
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <div className="space-y-3 w-full">
              <Button
                onClick={isSettingPin ? handleSetPin : handleVerifyPin}
                disabled={
                  (isSettingPin && (!isConfirming && pinInput.some((d) => !d))) ||
                  (isSettingPin && (isConfirming && confirmPinInput.some((d) => !d))) ||
                  (!isSettingPin && pinInput.some((d) => !d)) ||
                  verifyingPin
                }
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white rounded-xl text-base font-semibold"
              >
                {verifyingPin
                  ? (isSettingPin ? "Saving..." : "Verifying...")
                  : (isSettingPin ? (isConfirming ? "Confirm & Lock" : "Next") : "Unlock Journals")}
              </Button>

              {isSettingPin && isConfirming && (
                <Button
                  variant="outline"
                  onClick={handleBackToSetPin}
                  className="w-full h-11 border-2 rounded-xl text-base font-semibold"
                >
                  Back
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 relative">
            {/* Close */}
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
              onClick={() => setSelectedEntry(null)}
            >
              ✕
            </button>

            {/* TITLE */}
            <div className="mb-4">
              {isEditMode ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              ) : (
                <h2 className="text-2xl font-bold">{selectedEntry.title}</h2>
              )}
            </div>

            {/* MOOD + ENERGY */}
            <div className="flex gap-4 mb-4 items-center">
              {isEditMode ? (
                <>
                  <Input
                    value={editMood}
                    onChange={(e) => setEditMood(e.target.value)}
                    placeholder="Mood 😄"
                    className="w-32"
                  />
                  <Input
                    type="number"
                    value={editEnergy}
                    onChange={(e) => setEditEnergy(Number(e.target.value))}
                    className="w-24"
                  />
                </>
              ) : (
                <>
                  <span className="text-2xl">{selectedEntry.mood}</span>
                  <span className="text-gray-600">
                    Energy: {selectedEntry.energy_level}
                  </span>
                </>
              )}
            </div>

            {/* TEXT */}
            <div className="mb-6">
              {isEditMode ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-40"
                />
              ) : (
                <p className="whitespace-pre-line text-gray-700">
                  {selectedEntry.text}
                </p>
              )}
            </div>

            {/* OLD IMAGES */}
            {selectedEntry.images?.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedEntry.images
                  .filter((img) => !removedImages.includes(img))
                  .map((img: string, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt="journal"
                        className="rounded-lg object-cover w-full h-40"
                      />

                      {isEditMode && (
                        <button
                          onClick={() =>
                            setRemovedImages((prev) => [...prev, img])
                          }
                          className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
                        >
                          X
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
            {/* NEW IMAGE PREVIEW */}
            {previewImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                {previewImages.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    className="rounded-lg object-cover w-full h-40"
                  />
                ))}
              </div>
            )}

            {isEditMode && (
              <>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="mb-3"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewImages(files);
                    setPreviewImages(files.map((f) => URL.createObjectURL(f)));
                  }}
                />

                <input
                  type="file"
                  accept="audio/*"
                  className="mb-3"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setVoiceFile(e.target.files[0]);
                    }
                  }}
                />
              </>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              {isEditMode ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancel
                  </Button>

                  <Button
                    onClick={async () => {
                      if (!selectedEntry) return;

                      try {
                        // 1️⃣ Optimize and upload new images in parallel
                        const uploadedNewImagesPromise = Promise.all(
                          newImages.map(async (file) => {
                            const compressed = await compressImage(file);
                            return uploadToCloudinary(compressed as File);
                          })
                        );

                        // 2️⃣ Upload audio if it exists
                        const uploadedVoiceUrlPromise = voiceFile
                          ? uploadToCloudinary(voiceFile)
                          : Promise.resolve(selectedEntry.voice_note_url || null);

                        // Wait for all uploads to complete in parallel
                        const [uploadedNewImages, uploadedVoiceUrl] = await Promise.all([
                          uploadedNewImagesPromise,
                          uploadedVoiceUrlPromise
                        ]);

                        // Giữ lại ảnh cũ không bị xóa
                        const remainingOldImages = selectedEntry.images.filter(
                          (img) => !removedImages.includes(img)
                        );

                        await journalApi.update(selectedEntry._id, {
                          title: editTitle,
                          mood: editMood,
                          energy_level: editEnergy,
                          text: editContent,
                          trigger_tags: selectedEntry.trigger_tags || [],
                          images: [...remainingOldImages, ...uploadedNewImages],
                          voice_note_url: uploadedVoiceUrl,
                        });

                        await loadEntries();

                        setSelectedEntry(null);
                        setIsEditMode(false);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditMode(true)}>Edit</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
