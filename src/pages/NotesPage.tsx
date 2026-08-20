import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, StickyNote, Eye,
  Calendar, Clock, ShieldAlert, Lock
} from 'lucide-react'
import { cn, NOTE_COLORS, truncate } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal'

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

// ─── WINDOW-STYLE FULL VIEW MODAL ─────────────────────────────────────────
interface NoteViewModalProps {
  note: Note
  getTextColor: (color: string) => string
  onClose: () => void
  onEdit?: () => void
  onDelete?: () => void
  isAdmin: boolean
  canEdit: boolean
}

function NoteViewModal({ note, getTextColor, onClose, onEdit, onDelete, isAdmin, canEdit }: NoteViewModalProps) {
  const [visible, setVisible] = useState(false)
  const [showDeleteHelp, setShowDeleteHelp] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const textColor = getTextColor(note.color)

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ isolation: 'isolate' }}
      role="dialog"
      aria-modal="true"
      aria-label={note.title}
    >
      {/* Dimmed backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease', willChange: 'opacity' }}
      />

      {/* Window-Style Container */}
      <div
        className="relative rounded-2xl border border-border/80 w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        style={{
          backgroundColor: note.color,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 180ms ease',
          willChange: 'transform, opacity',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0,0,0,0.08)',
        }}
      >
        {/* Window Top Titlebar (OS-style) */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 flex-shrink-0 select-none">
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
            <div className="flex items-center gap-1.5 min-w-0 text-xs font-semibold opacity-75 truncate">
              <StickyNote className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Note View — {note.title}</span>
            </div>
          </div>

          {/* Right actions + Prominent X Close Button */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {canEdit && onEdit && (
              <button
                onClick={() => { onClose(); setTimeout(() => onEdit(), 80) }}
                className={cn('flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium hover:bg-black/10 dark:hover:bg-white/10 transition-colors', textColor)}
                title="Edit note"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Admin Delete vs Member Delete Notice */}
            {isAdmin && onDelete ? (
              <button
                onClick={() => { onClose(); onDelete() }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors"
                title="Delete note (Admin)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            ) : !isAdmin && (
              <button
                onClick={() => setShowDeleteHelp(v => !v)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium opacity-60 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                title="Only admins can delete notes"
              >
                <Lock className="w-3 h-3" />
                <span className="hidden sm:inline">Delete Info</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black/15 dark:hover:bg-white/15 text-foreground/80 hover:text-foreground transition-colors ml-1"
              aria-label="Close window"
              title="Close window (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Member delete notice banner */}
        {showDeleteHelp && !isAdmin && (
          <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Only Administrators can delete class notes. Please contact an Admin if you wish to remove this note.
            </span>
            <button onClick={() => setShowDeleteHelp(false)} className="p-1 hover:bg-amber-500/20 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Window Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-4">
          {/* Note Metadata Banner */}
          <div className="space-y-2 border-b border-black/10 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {note.pinned && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-primary text-white shadow-sm">
                  <Pin className="w-3 h-3" /> Pinned Note
                </span>
              )}
              <span className={cn('text-xs opacity-60 font-mono flex items-center gap-1.5', textColor)}>
                <Calendar className="w-3.5 h-3.5" />
                {format(parseISO(note.updated_at || note.created_at), 'MMMM d, yyyy · h:mm a')}
              </span>
            </div>
            <h1 className={cn('text-xl sm:text-2xl font-bold tracking-tight leading-snug', textColor)}>
              {note.title}
            </h1>
          </div>

          {/* Full Note Text */}
          <div className="pt-2">
            {note.content ? (
              <div className={cn('text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal', textColor, 'opacity-95')}>
                {note.content}
              </div>
            ) : (
              <p className={cn('text-sm italic opacity-40', textColor)}>This note has no written text.</p>
            )}
          </div>
        </div>

        {/* Window Footer */}
        <div className="px-6 py-3.5 border-t border-black/10 dark:border-white/10 bg-black/5 dark:bg-black/20 flex items-center justify-between flex-shrink-0">
          <span className={cn('text-xs opacity-50 font-mono', textColor)}>
            {note.content ? `${note.content.length} characters` : '0 characters'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── EDIT / CREATE MODAL (Available to both Member & Admin) ─────────────────
interface NoteModalProps {
  note: Note | null
  onClose: () => void
  onSave: (data: { title: string; content: string; color: string; pinned: boolean }) => Promise<void>
  isAdmin: boolean
}

function NoteModal({ note, onClose, onSave, isAdmin }: NoteModalProps) {
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
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => { if (!saving) onClose() }}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 150ms ease', willChange: 'opacity' }}
      />
      <div
        className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg border border-border overflow-hidden"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'transform 200ms cubic-bezier(0.16,1,0.3,1), opacity 150ms ease',
          willChange: 'transform, opacity',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              {note ? 'Edit Note' : 'New Note'}
            </h2>
          </div>
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
              className="cd-input min-h-[140px] resize-none" placeholder="Write your note details here..." rows={6} />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Note Color</label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {NOTE_COLORS.map(nc => (
                <button type="button" key={nc.value} onClick={() => setColor(nc.value)}
                  className={cn('w-7 h-7 rounded-full border-2 transition-transform active:scale-95',
                    color === nc.value ? 'border-primary scale-110 shadow-md ring-2 ring-primary/20' : 'border-border')}
                  style={{ backgroundColor: nc.value }} title={nc.name} />
              ))}
            </div>
          </div>

          {/* Pin option — only admins can pin to top */}
          {isAdmin && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary" />
              <span className="text-sm font-medium text-foreground">Pin this note to the top</span>
            </label>
          )}

          <div className="flex items-center gap-3 pt-3 border-t border-border">
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
  const { user, isAdmin, isViewer } = useAuth()
  const [notes, setNotes]             = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [viewingNote, setViewingNote] = useState<Note | null>(null)
  const [loading, setLoading]         = useState(true)

  // ── Fetch ALL notes (centralised) ─────────────────────────────────────────
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

  // Both Admin & Member can create notes (viewers cannot)
  const openCreate = () => {
    if (isViewer) return
    setEditingNote(null)
    setShowModal(true)
  }
  
  // Can edit if admin or author (viewers cannot)
  const canEditNote = (note: Note) => !isViewer && (isAdmin || (user && user.id === note.user_id))
  const openEdit    = (note: Note) => {
    if (isViewer) return
    setEditingNote(note)
    setShowModal(true)
  }

  const handleSaveNote = async (data: { title: string; content: string; color: string; pinned: boolean }) => {
    if (!user || isViewer) return
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

  const [deletingNote, setDeletingNote] = useState<Note | null>(null)

  // Delete is strictly Admin-only
  const confirmDeleteNote = async (noteToDelete: Note) => {
    if (!isAdmin) return
    setDeletingNote(null)
    if (viewingNote?.id === noteToDelete.id) {
      setViewingNote(null)
    }
    setNotes(prev => prev.filter(n => n.id !== noteToDelete.id))
    await supabase.from('notes').delete().eq('id', noteToDelete.id)
  }

  const togglePin = async (note: Note) => {
    if (!isAdmin) return
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
            {isViewer
              ? 'Shared class notes · viewing in read-only mode'
              : 'Shared notes board · all members can add notes · only admins can delete notes'}
          </p>
        </div>

        {/* "New Note" Button is visible to Admin & Member (hidden for Viewer) */}
        {!isViewer && (
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
            Click "New Note" above to add your thought to the class board.
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filteredNotes.map(note => {
            const isAuthor = Boolean(user && user.id === note.user_id)
            const canEdit = Boolean(isAdmin || isAuthor)

            return (
              <div
                key={note.id}
                className="break-inside-avoid mb-4 rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-150 overflow-hidden group cursor-pointer active:scale-[0.99]"
                style={{ backgroundColor: note.color }}
                onClick={() => setViewingNote(note)}
              >
                <div className="p-4 space-y-2">
                  {/* Note header */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={cn('font-semibold text-sm leading-tight', getTextColor(note.color))}>
                      {note.title}
                    </h3>

                    {/* Action buttons on card hover */}
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={e => e.stopPropagation()}
                    >
                      {/* Pin (Admin only) */}
                      {isAdmin && (
                        <button
                          onClick={() => togglePin(note)}
                          className="p-1 rounded hover:bg-black/10 transition-colors"
                          title={note.pinned ? 'Unpin' : 'Pin'}
                        >
                          {note.pinned
                            ? <PinOff className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                            : <Pin    className={cn('w-3.5 h-3.5', getTextColor(note.color))} />}
                        </button>
                      )}

                      {/* Edit (Admin or Author) */}
                      {canEdit && (
                        <button
                          onClick={() => openEdit(note)}
                          className="p-1 rounded hover:bg-black/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                        </button>
                      )}

                      {/* Delete (STRICTLY ADMIN ONLY) */}
                      {isAdmin && (
                        <button
                          onClick={() => setDeletingNote(note)}
                          className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-600"
                          title="Delete (Admin only)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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

                  {note.content.length > 220 && (
                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold opacity-60 pt-1', getTextColor(note.color))}>
                      <Eye className="w-3 h-3" /> View full note
                    </span>
                  )}

                  <p className={cn('text-[10px] mt-2 opacity-50 font-mono', getTextColor(note.color))}>
                    {format(parseISO(note.updated_at || note.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Window-Style Full View Modal */}
      {viewingNote && (
        <NoteViewModal
          note={viewingNote}
          getTextColor={getTextColor}
          onClose={() => setViewingNote(null)}
          isAdmin={isAdmin}
          canEdit={Boolean(canEditNote(viewingNote))}
          onEdit={() => { setViewingNote(null); openEdit(viewingNote) }}
          onDelete={isAdmin ? () => setDeletingNote(viewingNote) : undefined}
        />
      )}

      {/* Edit / Create modal (Accessible by Members & Admin) */}
      {showModal && (
        <NoteModal
          note={editingNote}
          onClose={() => { setShowModal(false); setEditingNote(null) }}
          onSave={handleSaveNote}
          isAdmin={isAdmin}
        />
      )}

      {/* Admin Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingNote)}
        title="Delete Note"
        itemName={deletingNote?.title}
        message="Are you sure you want to permanently delete this note from the class board?"
        onConfirm={() => { if (deletingNote) confirmDeleteNote(deletingNote) }}
        onCancel={() => setDeletingNote(null)}
      />
    </div>
  )
}
