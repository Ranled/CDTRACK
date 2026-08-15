import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { X, Calendar, Clock, MapPin, Tag, AlertCircle, Save, Loader2 } from 'lucide-react'
import { cn, ALL_CATEGORIES } from '@/lib/utils'

interface Event {
  id?: string
  title: string
  description: string | null
  category: string
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

const defaultEvent: Event = {
  title: '',
  description: '',
  category: 'event',
  date: new Date().toISOString().split('T')[0],
  time: '',
  end_time: '',
  location: '',
  priority: 'medium',
  status: 'upcoming',
}

export default function EventForm({ event, onClose, onSave }: EventFormProps) {
  const { user } = useAuth()
  const [form, setForm] = useState<Event>(event ? { ...event } : { ...defaultEvent })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.date) { setError('Date is required.'); return }
    setLoading(true)
    setError('')

    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      category: form.category,
      date: form.date,
      time: form.time || null,
      end_time: form.end_time || null,
      location: form.location || null,
      priority: form.priority,
      status: form.status,
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
  }

  const set = (field: keyof Event, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl shadow-panel w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-base font-semibold text-foreground">
            {event?.id ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</label>
            <input
              className="cd-input"
              placeholder="Event title..."
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
              <select className="cd-input" value={form.category} onChange={e => set('category', e.target.value)}>
                {ALL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
              <select className="cd-input" value={form.priority} onChange={e => set('priority', e.target.value as Event['priority'])}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                className="cd-input pl-9"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  className="cd-input pl-9"
                  value={form.time || ''}
                  onChange={e => set('time', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="time"
                  className="cd-input pl-9"
                  value={form.end_time || ''}
                  onChange={e => set('end_time', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="cd-input pl-9"
                placeholder="Location or meeting link..."
                value={form.location || ''}
                onChange={e => set('location', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
            <select className="cd-input" value={form.status} onChange={e => set('status', e.target.value as Event['status'])}>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
            <textarea
              className="cd-input min-h-[80px] resize-none"
              placeholder="Add details about this event..."
              value={form.description || ''}
              onChange={e => set('description', e.target.value)}
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
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
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
