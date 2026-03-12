import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Send, Brain, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useChat } from '../../../hooks/useChat';
import ChatSidebar from '../../../components/features/ChatSidebar';
import DashboardLayout from '../../../components/layout/DashboardLayout';

// Hàm lấy mood context (có thể gọi API hoặc từ store)
const getMoodContext = () => {
  return {
    recentMood: 'anxious',
    energyLevel: 3,
    timestamp: new Date().toISOString(),
  };
};

export default function ChatBot() {
  const { user, loading } = useAuth();
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chỉ kết nối chat khi có user
  const moodContext = useMemo(() => getMoodContext(), []);
  const {
    messages,
    sendMessage,
    isConnected,
    isTyping,
    sessionId,
    loadSession,
    newSession,
    resetSession
  } = useChat(user?.id || '', moodContext);

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!userInput.trim() || !isConnected) return;
    sendMessage(userInput);
    setUserInput('');
  };

  const handleNewSession = () => {
    newSession();
  };

  const handleSessionSelect = async (sessionId: string) => {
    await loadSession(sessionId);
  };

  const handleSessionDelete = (deletedSessionId: string) => {
    // If the user deleted the currently-open session, reset UI but do NOT auto-create a new session
    if (deletedSessionId === sessionId) {
      resetSession();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-primary" size={32} />
          <p className="text-muted-foreground font-medium">Loading your thought partner...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-border max-w-sm">
          <Brain className="mx-auto mb-4 text-primary opacity-20" size={64} />
          <p className="text-lg font-semibold mb-2 text-foreground">Authentication Required</p>
          <p className="text-muted-foreground mb-6">Please log in to use the AI Thought Partner.</p>
          <Button onClick={() => (globalThis.location.href = '/login')} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      title="AI Thought Partner"
    >
      <div className="h-full flex overflow-hidden">
        {/* Chat History Sidebar */}
        <ChatSidebar
          userId={user.id}
          currentSessionId={sessionId}
          onNewSession={handleNewSession}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md p-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="text-primary" size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Your Mental Well-being Companion
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    I'm here to listen, reflect, and support you. Share what's on your mind, and let's navigate your thoughts together.
                  </p>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-2xl shadow-sm ${msg.sender === 'bot'
                    ? 'bg-primary text-white'
                    : 'bg-muted/30 text-foreground border border-border/50'
                    }`}
                >
                  {msg.sender === 'bot' && (
                    <p className="text-[10px] font-bold uppercase mb-1.5 opacity-70 tracking-widest flex items-center gap-1.5">
                      <Brain size={12} />
                      Thought Partner
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.exercise && (
                    <div className="mt-3 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                      <p className="font-bold text-xs mb-1 flex items-center gap-1.5">
                        <span className="text-sm">💡</span> Suggested Exercise
                      </p>
                      <p className="text-sm opacity-90">{msg.exercise}</p>
                    </div>
                  )}
                  {msg.isCrisis && (
                    <div className="mt-3 p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                      <p className="font-bold text-xs text-red-100 mb-1">Support is available</p>
                      <p className="text-xs text-red-500">If you're in crisis, please contact Emergency: 115 (VN) or 911 (US)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-primary/10 px-4 py-3 rounded-2xl flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 md:p-6 bg-white/80 backdrop-blur-md">
            <div className="flex gap-3 max-w-4xl mx-auto items-end">
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full pr-12 rounded-2xl border-border focus-visible:ring-primary shadow-sm"
                  disabled={isTyping || !isConnected}
                />
                {!userInput.trim() && isConnected && (
                  <div className="absolute right-4 bottom-1/2 translate-y-1/2 pointer-events-none">
                    <span className="text-xs text-muted-foreground opacity-50">Enter to send</span>
                  </div>
                )}
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isTyping || !userInput.trim() || !isConnected}
                size="icon"
                className="rounded-xl bg-primary hover:bg-primary/90 h-10 w-10 shrink-0 shadow-md transition-all active:scale-95"
              >
                <Send size={18} />
              </Button>
            </div>
            {!isConnected && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                Connecting to secure session...
              </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}
