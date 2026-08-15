import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Plus, Pin, PinOff, Trash2, Edit2, X, Save, Loader2, Megaphone,
  AlertCircle, Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'

interface Announcement {
  id: string
  title: string
  description: string
  image_url: string | null
  is_pinned: boolean
  is_important: boolean
  created_by: string
  created_at: string
}

const defaultForm = {
  title: '',
  description: '',
  image_url: '',
  is_pinned: false,
  is_important: false,
}

export default function AnnouncementsPage() {
  const { isAdmin, user } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState({ ...defaultForm })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setAnnouncements(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const openCreate = () => {
    setEditItem(null)
    setForm({ ...defaultForm })
    setShowForm(true)
  }

  const openEdit = (ann: Announcement) => {
    setEditItem(ann)
    setForm({
      title: ann.title,
      description: ann.description,
      image_url: ann.image_url || '',
      is_pinned: ann.is_pinned,
      is_important: ann.is_important,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!user || !form.title.trim()) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description,
      image_url: form.image_url || null,
      is_pinned: form.is_pinned,
      is_important: form.is_important,
      created_by: user.id,
    }
    if (editItem) {
      await supabase.from('announcements').update(payload).eq('id', editItem.id)
    } else {
      const { data: annData } = await supabase.from('announcements').insert(payload).select().single()
      // Notify all users
      if (annData) {
        const { data: profiles } = await supabase.from('profiles').select('user_id')
        if (profiles) {
          const notifs = profiles.map(p => ({
            user_id: p.user_id,
            title: 'New Announcement',
            body: form.title,
            read: false,
            type: 'announcement',
            ref_id: annData.id,
          }))
          await supabase.from('notifications').insert(notifs)
        }
      }
    }
    setSaving(false)
    setShowForm(false)
    fetch()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetch()
  }

  const togglePin = async (ann: Announcement) => {
    await supabase.from('announcements').update({ is_pinned: !ann.is_pinned }).eq('id', ann.id)
    fetch()
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
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all duration-150"
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
                'cd-card transition-all duration-200',
                ann.is_pinned && 'border-accent ring-1 ring-accent/30'
              )}
            >
              {/* Image */}
              {ann.image_url && (
                <div className="rounded-lg overflow-hidden mb-4 -mt-2">
                  <img
                    src={ann.image_url}
                    alt={ann.title}
                    className="w-full h-48 object-cover"
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
                    {ann.description.length > 200 && (
                      <button
                        onClick={() => setExpanded(expanded === ann.id ? null : ann.id)}
                        className="text-xs text-primary hover:text-primary-700 font-medium transition-colors"
                      >
                        {expanded === ann.id ? 'Show less' : 'Read more'}
                      </button>
                    )}
                    <span className="text-xs text-muted-foreground/60">
                      {format(parseISO(ann.created_at), 'MMMM d, yyyy')}
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
                    <button onClick={() => openEdit(ann)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-muted-foreground hover:text-red-600 transition-colors">
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
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-background rounded-2xl shadow-panel w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background">
              <h2 className="text-base font-semibold text-foreground">{editItem ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Title *</label>
                <input className="cd-input" placeholder="Announcement title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Description</label>
                <textarea className="cd-input min-h-[120px] resize-none" placeholder="Write your announcement..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={5} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Image URL (optional)</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className="cd-input pl-9" placeholder="https://..." value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm text-foreground">Pin announcement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_important} onChange={e => setForm(f => ({ ...f, is_important: e.target.checked }))} className="w-4 h-4" />
                  <span className="text-sm text-foreground">Mark as important</span>
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.title.trim()} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-700 active:scale-[0.98] transition-all disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editItem ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
