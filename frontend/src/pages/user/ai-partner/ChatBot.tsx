import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Settings, HelpCircle, Send, Brain, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useChat } from '../../../hooks/useChat';
import ChatSidebar from '../../../components/features/ChatSidebar';

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
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4" size={32} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to use the AI Thought Partner.</p>
          <Button onClick={() => (globalThis.location.href = '/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => (globalThis.location.href = '/user/dashboard')}
              className="gap-2"
            >
              <Home size={16} />
              Dashboard
            </Button>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Brain className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold text-foreground">AI Thought Partner</h1>
          </div>
          <div className="flex gap-2">
            <button 
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Settings"
            >
              <Settings size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
            <button 
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="Help"
            >
              <HelpCircle size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar
          userId={user.id}
          currentSessionId={sessionId}
          onNewSession={handleNewSession}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
        />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isTyping && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to AI Thought Partner
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    I'm here to listen and support you. Share what's on your mind, and we can work through it together.
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
                  className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-2xl ${
                    msg.sender === 'bot'
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-foreground border border-border/50'
                  }`}
                >
                  {msg.sender === 'bot' && (
                    <p className="text-xs font-medium uppercase mb-1.5 opacity-80 tracking-wide">
                      Thought Partner
                    </p>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.exercise && (
                    <div className="mt-2 p-2 bg-white/10 rounded border border-white/20">
                      <p className="font-medium text-sm">💡 Suggested exercise:</p>
                      <p className="text-sm">{msg.exercise}</p>
                    </div>
                  )}
                  {msg.isCrisis && (
                    <div className="mt-2 p-2 bg-red-500/20 rounded border border-red-500/30">
                      <p className="font-bold text-xs">If you're in crisis, please contact:</p>
                      <p className="text-sm">Emergency: 115 (VN) or 911 (US)</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-primary/10 text-primary px-4 py-3 rounded-2xl flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 md:p-6 bg-white">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                placeholder="Share your thoughts here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1 rounded-full border-border/50 focus-visible:ring-primary/50"
                disabled={isTyping || !isConnected}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isTyping || !userInput.trim() || !isConnected}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 shrink-0"
              >
                <Send size={18} />
              </Button>
            </div>
            {!isConnected && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Connecting to chat server...
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
