import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, StickyNote, Eye
} from 'lucide-react'
import { cn, NOTE_COLORS, truncate } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color: string
  pinned: boolean
  created_at: string
  updated_at: string
}

// ─── FULL-VIEW READ MODAL (click a note card to open) ─────────────────────
interface NoteViewModalProps {
  note: Note
  getTextColor: (color: string) => string
  onClose: () => void
  // Admin-only actions passed down so view modal can offer Edit/Delete
  onEdit?: () => void
  onDelete?: () => void
  isAdmin: boolean
}

function NoteViewModal({ note, getTextColor, onClose, onEdit, onDelete, isAdmin }: NoteViewModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ isolation: 'isolate' }}
      role="dialog"
      aria-modal="true"
      aria-label={note.title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease', willChange: 'opacity' }}
      />

      {/* Panel */}
      <div
        className="relative rounded-2xl border border-border w-full max-w-lg overflow-hidden"
        style={{
          backgroundColor: note.color,
          maxHeight: '85dvh',
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
          willChange: 'transform, opacity',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {note.pinned && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary mb-1.5">
                <Pin className="w-2.5 h-2.5" /> PINNED
              </span>
            )}
            <h2 className={cn('text-lg font-bold leading-snug', getTextColor(note.color))}>
              {note.title}
            </h2>
            <p className={cn('text-[11px] mt-1 opacity-50 font-mono', getTextColor(note.color))}>
              {format(parseISO(note.updated_at || note.created_at), 'MMMM d, yyyy · h:mm a')}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Admin actions inside the view modal */}
            {isAdmin && onEdit && (
              <button
                onClick={() => { onClose(); setTimeout(() => onEdit(), 80) }}
                className={cn('p-1.5 rounded-lg hover:bg-black/10 transition-colors', getTextColor(note.color))}
                title="Edit note"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isAdmin && onDelete && (
              <button
                onClick={() => { onClose(); onDelete() }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-red-600"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={cn('p-1.5 rounded-lg hover:bg-black/10 transition-colors', getTextColor(note.color))}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Full content — scrollable */}
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          {note.content ? (
            <p className={cn('text-sm leading-relaxed whitespace-pre-wrap', getTextColor(note.color), 'opacity-90')}>
              {note.content}
            </p>
          ) : (
            <p className={cn('text-sm italic opacity-40', getTextColor(note.color))}>No content.</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── EDIT / CREATE MODAL (admin only) ─────────────────────────────────────
interface NoteModalProps {
  note: Note | null
  onClose: () => void
  onSave: (data: { title: string; content: string; color: string; pinned: boolean }) => Promise<void>
}

function NoteModal({ note, onClose, onSave }: NoteModalProps) {
  const titleRef    = useRef<HTMLInputElement>(null)
  const contentRef  = useRef<HTMLTextAreaElement>(null)
  const [color, setColor]   = useState(note?.color || '#FFFFFF')
  const [pinned, setPinned] = useState(note?.pinned || false)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    const t   = setTimeout(() => titleRef.current?.focus(), 70)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, saving])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const title   = titleRef.current?.value.trim() || ''
    const content = contentRef.current?.value || ''
    if (!title) { titleRef.current?.focus(); return }
    setSaving(true)
    try { await onSave({ title, content, color, pinned }); onClose() }
    finally { setSaving(false) }
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
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease', willChange: 'opacity' }}
      />
      <div
        className="relative bg-background rounded-2xl shadow-panel w-full max-w-md border border-border"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button type="button" onClick={onClose} disabled={saving}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title *</label>
            <input ref={titleRef} defaultValue={note?.title || ''} className="cd-input"
              placeholder="Note title..." maxLength={150} required />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Content</label>
            <textarea ref={contentRef} defaultValue={note?.content || ''}
              className="cd-input min-h-[140px] resize-none" placeholder="Write your note here..." rows={6} />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {NOTE_COLORS.map(nc => (
                <button type="button" key={nc.value} onClick={() => setColor(nc.value)}
                  className={cn('w-6 h-6 rounded-full border-2 transition-transform active:scale-95',
                    color === nc.value ? 'border-primary scale-110 shadow-sm' : 'border-border')}
                  style={{ backgroundColor: nc.value }} title={nc.name} />
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary" />
            <span className="text-sm text-foreground">Pin this note to the top</span>
          </label>

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{note ? 'Save Changes' : 'Create Note'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ─── MAIN NOTES PAGE ───────────────────────────────────────────────────────
export default function NotesPage() {
  const { user, isAdmin } = useAuth()
  const [notes, setNotes]             = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [loading, setLoading]         = useState(true)

  // ── Fetch ALL notes (centralised — not filtered by user_id) ──────────────
  const fetchNotes = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notes')
        .select('*')
        .order('pinned',      { ascending: false })
        .order('updated_at',  { ascending: false })
      setNotes(data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return notes
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q)
    )
  }, [notes, searchQuery])

  // Admin-only write actions
  const openCreate = () => { setEditingNote(null); setShowModal(true) }
  const openEdit   = (note: Note) => { setEditingNote(note); setShowModal(true) }

  const handleSaveNote = async (data: { title: string; content: string; color: string; pinned: boolean }) => {
    if (!user) return
    const payload = { user_id: user.id, title: data.title, content: data.content, color: data.color, pinned: data.pinned }

    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...n, ...payload, updated_at: new Date().toISOString() } : n))
      await supabase.from('notes').update(payload).eq('id', editingNote.id)
    } else {
      const tempId = 'temp-' + Date.now()
      const optimistic: Note = { id: tempId, user_id: user.id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      setNotes(prev => data.pinned ? [optimistic, ...prev] : [...prev, optimistic])
      const { data: inserted } = await supabase.from('notes').insert(payload).select().single()
      if (inserted) setNotes(prev => prev.map(n => n.id === tempId ? inserted : n))
    }
  }

  const handleDelete = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    await supabase.from('notes').delete().eq('id', id)
  }

  const togglePin = async (note: Note) => {
    const newPinned = !note.pinned
    setNotes(prev => {
      const updated = prev.map(n => n.id === note.id ? { ...n, pinned: newPinned } : n)
      return updated.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
    })
    await supabase.from('notes').update({ pinned: newPinned }).eq('id', note.id)
  }

  const getTextColor = (color: string) => NOTE_COLORS.find(nc => nc.value === color)?.textClass || 'text-gray-800'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Class Notes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Shared notes visible to all members · click any note to read in full
          </p>
        </div>
        {/* Only admins can create notes */}
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="cd-input pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote className="w-12 h-12 text-muted-foreground/25 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">
            {searchQuery ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {!searchQuery && isAdmin && 'Click "New Note" to add the first class note.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className="break-inside-avoid mb-4 rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-150 overflow-hidden group cursor-pointer"
              style={{ backgroundColor: note.color }}
              // Clicking the card body opens the full-view read modal
              onClick={() => setViewingNote(note)}
            >
              <div className="p-4 space-y-2">
                {/* Note header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn('font-semibold text-sm leading-tight', getTextColor(note.color))}>
                    {note.title}
                  </h3>

                  {/* Admin action buttons — stop propagation so they don't open the view modal */}
                  {isAdmin && (
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => togglePin(note)}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        title={note.pinned ? 'Unpin' : 'Pin'}
                      >
                        {note.pinned
                          ? <PinOff className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                          : <Pin    className={cn('w-3.5 h-3.5', getTextColor(note.color))} />}
                      </button>
                      <button
                        onClick={() => openEdit(note)}
                        className="p-1 rounded hover:bg-black/10 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {note.pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}

                {note.content && (
                  <p className={cn('text-xs leading-relaxed whitespace-pre-wrap', getTextColor(note.color), 'opacity-85')}>
                    {truncate(note.content, 220)}
                  </p>
                )}

                {/* "Read more" hint when content is truncated */}
                {note.content.length > 220 && (
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold opacity-60', getTextColor(note.color))}>
                    <Eye className="w-3 h-3" /> Read more
                  </span>
                )}

                <p className={cn('text-[10px] mt-2 opacity-50 font-mono', getTextColor(note.color))}>
                  {format(parseISO(note.updated_at || note.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-view read modal — opens for everyone on card click */}
      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          getTextColor={getTextColor}
          onClose={() => setViewingNote(null)}
          isAdmin={isAdmin}
          onEdit={isAdmin ? () => { setViewingNote(null); openEdit(viewingNote) } : undefined}
          onDelete={isAdmin ? () => { setViewingNote(null); handleDelete(viewingNote.id) } : undefined}
        />
      )}

      {/* Edit / create modal — admin only */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onClose={() => { setShowModal(false); setEditingNote(null) }}
          onSave={handleSaveNote}
        />
      )}
    </div>
  )
}
