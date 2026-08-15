import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, Sun, Moon, Menu, X, CheckCheck } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { format } from 'date-fns'

interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  type: string
  created_at: string
}

interface TopNavProps {
  onMenuToggle: () => void
}

export default function TopNav({ onMenuToggle }: TopNavProps) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)

  const currentMonth = format(new Date(), 'MMMM yyyy')

  useEffect(() => {
    if (!user) return
    let active = true

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data && active) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    }
    fetchNotifs()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!active) return
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/calendar?search=${encodeURIComponent(q)}`)
      setSearchQuery('')
    }
  }

  const notifTypeDot: Record<string, string> = {
    announcement: 'bg-yellow-400',
    deadline: 'bg-red-400',
    event: 'bg-blue-400',
    assignment: 'bg-orange-400',
    reminder: 'bg-purple-400',
    general: 'bg-gray-400',
  }

  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Current month */}
      <div className="hidden sm:block">
        <span className="text-sm font-semibold text-foreground">{currentMonth}</span>
      </div>

      {/* Global Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events, notes, announcements..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-lg border border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground placeholder:text-muted-foreground transition-all duration-150"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-panel animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-700 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer',
                        !notif.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-1">
                          <span className={`w-2 h-2 rounded-full block ${notifTypeDot[notif.type] || 'bg-gray-400'}`} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">
                            {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
