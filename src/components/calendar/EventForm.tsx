import React, { useState, useRef, useCallback, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Calendar, Clock, MapPin, Save, Loader2 } from 'lucide-react'
import { ALL_CATEGORIES } from '@/lib/utils'

const COURSES = ['OS101', 'HCI101', 'SP101', 'NC101', 'THS102']

interface EventData {
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
  event?: EventData | null
  onClose: () => void
  onSave: () => void
}

// Shared label style
const LBL = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5'
// Input style — only transition specific props (not transition-all, which repaints on every keypress)
const INPUT =
  'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'

// Today in local YYYY-MM-DD (avoids UTC vs local timezone mismatch)
function todayLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function EventForm({ event, onClose, onSave }: EventFormProps) {
  const { user } = useAuth()

  // ── All form fields as UNCONTROLLED refs — zero re-renders while typing ──
  const titleRef       = useRef<HTMLInputElement>(null)
  const categoryRef    = useRef<HTMLSelectElement>(null)
  const priorityRef    = useRef<HTMLSelectElement>(null)
  const courseRef      = useRef<HTMLSelectElement>(null)
  const dateRef        = useRef<HTMLInputElement>(null)
  const startTimeRef   = useRef<HTMLInputElement>(null)
  const endTimeRef     = useRef<HTMLInputElement>(null)
  const locationRef    = useRef<HTMLInputElement>(null)
  const statusRef      = useRef<HTMLSelectElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Only state needed: submit status + error message + entrance animation flag
  const [loading, setLoading] = useState(false)
  const [error,   setError  ] = useState('')
  const [visible, setVisible] = useState(false)

  // Trigger CSS entrance animation after first paint (rAF avoids FOUC)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  // Delayed focus on title (avoids portal jank from immediate autoFocus)
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [])

  // Escape key closes the form (when not submitting)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, loading])

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const title = titleRef.current?.value.trim() ?? ''
    const date  = dateRef.current?.value ?? ''

    if (!title) { setError('Title is required.'); titleRef.current?.focus(); return }
    if (!date)  { setError('Date is required.');  dateRef.current?.focus();  return }
    if (!user?.id) { setError('Not authenticated. Please refresh and log in again.'); return }

    setLoading(true)
    setError('')

    // Build payload — only send fields that exist in the schema
    const payload: Record<string, unknown> = {
      title,
      description : descriptionRef.current?.value.trim()  || null,
      category    : categoryRef.current?.value             || 'event',
      date,
      time        : startTimeRef.current?.value            || null,
      end_time    : endTimeRef.current?.value              || null,
      location    : locationRef.current?.value.trim()      || null,
      priority    : priorityRef.current?.value             || 'medium',
      status      : statusRef.current?.value               || 'upcoming',
      created_by  : user.id,
    }

    // Include course only if selected (graceful — column may not exist in all deployments)
    const courseVal = courseRef.current?.value || null
    if (courseVal) payload.course = courseVal

    const tryInsertOrUpdate = async (data: Record<string, unknown>) => {
      if (event?.id) {
        // Don't overwrite created_by on updates
        const { created_by: _omit, ...updateData } = data
        return supabase.from('events').update(updateData).eq('id', event.id!)
      } else {
        return supabase.from('events').insert(data)
      }
    }

    try {
      let { error: dbError } = await tryInsertOrUpdate(payload)

      // If the error mentions 'course', that column doesn't exist — retry without it
      if (dbError && dbError.message?.toLowerCase().includes('course')) {
        const { course: _omit, ...payloadWithoutCourse } = payload
        const result = await tryInsertOrUpdate(payloadWithoutCourse)
        dbError = result.error
      }

      if (dbError) {
        setError(dbError.message)
        setLoading(false)
        return
      }

      // Success — onSave() will close form and refresh events list
      onSave()
    } catch (ex: unknown) {
      setError(ex instanceof Error ? ex.message : 'Unexpected error. Please try again.')
      setLoading(false)
    }
  }, [user, event, onSave])

  // ── Safe close (prevent close while saving) ─────────────────────────────
  const handleClose = useCallback(() => {
    if (!loading) onClose()
  }, [loading, onClose])

  // ── Modal JSX ───────────────────────────────────────────────────────────
  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      role="dialog"
      aria-modal="true"
      aria-label={event?.id ? 'Edit Event' : 'Create New Event'}
    >
      {/* Animated backdrop */}
      <div
        className="absolute inset-0 bg-black/55"
        onClick={handleClose}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 160ms ease',
          willChange: 'opacity',
        }}
        aria-hidden="true"
      />

      {/* Dialog panel — GPU compositing layer, animated entrance */}
      <div
        className="relative bg-background rounded-2xl border border-border w-full max-w-lg"
        style={{
          maxHeight: '90dvh',
          overflowY: 'scroll',   // 'scroll' reserves scrollbar — avoids layout shift on overflow
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 160ms ease',
          willChange: 'transform, opacity',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {event?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40"
            style={{ transition: 'background-color 100ms' }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form — all inputs are uncontrolled (defaultValue) — ZERO re-renders while typing */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4" noValidate>

          {/* Title */}
          <div>
            <label className={LBL}>Title *</label>
            <input
              ref={titleRef}
              defaultValue={event?.title ?? ''}
              placeholder="Event title..."
              className={INPUT}
              style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
              maxLength={200}
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Category</label>
              <select
                ref={categoryRef}
                defaultValue={event?.category ?? 'event'}
                className={INPUT}
                style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
              >
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LBL}>Priority</label>
              <select
                ref={priorityRef}
                defaultValue={event?.priority ?? 'medium'}
                className={INPUT}
                style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Course */}
          <div>
            <label className={LBL}>Course</label>
            <select
              ref={courseRef}
              defaultValue={event?.course ?? ''}
              className={INPUT}
              style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
            >
              <option value="">— None —</option>
              {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className={LBL}>Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={dateRef}
                type="date"
                defaultValue={event?.date ?? todayLocal()}
                className={INPUT + ' pl-9'}
                style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
              />
            </div>
          </div>

          {/* Start + End Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LBL}>Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={startTimeRef}
                  type="time"
                  defaultValue={event?.time ?? ''}
                  className={INPUT + ' pl-9'}
                  style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
                />
              </div>
            </div>
            <div>
              <label className={LBL}>End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  ref={endTimeRef}
                  type="time"
                  defaultValue={event?.end_time ?? ''}
                  className={INPUT + ' pl-9'}
                  style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={LBL}>Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={locationRef}
                defaultValue={event?.location ?? ''}
                placeholder="Location or meeting link..."
                className={INPUT + ' pl-9'}
                style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
                maxLength={300}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={LBL}>Status</label>
            <select
              ref={statusRef}
              defaultValue={event?.status ?? 'upcoming'}
              className={INPUT}
              style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
            >
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className={LBL}>Description</label>
            <textarea
              ref={descriptionRef}
              defaultValue={event?.description ?? ''}
              placeholder="Add details about this event..."
              className={INPUT + ' min-h-[80px] resize-none'}
              style={{ transition: 'border-color 100ms, box-shadow 100ms' }}
              rows={3}
            />
          </div>

          {/* Error message */}
          {error && (
            <div
              className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2 pb-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40"
              style={{ transition: 'background-color 100ms' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ transition: 'opacity 100ms, transform 80ms' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving…</span></>
                : <><Save className="w-4 h-4" /><span>{event?.id ? 'Save Changes' : 'Create Event'}</span></>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Render into document.body portal — completely outside the CalendarPage tree
  return ReactDOM.createPortal(modal, document.body)
}
