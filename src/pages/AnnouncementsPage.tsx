import React, { useEffect, useState, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, Megaphone,
  AlertCircle, Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

export interface Announcement {
  id: string
  title: string
  description: string
  image_url: string | null
  is_pinned: boolean
  is_important: boolean
  created_by: string
  created_at: string
}

// ─── ISOLATED ANNOUNCEMENT MODAL ──────────────────────────────────────────
interface AnnouncementModalProps {
  item: Announcement | null
  onClose: () => void
  onSave: (data: { title: string; description: string; image_url: string | null; is_pinned: boolean; is_important: boolean }) => Promise<void>
}

function AnnouncementModal({ item, onClose, onSave }: AnnouncementModalProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const [isPinned, setIsPinned] = useState(item?.is_pinned || false)
  const [isImportant, setIsImportant] = useState(item?.is_important || false)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => titleRef.current?.focus(), 70)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = titleRef.current?.value.trim() || ''
    const description = descRef.current?.value.trim() || ''
    const image_url = imageRef.current?.value.trim() || null

    if (!title) {
      titleRef.current?.focus()
      return
    }

    setSaving(true)
    try {
      await onSave({ title, description, image_url, is_pinned: isPinned, is_important: isImportant })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => { if (!saving) onClose() }}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 150ms ease',
          willChange: 'opacity',
        }}
      />
      <div
        className="relative bg-background rounded-2xl shadow-panel w-full max-w-lg max-h-[90vh] overflow-y-scroll border border-border"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="text-base font-semibold text-foreground">
            {item ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Title *
            </label>
            <input
              ref={titleRef}
              defaultValue={item?.title || ''}
              className="cd-input"
              placeholder="Announcement title..."
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              ref={descRef}
              defaultValue={item?.description || ''}
              className="cd-input min-h-[120px] resize-none"
              placeholder="Write your announcement details..."
              rows={5}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Image URL (optional)
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={imageRef}
                defaultValue={item?.image_url || ''}
                className="cd-input pl-9"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex items-center gap-6 select-none">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm text-foreground">Pin announcement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm text-foreground">Mark as important</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{item ? 'Save Changes' : 'Post Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ─── MAIN ANNOUNCEMENTS PAGE ───────────────────────────────────────────────
export default function AnnouncementsPage() {
  const { isAdmin, user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
      setAnnouncements(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const openCreate = () => {
    setEditingItem(null)
    setShowModal(true)
  }

  const openEdit = (ann: Announcement) => {
    setEditingItem(ann)
    setShowModal(true)
  }

  const handleSaveAnnouncement = async (data: {
    title: string
    description: string
    image_url: string | null
    is_pinned: boolean
    is_important: boolean
  }) => {
    if (!user) return

    const payload = {
      title: data.title,
      description: data.description,
      image_url: data.image_url,
      is_pinned: data.is_pinned,
      is_important: data.is_important,
      created_by: user.id,
    }

    if (editingItem) {
      // Optimistic update
      setAnnouncements(prev => prev.map(a => a.id === editingItem.id ? { ...a, ...payload } : a))
      await supabase.from('announcements').update(payload).eq('id', editingItem.id)
    } else {
      const tempId = 'temp-' + Date.now()
      const optimisticAnn: Announcement = {
        id: tempId,
        ...payload,
        created_at: new Date().toISOString(),
      }
      setAnnouncements(prev => data.is_pinned ? [optimisticAnn, ...prev] : [...prev, optimisticAnn])

      // Asynchronous insert + background notify
      const { data: inserted } = await supabase.from('announcements').insert(payload).select().single()
      if (inserted) {
        setAnnouncements(prev => prev.map(a => a.id === tempId ? inserted : a))
        // Fire notifications in background without blocking UI
        supabase.from('profiles').select('user_id').then(({ data: profiles }) => {
          if (profiles && profiles.length > 0) {
            const notifs = profiles.map(p => ({
              user_id: p.user_id,
              title: 'New Announcement',
              body: data.title,
              read: false,
              type: 'announcement',
              ref_id: inserted.id,
            }))
            supabase.from('notifications').insert(notifs).then(() => {})
          }
        })
      }
    }
  }

  const handleDelete = async (id: string) => {
    // Optimistic delete
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    await supabase.from('announcements').delete().eq('id', id)
  }

  const togglePin = async (ann: Announcement) => {
    const newPinned = !ann.is_pinned
    // Optimistic toggle
    setAnnouncements(prev => {
      const updated = prev.map(a => a.id === ann.id ? { ...a, is_pinned: newPinned } : a)
      return updated.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    })
    await supabase.from('announcements').update({ is_pinned: newPinned }).eq('id', ann.id)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organization-wide announcements and updates</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="w-12 h-12 text-muted-foreground/25 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">No announcements yet</p>
          {isAdmin && <p className="text-sm text-muted-foreground/60 mt-1">Create your first announcement for the team.</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(ann => (
            <div
              key={ann.id}
              className={cn(
                'cd-card transition-shadow duration-150',
                ann.is_pinned && 'border-accent ring-1 ring-accent/30'
              )}
            >
              {/* Image */}
              {ann.image_url && (
                <div className="rounded-lg overflow-hidden mb-4 -mt-2 bg-secondary/50">
                  <img
                    src={ann.image_url}
                    alt={ann.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {ann.is_pinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-accent text-yellow-900 px-2 py-0.5 rounded-full">
                        <Pin className="w-2.5 h-2.5" /> Pinned
                      </span>
                    )}
                    {ann.is_important && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-2.5 h-2.5" /> Important
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-foreground leading-tight">{ann.title}</h3>
                  <p className={cn(
                    'text-sm text-muted-foreground leading-relaxed',
                    expanded !== ann.id && 'line-clamp-3'
                  )}>
                    {ann.description}
                  </p>

                  <div className="flex items-center gap-3">
                    {ann.description && ann.description.length > 200 && (
                      <button
                        onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                        className="text-xs text-primary hover:text-primary-700 font-medium transition-colors"
                      >
                        {expanded === ann.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      {ann.created_at ? format(parseISO(ann.created_at), 'MMMM d, yyyy') : ''}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => togglePin(ann)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title={ann.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {ann.is_pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(ann)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <AnnouncementModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAnnouncement}
        />
      )}
    </div>
  )
}
