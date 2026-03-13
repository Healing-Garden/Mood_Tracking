import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, MoodContext } from '../types/chat';
import { chatApi } from '../api/chatApi';

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (text: string) => void;
  endChat: (summary?: string) => void;
  isConnected: boolean;
  isTyping: boolean;
  sessionId: string | null;
  loadSession: (sessionId: string) => Promise<void>;
  newSession: () => void;
  resetSession: () => void;
}

export const useChat = (userId: string, moodContext?: MoodContext): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isInitializedRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);
  const hasAutoCreatedRef = useRef(false);

  // Initialize socket connection
  useEffect(() => {
    if (!userId) return;
    if (isInitializedRef.current) return;
    
    let socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:8080';
    // Ensure the URL is valid for Socket.io default namespace
    if (socketUrl.endsWith('/')) {
      socketUrl = socketUrl.slice(0, -1);
    }
    
    const socket = io(socketUrl, {
      path: '/socket.io', // Express default path
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 20000,
      forceNew: true 
    });
    socketRef.current = socket;
    isInitializedRef.current = true;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      // Don't auto-create session, wait for explicit call
    });

    socket.on('connect_error', (error) => {
      console.error('Connect error:', error.message);
    });

    socket.on('message', (msg: ChatMessage) => {
      setIsTyping(false);
      setMessages((prev) => [...prev, { 
        ...msg, 
        timestamp: new Date(msg.timestamp),
        id: msg.id || msg._id || `${Date.now()}`
      }]);
    });

    socket.on('session_created', (data: { sessionId: string }) => {
      setSessionId(data.sessionId);
      currentSessionIdRef.current = data.sessionId;
    });

    socket.on('session_loaded', (data: { sessionId: string; messages: ChatMessage[] }) => {
      setSessionId(data.sessionId);
      currentSessionIdRef.current = data.sessionId;
      const formattedMessages = (Array.isArray(data.messages) ? data.messages : []).map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        id: msg.id || msg._id || `${Date.now()}`
      }));
      setMessages(formattedMessages);
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setIsTyping(false);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      isInitializedRef.current = false;
    };
  }, [userId]);

  const newSession = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    
    setMessages([]);
    setIsTyping(false);
    setSessionId(null);
    currentSessionIdRef.current = null;
    
    socketRef.current.emit('join-chat', { userId, moodContext });
  }, [userId, moodContext, isConnected]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setSessionId(null);
    currentSessionIdRef.current = null;
    // intentionally keep hasAutoCreatedRef as true (avoid auto-creating after deletion)
  }, []);

  const loadSession = useCallback(async (targetSessionId: string) => {
    if (!socketRef.current || !isConnected) return;
    
    try {
      const sessionData = await chatApi.getSessionDetail(targetSessionId);
      const formattedMessages = sessionData.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
        id: msg.id || msg._id || `${Date.now()}`
      }));
      
      setMessages(formattedMessages);
      setSessionId(targetSessionId);
      currentSessionIdRef.current = targetSessionId;
      
      socketRef.current.emit('join-chat', { 
        userId, 
        moodContext, 
        sessionId: targetSessionId 
      });
    } catch (error) {
      console.error('Failed to load session:', error);
      socketRef.current.emit('join-chat', { 
        userId, 
        moodContext, 
        sessionId: targetSessionId 
      });
    }
  }, [userId, moodContext, isConnected]);

  const sendMessage = useCallback((text: string) => {
    if (!socketRef.current || !text.trim() || !currentSessionIdRef.current) {
      if (!currentSessionIdRef.current && socketRef.current && isConnected) {
        newSession();
        setTimeout(() => {
          if (socketRef.current && text.trim()) {
            const tempMessage: ChatMessage = {
              sender: 'user',
              text,
              timestamp: new Date(),
              id: `${Date.now()}`
            };
            setMessages((prev) => [...prev, tempMessage]);
            setIsTyping(true);
            socketRef.current.emit('send-message', { text });
          }
        }, 500);
      }
      return;
    }
    
    const tempMessage: ChatMessage = {
      sender: 'user',
      text,
      timestamp: new Date(),
      id: `${Date.now()}`
    };
    setMessages((prev) => [...prev, tempMessage]);
    setIsTyping(true);
    socketRef.current.emit('send-message', { text });
  }, [isConnected, newSession]);

  const endChat = useCallback((summary?: string) => {
    if (socketRef.current && currentSessionIdRef.current) {
      socketRef.current.emit('end-chat', { summary });
      setMessages([]);
      setSessionId(null);
      currentSessionIdRef.current = null;
    }
  }, []);

  // Auto-create session on mount if user is available
  useEffect(() => {
    if (!isConnected || !userId) return;
    if (hasAutoCreatedRef.current) return;
    hasAutoCreatedRef.current = true;
    newSession();
  }, [isConnected, userId, newSession]);

  return { 
    messages, 
    sendMessage, 
    endChat, 
    isConnected, 
    isTyping, 
    sessionId,
    loadSession,
    newSession,
    resetSession
  };
};
