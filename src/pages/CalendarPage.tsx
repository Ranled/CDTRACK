import React, { useEffect, useState, useCallback, useMemo, memo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2,
  MapPin, Clock, Tag, AlertCircle, Filter
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday, addMonths, subMonths
} from 'date-fns'
import { cn, CATEGORY_COLORS, CATEGORY_DOT_COLORS, ALL_CATEGORIES, getPriorityColor, formatTime } from '@/lib/utils'
import EventForm from '@/components/calendar/EventForm'

interface CalEvent {
  id: string
  title: string
  description: string | null
  category: string
  course: string | null
  date: string
  time: string | null
  end_time: string | null
  location: string | null
  priority: 'low' | 'medium' | 'high'
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  created_by: string
  created_at: string
}

const CATEGORY_LEGEND = [
  { key: 'event', label: 'Events' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'deadline', label: 'Deadlines' },
  { key: 'project', label: 'Projects' },
  { key: 'thesis', label: 'Thesis' },
  { key: 'meeting', label: 'Meetings' },
]

// --- Memoized Day Cell ---
interface DayCellProps {
  day: Date
  isCurrentMonth: boolean
  isTodayDate: boolean
  dayEvents: CalEvent[]
  onEventClick: (e: CalEvent) => void
  colors: (cat: string) => { bg: string; text: string; dot: string }
}

const DayCell = memo(({ day, isCurrentMonth, isTodayDate, dayEvents, onEventClick, colors }: DayCellProps) => (
  <div
    className={cn(
      'border-r border-b border-border p-1.5 overflow-hidden',
      isCurrentMonth ? 'bg-background' : 'bg-secondary/30',
      isTodayDate && 'bg-primary/5',
    )}
  >
    <div className="flex items-center justify-between mb-1">
      <span className={cn(
        'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
        isTodayDate ? 'bg-primary text-white font-bold' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
      )}>
        {format(day, 'd')}
      </span>
    </div>
    <div className="space-y-0.5">
      {dayEvents.slice(0, 3).map(event => (
        <button
          key={event.id}
          onClick={() => onEventClick(event)}
          className={cn(
            'w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate hover:opacity-80 active:scale-[0.97]',
            colors(event.category).bg,
            colors(event.category).text
          )}
        >
          {event.time && <span className="opacity-70">{formatTime(event.time).replace(' AM', 'a').replace(' PM', 'p')} </span>}
          {event.title}
        </button>
      ))}
      {dayEvents.length > 3 && (
        <div className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
      )}
    </div>
  </div>
))
DayCell.displayName = 'DayCell'

export default function CalendarPage() {
  const { isAdmin } = useAuth()
  const [searchParams] = useSearchParams()
  const urlFilter = searchParams.get('filter')
  const urlSearch = searchParams.get('search')

  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>(() => urlFilter ? [urlFilter] : [])
  const [showFilters, setShowFilters] = useState(() => Boolean(urlFilter))
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    const start = format(startOfMonth(currentDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentDate), 'yyyy-MM-dd')
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .order('time', { ascending: true })
      setEvents(data || [])
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // Memoize calendar grid computations
  const calDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  const filteredEvents = useMemo(() => {
    let list = events
    if (activeFilters.length > 0) {
      list = list.filter(e => activeFilters.includes(e.category))
    }
    if (urlSearch) {
      const q = urlSearch.toLowerCase()
      list = list.filter(e => e.title.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)))
    }
    return list
  }, [events, activeFilters, urlSearch])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>()
    for (const e of filteredEvents) {
      const key = e.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    return map
  }, [filteredEvents])

  const getEventsForDay = useCallback((day: Date) => {
    const key = format(day, 'yyyy-MM-dd')
    return eventsByDay.get(key) || []
  }, [eventsByDay])

  const toggleFilter = useCallback((cat: string) => {
    setActiveFilters(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }, [])

  const handleDeleteEvent = useCallback(async (id: string) => {
    setSelectedEvent(null)
    setEvents(prev => prev.filter(e => e.id !== id))
    await supabase.from('events').delete().eq('id', id)
  }, [])

  const colors = useCallback((cat: string) => CATEGORY_COLORS[cat] || CATEGORY_COLORS['custom'], [])
  const dotColor = useCallback((cat: string) => CATEGORY_DOT_COLORS[cat] || '#6B7280', [])

  const handleEventClick = useCallback((event: CalEvent) => setSelectedEvent(event), [])

  const handleOpenCreate = useCallback(() => { setEditingEvent(null); setShowForm(true) }, [])
  const handleOpenEdit = useCallback(() => { setEditingEvent(selectedEvent); setShowForm(true) }, [selectedEvent])
  const handleFormClose = useCallback(() => { setShowForm(false); setEditingEvent(null) }, [])
  const handleFormSave = useCallback(() => {
    setShowForm(false)
    setEditingEvent(null)
    fetchEvents()
  }, [fetchEvents])

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Main calendar area */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">
              {format(currentDate, 'MMMM yyyy')}
            </h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentDate(d => subMonths(d, 1))}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 text-xs font-medium bg-secondary hover:bg-border rounded-lg text-foreground transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(d => addMonths(d, 1))}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                showFilters ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-muted-foreground'
              )}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {isAdmin && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0 animate-fade-in">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => toggleFilter(cat)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                  activeFilters.includes(cat)
                    ? cn(colors(cat).bg, colors(cat).text, 'border-transparent')
                    : 'border-border text-muted-foreground hover:bg-secondary'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor(cat) }} />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button
                onClick={() => setActiveFilters([])}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary border border-border transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-4 flex-shrink-0">
          {CATEGORY_LEGEND.map(item => (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: dotColor(item.key) }} />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>
            ))}
          </div>

          {/* Day cells */}
          <div
            className="flex-1 grid grid-cols-7 border-l border-t border-border overflow-hidden"
            style={{ gridTemplateRows: `repeat(${calDays.length / 7}, minmax(0, 1fr))` }}
          >
            {calDays.map(day => (
              <DayCell
                key={day.toISOString()}
                day={day}
                isCurrentMonth={isSameMonth(day, currentDate)}
                isTodayDate={isToday(day)}
                dayEvents={getEventsForDay(day)}
                onEventClick={handleEventClick}
                colors={colors}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Panel */}
      {selectedEvent && (
        <>
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSelectedEvent(null)} />
          <div className="w-full lg:w-[340px] flex-shrink-0 border-l border-border bg-background overflow-y-auto animate-slide-in-right z-30 lg:relative fixed right-0 top-16 bottom-0">
            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full', colors(selectedEvent.category).bg, colors(selectedEvent.category).text)}>
                    {selectedEvent.category}
                  </span>
                  <h2 className="text-lg font-bold text-foreground mt-2 leading-tight">{selectedEvent.title}</h2>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {isAdmin && (
                    <>
                      <button
                        onClick={handleOpenEdit}
                        className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(selectedEvent.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-foreground font-medium">
                      {format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}
                    </span>
                    {selectedEvent.time && (
                      <span className="text-muted-foreground ml-2">
                        {formatTime(selectedEvent.time)}
                        {selectedEvent.end_time && ` – ${formatTime(selectedEvent.end_time)}`}
                      </span>
                    )}
                  </div>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.course && (
                  <div className="flex items-center gap-3 text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-mono text-xs bg-secondary px-2 py-0.5 rounded">{selectedEvent.course}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full capitalize', getPriorityColor(selectedEvent.priority))}>
                    {selectedEvent.priority} priority
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full capitalize',
                    selectedEvent.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                    selectedEvent.status === 'ongoing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' :
                    selectedEvent.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                    'bg-secondary text-muted-foreground'
                  )}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Created {format(parseISO(selectedEvent.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Form Modal — only mounted when needed */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}
    </div>
  )
}
