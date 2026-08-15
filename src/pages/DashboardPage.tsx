import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Calendar, Clock, CheckCircle2, AlertCircle, TrendingUp,
  Plus, ChevronRight, Megaphone, StickyNote, Target,
  BookOpen, Layers, Timer
} from 'lucide-react'
import { cn, CATEGORY_COLORS, getDaysUntil, formatTime, isToday } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface Event {
  id: string
  title: string
  category: string
  date: string
  time: string | null
  end_time: string | null
  location: string | null
  priority: string
  status: string
}

interface Announcement {
  id: string
  title: string
  description: string
  is_pinned: boolean
  created_at: string
}

interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
}

function ProgressRing({ percent, size = 140, strokeWidth = 10 }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (percent / 100) * circ

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-border" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#2563EB" strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  )
}

// In-memory module cache to prevent spinner flashes on tab navigation
let cachedDashboardData: {
  todayEvents: Event[]
  upcomingDeadlines: Event[]
  allEvents: Event[]
  announcements: Announcement[]
  timestamp: number
} | null = null

export default function DashboardPage() {
  const { profile, user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [todayEvents, setTodayEvents] = useState<Event[]>(() => cachedDashboardData?.todayEvents || [])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Event[]>(() => cachedDashboardData?.upcomingDeadlines || [])
  const [allEvents, setAllEvents] = useState<Event[]>(() => cachedDashboardData?.allEvents || [])
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => cachedDashboardData?.announcements || [])
  const [loading, setLoading] = useState(() => !cachedDashboardData)

  const fetchData = useCallback(async () => {
    // Only show full loading spinner if we don't have any cached data
    if (!cachedDashboardData) {
      setLoading(true)
    }
    const today = format(new Date(), 'yyyy-MM-dd')

    try {
      const [eventsRes, deadlinesRes, allEventsRes, announcementsRes] = await Promise.all([
        supabase.from('events').select('*').eq('date', today).order('time', { ascending: true }),
        supabase.from('events').select('*').in('category', ['deadline', 'exam', 'assignment']).gte('date', today).order('date', { ascending: true }).limit(5),
        supabase.from('events').select('*').gte('date', format(new Date(Date.now() - 30 * 86400000), 'yyyy-MM-dd')),
        supabase.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3),
      ])

      const newToday = eventsRes.data || []
      const newDeadlines = deadlinesRes.data || []
      const newAll = allEventsRes.data || []
      const newAnnouncements = announcementsRes.data || []

      cachedDashboardData = {
        todayEvents: newToday,
        upcomingDeadlines: newDeadlines,
        allEvents: newAll,
        announcements: newAnnouncements,
        timestamp: Date.now(),
      }

      setTodayEvents(newToday)
      setUpcomingDeadlines(newDeadlines)
      setAllEvents(newAll)
      setAnnouncements(newAnnouncements)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const completed = allEvents.filter(e => e.status === 'completed').length
  const total = allEvents.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const pending = allEvents.filter(e => e.status !== 'completed' && e.status !== 'cancelled').length
  const highPriority = allEvents.filter(e => e.priority === 'high' && e.status !== 'completed').length
  const dueToday = todayEvents.length

  const categoryColor = (cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['custom']

  const greet = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greet()}, {profile?.display_name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Here's your academic overview
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/calendar')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Completed', value: completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Pending', value: pending, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950' },
          { label: 'Due Today', value: dueToday, icon: <AlertCircle className="w-5 h-5" />, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'High Priority', value: highPriority, icon: <Target className="w-5 h-5" />, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
        ].map(stat => (
          <div key={stat.label} className="cd-card flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg', stat.bg, stat.color)}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Progress Ring + Today Schedule */}
        <div className="space-y-6">
          {/* Academic Progress Ring */}
          <div className="cd-card flex flex-col items-center gap-4 py-6">
            <div className="text-sm font-semibold text-foreground">Academic Progress</div>
            <div className="relative">
              <ProgressRing percent={progress} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{progress}%</span>
                <span className="text-xs text-muted-foreground">Complete</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>{completed} completed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-border" />
                <span>{pending} pending</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="cd-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Add Personal Note', icon: <StickyNote className="w-4 h-4" />, to: '/notes', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950' },
                { label: 'View Calendar', icon: <Calendar className="w-4 h-4" />, to: '/calendar', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950' },
                { label: 'View Deadlines', icon: <Timer className="w-4 h-4" />, to: '/calendar?filter=deadline', color: 'text-red-600 bg-red-50 dark:bg-red-950' },
                { label: 'Announcements', icon: <Megaphone className="w-4 h-4" />, to: '/announcements', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left group"
                >
                  <div className={cn('p-1.5 rounded-md', action.color)}>
                    {action.icon}
                  </div>
                  <span className="text-sm text-foreground font-medium">{action.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Today's Schedule */}
        <div className="cd-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Today's Schedule</h3>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {todayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No events scheduled today</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Enjoy your free day! 🌟</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map(event => {
                const colors = categoryColor(event.category)
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                    onClick={() => navigate('/calendar')}
                  >
                    <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', colors.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        {event.priority === 'high' && (
                          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {event.time && (
                          <span className="text-xs text-muted-foreground">{formatTime(event.time)}</span>
                        )}
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', colors.bg, colors.text)}>
                          {event.category}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Upcoming Deadlines + Announcements */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="cd-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
              <button onClick={() => navigate('/calendar?filter=deadline')} className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming deadlines!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map(event => {
                  const daysLeft = getDaysUntil(event.date)
                  const isUrgent = daysLeft <= 1
                  const isSoon = daysLeft <= 3

                  return (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate('/calendar')}>
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        isUrgent ? 'bg-red-50 dark:bg-red-950' : isSoon ? 'bg-yellow-50 dark:bg-yellow-950' : 'bg-secondary'
                      )}>
                        <BookOpen className={cn(
                          'w-4 h-4',
                          isUrgent ? 'text-red-500' : isSoon ? 'text-yellow-500' : 'text-muted-foreground'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className={cn(
                          'text-xs font-medium mt-0.5',
                          isUrgent ? 'text-red-600 dark:text-red-400' : isSoon ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground'
                        )}>
                          {daysLeft === 0 ? 'Due today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recent Announcements */}
          <div className="cd-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Announcements</h3>
              <button onClick={() => navigate('/announcements')} className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
                View all <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-6 text-center">
                <Megaphone className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer" onClick={() => navigate('/announcements')}>
                    <div className="flex items-start gap-2">
                      {ann.is_pinned && (
                        <span className="flex-shrink-0 text-[10px] bg-accent text-yellow-900 font-bold px-1.5 py-0.5 rounded mt-0.5">PIN</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ann.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{ann.description}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(parseISO(ann.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
