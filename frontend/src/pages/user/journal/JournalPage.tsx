import React, { useState,  } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { Textarea } from '../../../components/ui/Textarea'
import { Input } from '../../../components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs'
import { Save, Plus, Trash2, Calendar, BookOpen, Menu, X } from 'lucide-react'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'

interface JournalEntry {
  id: number
  date: string
  title: string
  content: string
  mood: string
  tags: string[]
}

const JournalPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'write' | 'entries'>('write')
  const [title, setTitle] = useState<string>('')
  const [content, setContent] = useState<string>('')
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: 1,
      date: '2024-01-22',
      title: 'A Great Day',
      content: 'Today was wonderful. I felt productive and happy throughout the day...',
      mood: '😊',
      tags: ['happy', 'productive'],
    },
    {
      id: 2,
      date: '2024-01-21',
      title: 'Challenging Day',
      content: 'Had some challenges today but managed to overcome them with perseverance...',
      mood: '😐',
      tags: ['challenge', 'growth'],
    },
    {
      id: 3,
      date: '2024-01-20',
      title: 'Relaxation Day',
      content: 'Took it easy today and focused on self-care and relaxation...',
      mood: '😄',
      tags: ['self-care', 'relaxation'],
    },
  ])

  const moods = ['😢', '😔', '😐', '😊', '😄']

  const handleSaveEntry = async () => {
    if (!title || !content || !selectedMood) {
      alert('Please fill in title, content, and select a mood')
      return
    }

    setIsSaving(true)
    // TODO: Call API to save entry
    const newEntry: JournalEntry = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      title,
      content,
      mood: selectedMood,
      tags,
    }
    setEntries([newEntry, ...entries])

    await new Promise(resolve => setTimeout(resolve, 1200))
    setIsSaving(false)
    setActiveTab('entries')
    setTitle('')
    setContent('')
    setSelectedMood(null)
    setTags([])
  }

  const handleAddTag = () => {
    const newTag = tagInput.trim()
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag])
      setTagInput('')
    }
  }

  const handleTagKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleDeleteEntry = (id: number) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      setEntries(entries.filter(entry => entry.id !== id))
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-border/50 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">My Journal</h1>
            </div>

            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'write' | 'entries')}
            className="space-y-6"
            >
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 rounded-lg">
            <TabsTrigger
              value="write"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
            >
              <Plus size={18} />
              Write Entry
            </TabsTrigger>
            <TabsTrigger
              value="entries"
              className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm gap-2"
            >
              <BookOpen size={18} />
              My Entries
            </TabsTrigger>
          </TabsList>

          {/* Write Tab */}
          <TabsContent value="write" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Editor */}
              <div className="lg:col-span-2">
                <Card className="border-border shadow-md">
                  <CardHeader>
                    <CardTitle className="text-primary">Write New Entry</CardTitle>
                    <CardDescription>Share your thoughts and feelings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Title */}
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-semibold text-primary">Entry Title</label>
                      <Input
                        id="title"
                        placeholder="Give your entry a title..."
                        value={title}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                        className="border-border focus:border-primary h-11"
                      />
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <label htmlFor="content" className="text-sm font-semibold text-primary">Your Story</label>
                      <Textarea
                        id="content"
                        placeholder="What's on your mind? Write freely..."
                        value={content}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                        className="border-border focus:border-primary min-h-[200px]"
                      />
                      <p className="text-xs text-muted-foreground text-right">{content.length} characters</p>
                    </div>

                    {/* Mood */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary">How are you feeling?</label>
                      <div className="flex gap-2">
                        {moods.map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setSelectedMood(mood)}
                            className={`text-3xl p-2 rounded-lg transition-all ${
                              selectedMood === mood
                                ? 'bg-primary scale-110 text-white'
                                : 'bg-secondary/50 hover:bg-secondary'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-primary">Tags</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tag and press Enter"
                          value={tagInput}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          className="border-border focus:border-primary flex-1 h-10"
                        />
                        <Button onClick={handleAddTag} className="bg-primary hover:bg-primary/90 text-white h-10">
                          Add
                        </Button>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <div key={tag} className="flex items-center gap-1 bg-accent px-3 py-1 rounded-full text-sm">
                              <span className="text-primary font-semibold">#{tag}</span>
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-red-600 transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={handleSaveEntry}
                      disabled={!title || !content || !selectedMood || isSaving}
                      className="w-full bg-primary hover:bg-primary/90 text-white h-11 font-semibold gap-2"
                    >
                      <Save size={18} />
                      {isSaving ? 'Saving...' : 'Save Entry'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar - Tips */}
              <div className="lg:col-span-1">
                <Card className="border-border shadow-md sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-primary text-base">Journaling Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-2">
                        <span className="text-lg">✨</span>
                        <div>
                          <p className="font-semibold text-primary">Be Honest</p>
                          <p className="text-xs text-muted-foreground">Write your true feelings</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-lg">🎯</span>
                        <div>
                          <p className="font-semibold text-primary">Be Specific</p>
                          <p className="text-xs text-muted-foreground">Include details and context</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-lg">💭</span>
                        <div>
                          <p className="font-semibold text-primary">Reflect</p>
                          <p className="text-xs text-muted-foreground">Think about your emotions</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-lg">📝</span>
                        <div>
                          <p className="font-semibold text-primary">No Judgment</p>
                          <p className="text-xs text-muted-foreground">This is your safe space</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Entries Tab */}
          <TabsContent value="entries" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map((entry) => (
                <Card key={entry.id} className="border-border shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl">{entry.mood}</div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={14} />
                        {entry.date}
                      </span>
                    </div>
                    <CardTitle className="text-primary text-lg">{entry.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>

                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded-full text-muted-foreground">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button variant="outline" className="flex-1 border-border text-primary hover:bg-secondary/50 h-9 bg-transparent">
                        Read
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-9 gap-1 bg-transparent"
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {entries.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No entries yet. Start writing your first one!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  )
}

export default JournalPage