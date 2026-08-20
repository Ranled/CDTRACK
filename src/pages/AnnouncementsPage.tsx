import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import ReactDOM from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, Megaphone,
  AlertCircle, Image as ImageIcon, Eye, Calendar, Clock, ExternalLink,
  Lock, StickyNote, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'

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

// ─── WINDOW-STYLE FULL VIEW ANNOUNCEMENT MODAL ────────────────────────────
interface AnnouncementViewModalProps {
  item: Announcement
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  isAdmin: boolean
}

function AnnouncementViewModal({ item, onClose, onEdit, onDelete, isAdmin }: AnnouncementViewModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ isolation: 'isolate' }}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease', willChange: 'opacity' }}
      />

      {/* Window-Style Container */}
      <div
        className="relative bg-background rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 180ms ease',
          willChange: 'transform, opacity',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Window Top Titlebar (OS-style) */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border bg-secondary/40 flex-shrink-0 select-none">
          {/* Window control dots & title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={onClose}
                className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
                title="Close"
              >
                <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100" />
              </button>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-muted-foreground truncate">
              <Megaphone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="truncate">Announcement — {item.title}</span>
            </div>
          </div>

          {/* Right actions + Prominent X Close Button */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isAdmin && onEdit && (
              <button
                onClick={() => { onClose(); setTimeout(() => onEdit(), 80) }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Edit announcement"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={() => { onClose(); onDelete() }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="Delete announcement"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ml-1"
              aria-label="Close window"
              title="Close window (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Window Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-5">
          {/* Badges & Meta */}
          <div className="space-y-2.5 border-b border-border pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {item.is_pinned && (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-accent text-yellow-900 px-2.5 py-0.5 rounded-full shadow-sm">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              {item.is_important && (
                <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400 px-2.5 py-0.5 rounded-full shadow-sm">
                  <AlertCircle className="w-3 h-3" /> Important Notice
                </span>
              )}
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 ml-auto">
                <Calendar className="w-3.5 h-3.5" />
                {item.created_at ? format(parseISO(item.created_at), 'MMMM d, yyyy · h:mm a') : ''}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
              {item.title}
            </h1>
          </div>

          {/* Full High-Res Image (if available) */}
          {item.image_url && (
            <div className="rounded-xl overflow-hidden bg-secondary/30 border border-border shadow-sm">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full max-h-[380px] object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          {/* Full Description */}
          <div className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal">
            {item.description}
          </div>
        </div>

        {/* Window Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-secondary/20 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-muted-foreground font-mono">
            Code Dreamers Official Announcement
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-700 transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
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
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => { if (!saving) onClose() }}
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 150ms ease',
          willChange: 'opacity',
        }}
      />
      <div
        className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-scroll border border-border"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {item ? 'Edit Announcement' : 'New Announcement'}
            </h2>
          </div>
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

          <div className="flex items-center gap-6 select-none pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm font-medium text-foreground">Pin announcement</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary"
              />
              <span className="text-sm font-medium text-foreground">Mark as important</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-border">
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
  const { user, isAdmin, isViewer } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [viewingItem, setViewingItem] = useState<Announcement | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    if (isViewer) {
      setLoading(false)
      return
    }
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
  }, [isViewer])

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
        // Fire notifications in background to all members & admins (EXCEPT viewers)
        supabase
          .from('profiles')
          .select('user_id, role')
          .neq('role', 'viewer')
          .then(({ data: profiles }) => {
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

  const [deletingItem, setDeletingItem] = useState<Announcement | null>(null)

  const confirmDeleteAnnouncement = async (itemToDelete: Announcement) => {
    setDeletingItem(null)
    if (viewingItem?.id === itemToDelete.id) {
      setViewingItem(null)
    }
    setAnnouncements(prev => prev.filter(a => a.id !== itemToDelete.id))
    await supabase.from('announcements').delete().eq('id', itemToDelete.id)
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

  // If viewer, display stylish restricted access screen
  if (isViewer) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[65vh] text-center">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 mb-4 shadow-sm animate-scale-in">
          <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Announcements Restricted</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
          Official section announcements and updates are restricted to verified Code Dreamers members and officers.
          As a guest viewer, you have full read access to the Academic Calendar and Class Notes.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            to="/calendar"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-700 active:scale-95 transition-all shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            View Calendar
          </Link>
          <Link
            to="/notes"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-foreground text-xs font-semibold hover:bg-border active:scale-95 transition-all"
          >
            <StickyNote className="w-3.5 h-3.5" />
            View Notes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Organization-wide updates · click any announcement card to open full-window view
          </p>
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
              onClick={() => setViewingItem(ann)}
              className={cn(
                'cd-card transition-all duration-150 cursor-pointer hover:shadow-card-hover group active:scale-[0.995]',
                ann.is_pinned && 'border-accent ring-1 ring-accent/30'
              )}
            >
              {/* Image */}
              {ann.image_url && (
                <div className="rounded-lg overflow-hidden mb-4 -mt-2 bg-secondary/50">
                  <img
                    src={ann.image_url}
                    alt={ann.title}
                    className="w-full h-48 object-cover group-hover:scale-[1.01] transition-transform duration-200"
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

                  <h3 className="text-base font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {ann.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {ann.description}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <Eye className="w-3.5 h-3.5" /> View full window
                    </span>
                    <span className="text-xs text-muted-foreground/60 font-mono">
                      {ann.created_at ? format(parseISO(ann.created_at), 'MMMM d, yyyy') : ''}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={e => e.stopPropagation()}
                  >
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
                      onClick={() => setDeletingItem(ann)}
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

      {/* Window-Style Full View Modal */}
      {viewingItem && (
        <AnnouncementViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          isAdmin={isAdmin}
          onEdit={isAdmin ? () => { setViewingItem(null); openEdit(viewingItem) } : undefined}
          onDelete={isAdmin ? () => setDeletingItem(viewingItem) : undefined}
        />
      )}

      {/* Form Modal */}
      {showModal && (
        <AnnouncementModal
          item={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSaveAnnouncement}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingItem)}
        title="Delete Announcement"
        itemName={deletingItem?.title}
        message="Are you sure you want to permanently delete this announcement? This action cannot be undone."
        onConfirm={() => { if (deletingItem) confirmDeleteAnnouncement(deletingItem) }}
        onCancel={() => setDeletingItem(null)}
      />
    </div>
  )
}
