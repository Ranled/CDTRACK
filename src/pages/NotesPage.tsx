import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Search, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, StickyNote
} from 'lucide-react'
import { cn, NOTE_COLORS, truncate } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color: string
  pinned: boolean
  created_at: string
  updated_at: string
}

const defaultForm = { title: '', content: '', color: '#FFFFFF', pinned: false }

export default function NotesPage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editNote, setEditNote] = useState<Note | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchNotes = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openCreate = () => {
    setEditNote(null)
    setForm({ ...defaultForm })
    setShowForm(true)
  }

  const openEdit = (note: Note) => {
    setEditNote(note)
    setForm({ title: note.title, content: note.content, color: note.color, pinned: note.pinned })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      content: form.content,
      color: form.color,
      pinned: form.pinned,
    }
    if (editNote) {
      await supabase.from('notes').update(payload).eq('id', editNote.id)
    } else {
      await supabase.from('notes').insert(payload)
    }
    setSaving(false)
    setShowForm(false)
    fetchNotes()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', id)
    fetchNotes()
  }

  const togglePin = async (note: Note) => {
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    fetchNotes()
  }

  const getTextColor = (color: string) => {
    const c = NOTE_COLORS.find(nc => nc.value === color)
    return c?.textClass || 'text-gray-800'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Your personal notes and thoughts</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          New Note
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <StickyNote className="w-12 h-12 text-muted-foreground/25 mb-4" />
          <p className="text-base font-semibold text-muted-foreground">
            {searchQuery ? 'No notes match your search' : 'No notes yet'}
          </p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {!searchQuery && 'Click "New Note" to capture your first thought.'}
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {filtered.map(note => (
            <div
              key={note.id}
              className="break-inside-avoid mb-4 rounded-xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden group"
              style={{ backgroundColor: note.color }}
            >
              <div className="p-4 space-y-2">
                {/* Note header */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn('font-semibold text-sm leading-tight', getTextColor(note.color))}>
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-1 rounded hover:bg-black/5 transition-colors"
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      {note.pinned
                        ? <PinOff className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                        : <Pin className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                      }
                    </button>
                    <button onClick={() => openEdit(note)} className="p-1 rounded hover:bg-black/5 transition-colors">
                      <Edit2 className={cn('w-3.5 h-3.5', getTextColor(note.color))} />
                    </button>
                    <button onClick={() => handleDelete(note.id)} className="p-1 rounded hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {note.pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                )}

                {note.content && (
                  <p className={cn('text-xs leading-relaxed whitespace-pre-wrap', getTextColor(note.color), 'opacity-80')}>
                    {truncate(note.content, 200)}
                  </p>
                )}

                <p className={cn('text-[10px] mt-2 opacity-50', getTextColor(note.color))}>
                  {format(parseISO(note.updated_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-background rounded-2xl shadow-panel w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {editNote ? 'Edit Note' : 'New Note'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title</label>
                <input
                  className="cd-input"
                  placeholder="Note title..."
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Content</label>
                <textarea
                  className="cd-input min-h-[120px] resize-none"
                  placeholder="Write your note here..."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {NOTE_COLORS.map(nc => (
                    <button
                      key={nc.value}
                      onClick={() => setForm(f => ({ ...f, color: nc.value }))}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
                        form.color === nc.value ? 'border-primary scale-110' : 'border-border'
                      )}
                      style={{ backgroundColor: nc.value }}
                      title={nc.name}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  className="w-4 h-4 rounded border-border text-primary"
                />
                <span className="text-sm text-foreground">Pin this note</span>
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editNote ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
