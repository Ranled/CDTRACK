import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/contexts/ThemeContext'
import { User, Shield, Edit2, Save, X, Sun, Moon, LogOut, Loader2, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const { profile, user, signOut, refreshProfile, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [editName, setEditName] = useState(false)
  const [newName, setNewName] = useState(profile?.display_name || '')
  const [saving, setSaving] = useState(false)

  const handleSaveName = async () => {
    if (!user || !newName.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ display_name: newName.trim() }).eq('user_id', user.id)
    await refreshProfile()
    setSaving(false)
    setEditName(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="cd-card space-y-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editName ? (
              <div className="flex items-center gap-2">
                <input
                  className="cd-input flex-1 text-base font-semibold"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditName(false) }}
                />
                <button onClick={handleSaveName} disabled={saving} className="p-2 rounded-lg bg-primary text-white hover:bg-primary-700 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button onClick={() => { setEditName(false); setNewName(profile?.display_name || '') }} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground truncate">{profile?.display_name}</h2>
                <button
                  onClick={() => { setEditName(true); setNewName(profile?.display_name || '') }}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
              )}>
                {isAdmin ? <><Shield className="w-3 h-3" /> Administrator</> : <><User className="w-3 h-3" /> Member</>}
              </span>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 capitalize">{profile?.role}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {profile?.created_at ? format(parseISO(profile.created_at), 'MMMM d, yyyy') : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="cd-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Preferences</h3>

        {/* Dark mode */}
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">{theme === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}</p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            onClick={toggleTheme}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              theme === 'dark' ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'
            )}
          >
            <span className="sr-only">Toggle Dark Mode</span>
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>

        {/* Notifications & 3-Hour Alarm */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">3-Hour Deadline Alarm</p>
              <p className="text-xs text-muted-foreground">Audio chime & push alerts 3 hours before deadlines</p>
            </div>
          </div>
          <button
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission().then(perm => {
                  if (perm === 'granted') {
                    new Notification('⏰ CD TRACK 3-Hour Deadline Alarm Enabled', {
                      body: "You'll be alerted 3 hours before every assignment and exam deadline.",
                      icon: '/logo.png',
                    })
                  }
                })
              }
            }}
            className="px-3 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
          >
            Enable
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="cd-card space-y-3 border-red-100 dark:border-red-900">
        <h3 className="text-sm font-semibold text-foreground">Account Actions</h3>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
