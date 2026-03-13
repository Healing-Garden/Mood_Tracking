import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Bell, Check, Trash2, Lightbulb, Clock, Trophy, MessageSquare, Sparkles, AlertCircle, CheckCheck } from 'lucide-react'
import http from '../../../api/http'
import DashboardLayout from '../../../components/layout/DashboardLayout';

type NotificationType = 'insight' | 'reminder' | 'milestone' | 'message' | 'tip' | 'other'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface ApiNotification {
  id: string
  type: 'insight' | 'reminder' | 'tip' | 'message' | 'other' | 'milestone'
  title: string
  content: string
  status: 'pending' | 'sent' | 'read'
  created_at?: string
  scheduled_for?: string
  sent_at?: string
  metadata?: {
    context?: string
    [key: string]: unknown
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = (await http.get('/notifications?limit=50')) as unknown as ApiNotification[]

      const mapped: Notification[] = data.map((n) => {
        const rawDate =
          n.created_at || n.sent_at || n.scheduled_for || new Date().toISOString()

        let type: NotificationType = 'other'
        if (n.type === 'insight') type = 'insight'
        else if (n.type === 'milestone') type = 'milestone'
        else if (n.type === 'message') type = 'message'
        else if (n.type === 'reminder') type = 'reminder'
        else if (n.type === 'tip') type = 'tip'

        let actionUrl: string | undefined
        const context = n.metadata?.context
        if (context === 'journal_reminder') actionUrl = '/user/journal'
        if (context === 'mood_check') actionUrl = '/user/dashboard'

        return {
          id: n.id,
          type,
          title: n.title,
          description: n.content,
          timestamp: new Date(rawDate),
          read: n.status === 'read',
          actionUrl,
        }
      })

      setNotifications(mapped)
    } catch (err) {
      console.error(err)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: NotificationType): ReactNode => {
    const size = 20;
    switch (type) {
      case 'insight': return <Lightbulb size={size} className="text-blue-600" />
      case 'reminder': return <Clock size={size} className="text-orange-600" />
      case 'milestone': return <Trophy size={size} className="text-emerald-600" />
      case 'message': return <MessageSquare size={size} className="text-purple-600" />
      case 'tip': return <Sparkles size={size} className="text-amber-600" />
      default: return <Bell size={size} className="text-slate-600" />
    }
  }

  const getNotificationStyles = (type: NotificationType, isRead: boolean): string => {
    const base = "relative transition-all duration-300 rounded-2xl border-2 ";
    if (!isRead) {
      switch (type) {
        case 'insight': return base + "bg-blue-50/50 border-blue-100 shadow-sm"
        case 'reminder': return base + "bg-orange-50/50 border-orange-100 shadow-sm"
        case 'milestone': return base + "bg-emerald-50/50 border-emerald-100 shadow-sm"
        case 'message': return base + "bg-purple-50/50 border-purple-100 shadow-sm"
        case 'tip': return base + "bg-amber-50/50 border-amber-100 shadow-sm"
        default: return base + "bg-slate-50/50 border-slate-100 shadow-sm"
      }
    }
    return base + "bg-white border-transparent grayscale-[30%] opacity-80"
  }

  const formatTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await http.patch(`/notifications/${id}/read`)
    } catch (err) {
      console.error('Failed to mark as read', err)
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await http.post('/notifications/mark-all-read')
    } catch (err) {
      console.error('Failed to mark all as read', err)
      fetchNotifications()
    }
  }

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await http.delete(`/notifications/${id}`)
    } catch (err) {
      console.error('Failed to delete notification', err)
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DashboardLayout 
      title="Notifications"
      headerActions={
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-primary hover:bg-primary/5 gap-2 font-bold px-3 py-1.5 h-auto rounded-full transition-all"
            >
              <CheckCheck size={14} />
              Mark all read
            </Button>
          )}
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider">
              {unreadCount} New
            </span>
          )}
        </div>
      }
    >
      <div className="px-6 py-10 max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="flex bg-secondary/10 p-1 rounded-xl border border-border/50">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'all' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-6 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === 'unread' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Unread
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-primary/20">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground font-medium animate-pulse">Gathering your updates...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-32 bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-primary/20">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-700">
              <Bell className="text-primary/40" size={48} />
            </div>
            <h3 className="font-bold text-3xl text-slate-800 mb-3 tracking-tight">Peace and Quiet</h3>
            <p className="text-slate-500 text-lg max-w-sm mx-auto leading-relaxed">
              You're all caught up. Take this moment to reflect and breathe.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={getNotificationStyles(notification.type, notification.read)}
              >
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(24,134,24,0.6)]" />
                )}
                
                <div className="p-6 flex gap-6 items-start">
                  <div className={`p-3 rounded-2xl flex-shrink-0 transition-colors ${!notification.read ? 'bg-white shadow-sm' : 'bg-secondary/10'}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h3 className={`font-bold transition-colors ${!notification.read ? 'text-primary' : 'text-slate-600'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-secondary/5 px-2 py-0.5 rounded-full">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                    
                    <p className={`text-sm leading-relaxed transition-colors ${!notification.read ? 'text-slate-700' : 'text-slate-500'}`}>
                      {notification.description}
                    </p>
                    
                    <div className="flex items-center gap-6 mt-4">
                      {notification.actionUrl && (
                        <Link to={notification.actionUrl}>
                          <Button size="sm" variant="ghost" className="h-8 px-4 text-xs font-bold text-primary hover:bg-primary/5 rounded-full border border-primary/10 transition-all active:scale-95">
                            Take Action
                          </Button>
                        </Link>
                      )}
                      
                      <div className="flex items-center gap-2 ml-auto">
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-2 hover:bg-primary/10 rounded-xl transition-all text-primary/60 hover:text-primary active:scale-90"
                            title="Mark as read"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-2 hover:bg-red-50 rounded-xl transition-all text-muted-foreground hover:text-red-500 active:scale-90"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 animate-in slide-in-from-top-4">
            <AlertCircle size={20} />
            <p className="text-sm font-bold">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => fetchNotifications()} className="ml-auto text-xs font-bold hover:bg-red-100">Retry</Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}