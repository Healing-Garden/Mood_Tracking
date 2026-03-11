import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useDailyCheckInStore } from '../../store/dailyCheckInStore';

const NEGATIVE_MOODS = ['very sad', 'very low', 'sad', 'low', 'anxious', 'stressed', 'angry', 'tired', 'overwhelmed'];

const FlowerMessenger: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [hasGreeted, setHasGreeted] = useState(false);
  
  // State for smart positioning
  const [chatOffset, setChatOffset] = useState({ x: 0, y: -320 }); // Closer to bot (was -490)
  const [origin, setOrigin] = useState('bottom');

  const { user } = useAuth();
  const entityRef = useRef<HTMLDivElement>(null);
  const dragConstraintsRef = useRef(null);
  
  const { lastMood, currentCheckIn } = useDailyCheckInStore();

  const shouldShow = useMemo(() => {
    if (!lastMood) return false;
    return NEGATIVE_MOODS.includes(lastMood.toLowerCase());
  }, [lastMood]);

  const moodContext = useMemo(() => ({
    recentMood: lastMood || 'neutral',
    energyLevel: currentCheckIn?.energy || 3,
    timestamp: new Date().toISOString(),
  }), [lastMood, currentCheckIn]);

  const { messages, sendMessage, isTyping, isConnected } = useChat(user?.id || '', moodContext);

  // Logic tính toán vị trí linh hoạt để tránh bị mất khung chat
  const calculateSmartPosition = () => {
    if (!entityRef.current) return;
    
    const rect = entityRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const chatWidth = 384; // w-96 = 384px
    const chatHeight = 480;
    
    let newX = 0;
    let newY = 0;
    let newOrigin = 'bottom';

    // Default: center above bot
    const botCenterX = rect.left + rect.width / 2;
    const botBottom = rect.bottom;

    // 1. Vertical positioning: try above first (closer to bot)
    if (botBottom - chatHeight - 10 > 0) {
      // Show above bot with smaller gap
      newY = -(chatHeight + 10);
      newOrigin = 'bottom';
    } else {
      // Show below bot with smaller gap
      newY = rect.height + 10;
      newOrigin = 'top';
    }

    // 2. Horizontal positioning: center under bot, then adjust for screen edges
    let targetX = botCenterX - chatWidth / 2;

    // Adjust if too far left
    if (targetX < 20) {
      targetX = 20;
    }
    // Adjust if too far right
    if (targetX + chatWidth > screenWidth - 20) {
      targetX = screenWidth - chatWidth - 20;
    }

    // Convert to relative offset from bot center
    newX = targetX - botCenterX;

    setChatOffset({ x: newX, y: newY });
    setOrigin(newOrigin);
  };

  useEffect(() => {
    if (isChatOpen) calculateSmartPosition();
  }, [isChatOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (isChatOpen) calculateSmartPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isChatOpen]);

  useEffect(() => {
    if (shouldShow && !hasGreeted && isConnected) {
      const timer = setTimeout(() => {
        setHasGreeted(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, hasGreeted, isConnected]);

  const handleSendMessage = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!userInput.trim() || !isConnected) return;
    sendMessage(userInput);
    setUserInput('');
  };

  return (
    <>
      <div ref={dragConstraintsRef} className="fixed inset-0 pointer-events-none z-[49]" />

      <motion.div
        drag
        dragConstraints={dragConstraintsRef}
        dragElastic={0.05}
        onDrag={isChatOpen ? calculateSmartPosition : undefined}
        onDragEnd={() => isChatOpen && calculateSmartPosition()}
        initial={{ y: 0, x: 0 }}
        className="fixed bottom-24 right-24 z-50 flex items-center justify-center pointer-events-auto select-none touch-none"
        ref={entityRef}
      >
        <div className="relative flex flex-col items-center">
          
          {/* Chat Window - DYNAMIC POSITION RELATIVE TO BOT */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onPointerDown={(e) => e.stopPropagation()} 
                className="absolute w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-primary/20 overflow-hidden flex flex-col cursor-auto z-10"
                style={{ 
                  height: '480px',
                  transformOrigin: origin,
                  left: chatOffset.x,
                  top: chatOffset.y,
                }}
              >
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-primary to-green-500 p-5 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className="text-yellow-200" />
                    <div>
                      <h3 className="font-bold text-sm">Daisy Assistant</h3>
                      <p className="text-[10px] opacity-80 uppercase font-bold tracking-widest">Always with you</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsChatOpen(false); }}
                    className="hover:bg-white/20 p-2 rounded-full transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/40 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8 opacity-50">
                      <Sparkles size={32} className="text-primary/20 mb-3" />
                      <p className="text-sm italic font-medium">"Daisy is listening... Tell me anything."</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-3xl text-sm shadow-sm ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-white rounded-tr-none' 
                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white/80 p-4 rounded-3xl rounded-tl-none flex gap-1.5 shadow-sm border border-gray-100">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-5 bg-white border-t border-gray-100 shrink-0">
                  <div className="flex gap-2 bg-gray-100 rounded-full px-5 py-3 items-center" 
                       onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => { e.stopPropagation(); setUserInput(e.target.value); }}
                      onKeyDown={(e) => { e.stopPropagation(); if(e.key === 'Enter') handleSendMessage(e); }}
                      onPointerDown={(e) => e.stopPropagation()}
                      placeholder="Message Daisy..."
                      className="flex-1 bg-transparent border-none p-0 text-sm focus:ring-0"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || !isConnected}
                      className="bg-primary text-white p-2 rounded-full hover:scale-110 active:scale-95 transition-all"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Daisy Character */}
          <div 
            className={`relative flex flex-col items-center transition-all duration-500 ${!shouldShow ? 'scale-0 translate-y-20' : 'scale-100 translate-y-0'}`}
            onClick={() => setIsChatOpen(!isChatOpen)}
          >
            {/* Proactive Greet Bubble */}
            {!isChatOpen && hasGreeted && (
               <motion.div 
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, y: -70 }} // Closer to bot (was -110)
                className="absolute bg-white px-6 py-3 rounded-full shadow-2xl border border-primary/20 text-xs font-bold text-primary whitespace-nowrap flex items-center gap-2 z-20 pointer-events-none"
               >
                 <Sparkles size={16} className="text-yellow-400" />
                 Are you okay? Talk to me!
                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-primary/20" />
               </motion.div>
            )}

            <div className="absolute -bottom-2 w-32 h-6 bg-black/10 rounded-full blur-xl -z-10" />

            <motion.div
               animate={{ 
                  rotate: isChatOpen ? [-2, 2, -2] : [0, -1, 1, 0],
                  y: [0, -4, 0]
               }}
               transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
               className="cursor-grab active:cursor-grabbing"
            >
              <img 
                src="/daisy.png" 
                alt="Daisy" 
                className="w-36 h-36 md:w-44 md:h-44 object-contain drop-shadow-2xl"
                draggable="false"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default FlowerMessenger;
