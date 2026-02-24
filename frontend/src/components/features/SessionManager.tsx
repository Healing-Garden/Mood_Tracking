import { useState } from "react";
import { Button } from "../ui/Button";
import { Plus, Home, History } from "lucide-react";

interface SessionManagerProps {
  currentSessionId?: string | null;
  onNewSession: () => void;
  onSessionSelect?: (sessionId: string) => void;
  onSessionDelete?: (sessionId: string) => void;
}

export default function SessionManager({ 
  // currentSessionId,
  onNewSession,
}: SessionManagerProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="flex justify-between items-center p-4 border-b">
      <Button onClick={onNewSession}>
        <Plus size={16} className="mr-2" />
        New Chat
      </Button>
      
      <Button onClick={() => window.location.href = '/dashboard'}>
        <Home size={16} className="mr-2" />
        Dashboard
      </Button>
      
      <Button onClick={() => setShowHistory(!showHistory)}>
        <History size={16} />
        {showHistory ? "Hide History" : "Chat History"}
      </Button>
    </div>
  );
}