import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/Button';
import { Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import type { ChatSession } from '../../types/chat';

interface ChatSidebarProps {
  userId: string;
  currentSessionId: string | null;
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
}

export default function ChatSidebar({
  userId,
  currentSessionId,
  onNewSession,
  onSessionSelect,
  onSessionDelete,
}: Readonly<ChatSidebarProps>) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [userId, currentSessionId]);

  const loadSessions = async () => {
    try {
      setLoading(true);

      const data = await chatApi.getUserSessions(userId);

      setSessions(Array.isArray(data) ? data : []);

    } catch (error) {
      console.error('Failed to load sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };


  const requestDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(sessionId);
  };

  const handleConfirmDelete = async () => {
    const sessionId = confirmDeleteId;
    if (!sessionId) return;

    try {
      setDeletingId(sessionId);
      await chatApi.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      onSessionDelete(sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      // keep UX lightweight; could swap to toast later
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getSessionTitle = (session: ChatSession) => {
    if (session.sessionSummary) {
      return session.sessionSummary.length > 30 
        ? session.sessionSummary.substring(0, 30) + '...'
        : session.sessionSummary;
    }
    const date = typeof session.startTime === 'string' 
      ? new Date(session.startTime) 
      : session.startTime;
    return `Chat ${formatDate(date)}`;
  };

  const renderSessions = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-muted-foreground" size={20} />
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No chat history yet
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {sessions.map((session) => {
          const isActive = currentSessionId === session._id;
          return (
            <button
              key={session._id}
              type="button"
              onClick={() => onSessionSelect(session._id)}
              className={`
                group relative w-full flex items-center gap-2 p-3 rounded-lg text-left
                cursor-pointer transition-colors
                ${isActive ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
              `}
            >
              <MessageSquare
                size={16}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isActive ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {getSessionTitle(session)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(session.startTime)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => requestDelete(e, session._id)}
                className={`
                  opacity-0 group-hover:opacity-100 transition-opacity
                  p-1 rounded hover:bg-destructive/10
                  ${deletingId === session._id ? 'opacity-100' : ''}
                `}
                disabled={deletingId === session._id}
                aria-label="Delete chat"
              >
                {deletingId === session._id ? (
                  <Loader2 className="animate-spin text-destructive" size={14} />
                ) : (
                  <Trash2
                    size={14}
                    className="text-muted-foreground hover:text-destructive"
                  />
                )}
              </button>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 bg-primary hover:bg-primary/90"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {renderSessions()}
      </div>

      {confirmDeleteId &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-xl bg-white border border-border shadow-lg p-4">
              <h3 className="font-semibold text-foreground">Delete chat?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This will permanently remove the chat session and its messages.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setConfirmDeleteId(null)}
                  disabled={!!deletingId}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="bg-destructive hover:bg-destructive/90"
                  disabled={!!deletingId}
                >
                  {deletingId ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={14} />
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
