import React, { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Calendar, Clock, MapPin, Save, Loader2 } from 'lucide-react'
import { ALL_CATEGORIES } from '@/lib/utils'

const COURSES = ['OS101', 'HCI101', 'SP101', 'NC101', 'THS102']

interface Event {
  id?: string
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
}

interface EventFormProps {
  event?: Event | null
  onClose: () => void
  onSave: () => void
}

export default function EventForm({ event, onClose, onSave }: EventFormProps) {
  const { user } = useAuth()

  // ── Uncontrolled refs for text fields (no re-render on every keystroke) ──
  const titleRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const locationRef = useRef<HTMLInputElement>(null)

  // ── Controlled state only for selects & submit UI ──
  const [category, setCategory] = useState(event?.category || 'event')
  const [course, setCourse] = useState(event?.course || '')
  const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(event?.time || '')
  const [endTime, setEndTime] = useState(event?.end_time || '')
  const [priority, setPriority] = useState<Event['priority']>(event?.priority || 'medium')
  const [status, setStatus] = useState<Event['status']>(event?.status || 'upcoming')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const title = titleRef.current?.value.trim() || ''
    if (!title) { setError('Title is required.'); return }
    if (!date) { setError('Date is required.'); return }

    setLoading(true)
    setError('')

    const payload = {
      title,
      description: descriptionRef.current?.value || null,
      category,
      course: course || null,
      date,
      time: startTime || null,
      end_time: endTime || null,
      location: locationRef.current?.value || null,
      priority,
      status,
      created_by: user?.id || '',
    }

    let err
    if (event?.id) {
      const res = await supabase.from('events').update(payload).eq('id', event.id)
      err = res.error
    } else {
      const res = await supabase.from('events').insert(payload)
      err = res.error
    }

    setLoading(false)
    if (err) { setError(err.message); return }
    onSave()
  }, [category, course, date, startTime, endTime, priority, status, user, event, onSave])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Plain overlay — no blur */}
      <div className="absolute inset-0 bg-black/55" onClick={onClose} />

      {/* Modal — contain: layout paint to isolate from calendar grid */}
      <div
        className="relative bg-background rounded-2xl shadow-panel w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ contain: 'layout paint' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-base font-semibold text-foreground">
            {event?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
            style={{ transition: 'background-color 120ms ease, color 120ms ease' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Title — UNCONTROLLED (ref), zero re-renders while typing */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</label>
            <input
              ref={titleRef}
              defaultValue={event?.title || ''}
              placeholder="Event title..."
              className="cd-input"
              required
              autoFocus
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <select className="cd-input" value={category} onChange={e => setCategory(e.target.value)}>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
              <select className="cd-input" value={priority} onChange={e => setPriority(e.target.value as Event['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Course */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Course</label>
            <select className="cd-input" value={course} onChange={e => setCourse(e.target.value)}>
              <option value="">— None —</option>
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                className="cd-input pl-9"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="time" className="cd-input pl-9" value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input type="time" className="cd-input pl-9" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Location — UNCONTROLLED (ref) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={locationRef}
                defaultValue={event?.location || ''}
                placeholder="Location or meeting link..."
                className="cd-input pl-9"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <select className="cd-input" value={status} onChange={e => setStatus(e.target.value as Event['status'])}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Description — UNCONTROLLED (ref) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              ref={descriptionRef}
              defaultValue={event?.description || ''}
              placeholder="Add details about this event..."
              className="cd-input min-h-[80px] resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary"
              style={{ transition: 'background-color 120ms ease' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] disabled:opacity-60"
              style={{ transition: 'background-color 120ms ease, transform 80ms ease' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {event?.id ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
