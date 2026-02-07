import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent } from '../../../components/ui/Card'
import DashboardSidebar from '../../../components/layout/DashboardSideBar'
import { Bell, Check, Trash2, Menu, X } from 'lucide-react'

type NotificationType = 'insight' | 'reminder' | 'milestone' | 'message'

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

export default function NotificationsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => [
    {
      id: '1',
      type: 'insight',
      title: 'New Insight Generated',
      description:
        'Based on your recent entries, you might benefit from exploring body-based anxiety techniques.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      actionUrl: '/user/journal',
    },
    {
      id: '2',
      type: 'reminder',
      title: 'Time for Your Daily Check-in',
      description:
        'Start your day with intention. Complete your mood and energy check-in.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: '3',
      type: 'milestone',
      title: 'Milestone Reached!',
      description:
        "You've completed 30 journal entries this month. Great consistency!",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: '4',
      type: 'message',
      title: 'AI Partner Response',
      description:
        'Your thought partner has responded to your reflection with new insights.',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      actionUrl: '/user/ai-partner',
    },
    {
      id: '5',
      type: 'reminder',
      title: 'Weekly Reflection Available',
      description: 'Your weekly summary is ready to review.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      read: true,
    },
  ])


  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case 'insight': return '💡'
      case 'reminder': return '⏰'
      case 'milestone': return '🏆'
      case 'message': return '💬'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
      case 'insight': return 'bg-blue-50 border-l-4 border-blue-500'
      case 'reminder': return 'bg-orange-50 border-l-4 border-orange-500'
      case 'milestone': return 'bg-green-50 border-l-4 border-green-500'
      case 'message': return 'bg-purple-50 border-l-4 border-purple-500'
      default: return 'bg-gray-50 border-l-4 border-gray-500'
    }
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
    return date.toLocaleDateString()
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 ${sidebarOpen ? 'block' : 'hidden'} lg:static lg:block`}>
        <DashboardSidebar userType="user" onClose={() => setSidebarOpen(false)} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
          <div className="px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button className="lg:hidden p-2 rounded hover:bg-muted" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Filter placeholder */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="text-xs">All</Button>
            <Button variant="outline" size="sm" className="text-xs">Unread</Button>
            <Button variant="outline" size="sm" className="text-xs">Insights</Button>
          </div>

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="mx-auto mb-4 opacity-50" size={48} />
                <h3 className="font-semibold text-lg">All Caught Up!</h3>
                <p className="text-muted-foreground">You don't have any notifications right now.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`overflow-hidden transition-all hover:shadow-md ${
                  !notification.read ? 'border-primary/30 bg-primary/5' : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className={`${getNotificationColor(notification.type)} p-4 flex gap-4 items-start`}>
                    <div className="text-2xl flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{notification.title}</h3>
                      <p className="text-sm text-foreground/80 mt-1">{notification.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.timestamp)}
                        </span>
                        {notification.actionUrl && (
                          <Link to={notification.actionUrl}>
                            <Button size="sm" variant="ghost" className="text-xs text-primary hover:text-primary/80 p-0 h-auto">
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1.5 hover:bg-black/5 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} className="text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1.5 hover:bg-black/5 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </main>
      </div>
    </div>
  )
}