import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Settings, HelpCircle, Share2, Send, Brain } from 'lucide-react'

interface Message {
  id: string
  role: 'partner' | 'user'
  content: string
}

interface DailySummary {
  keyTheme: string
  growthMoment: string
  quote: string
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'partner',
      content:
        'I heard you saying that things have felt heavy lately. How does that weight feel in your body right now? Take all the time you need to explore that sensation.',
    },
  ])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const dailySummary: DailySummary = {
    keyTheme: 'Bodily awareness of anxiety and practicing presence with discomfort.',
    growthMoment: 'Recognizing physical triggers before they manifest into overwhelming thoughts.',
    quote: '"I am allowed to feel this without being defined by it."',
  }

  const reflections = [
    'Finding Calm Amidst Chaos',
    'Workplace Boundaries',
    'Morning Gratitude',
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
    }

    setMessages((prev) => [...prev, newMessage])
    setUserInput('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const partnerResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'partner',
        content:
          "Thank you for sharing that. It sounds like you're becoming more aware of how your body communicates with you. That's a powerful step in understanding your emotions.",
      }
      setMessages((prev) => [...prev, partnerResponse])
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Brain className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-bold text-foreground">AI Thought Partner</h1>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Settings size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <HelpCircle size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Share2 size={20} className="text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile */}
        <aside className="w-64 border-r border-border bg-white p-4 overflow-y-auto hidden lg:flex flex-col gap-4">
          <Button variant="ghost" className="w-full justify-start gap-2">
            <div className="w-3 h-3 bg-primary rounded-full" />
            Current Session
          </Button>

          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              Previous Reflections
            </h3>
            <div className="space-y-1">
              {reflections.map((reflection) => (
                <button
                  key={reflection}
                  className="w-full text-left text-sm text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-muted transition-colors"
                >
                  {reflection}
                </button>
              ))}
            </div>
          </div>

          <Button className="mt-auto w-full gap-2">
            <span>+</span> New Sanctuary Session
          </Button>
        </aside>

        {/* Main Chat */}
        <main className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-2xl px-4 py-3 rounded-2xl ${
                    message.role === 'partner'
                      ? 'bg-primary text-white'
                      : 'bg-muted/50 text-foreground border border-border/50'
                  }`}
                >
                  {message.role === 'partner' && (
                    <p className="text-xs font-medium uppercase mb-1.5 opacity-80 tracking-wide">
                      Thought Partner
                    </p>
                  )}
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-primary/10 text-primary px-4 py-3 rounded-2xl flex gap-1.5">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Daily Summary */}
          <div className="border-t border-border bg-muted/30 p-4 md:p-6">
            <Card className="border-0 shadow-none bg-transparent">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h3 className="font-semibold text-foreground">Daily Summary</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-primary uppercase mb-1">Key Theme</p>
                    <p className="text-sm text-foreground">{dailySummary.keyTheme}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-primary uppercase mb-1">Growth Moment</p>
                    <p className="text-sm text-foreground">{dailySummary.growthMoment}</p>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm italic text-muted-foreground">
                    {dailySummary.quote}
                  </p>
                  <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto">
                    Save to Journal →
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4 md:p-6 bg-white">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <Input
                placeholder="Share your thoughts here..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                className="flex-1 rounded-full border-border/50 focus-visible:ring-primary/50"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 h-10 w-10 shrink-0"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}