import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Bell, Sun, Moon, Menu, X, CheckCheck, Download, Share,
  Smartphone, Laptop, CheckCircle2, Sparkles, ArrowRight
} from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { cn, formatDate } from '@/lib/utils'
import { format } from 'date-fns'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import ReactDOM from 'react-dom'

interface Notification {
  id: string
  title: string
  body: string
  read: boolean
  type: string
  created_at: string
}

interface TopNavProps {
  onMenuToggle: () => void
}

// ─── INSTALL PWA MODAL (Appears if native 1-click prompt isn't directly triggered) ───
interface InstallModalProps {
  onClose: () => void
  onTriggerInstall: () => void
  canInstall: boolean
  isIOS: boolean
}

function InstallModal({ onClose, onTriggerInstall, canInstall, isIOS }: InstallModalProps) {
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
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 180ms ease' }}
      />

      {/* Modal Window */}
      <div
        className="relative bg-background rounded-2xl border border-border w-full max-w-md overflow-hidden shadow-2xl"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1), opacity 180ms ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Install CD TRACK</h2>
              <p className="text-xs text-muted-foreground">Add to your Phone or Computer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* If native 1-click is available, offer immediate trigger */}
          {canInstall && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Ready for 1-Click Installation!
              </p>
              <button
                onClick={() => { onTriggerInstall(); onClose() }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-700 active:scale-[0.98] transition-all shadow-sm"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            </div>
          )}

          {/* Device Guide */}
          <div className="space-y-3">
            {/* iOS Guide */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Smartphone className="w-4 h-4 text-primary" />
                iPhone / iPad (Safari)
              </div>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-none pl-0">
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">1</span>
                  Tap the <Share className="w-3 h-3 text-blue-500 inline mx-0.5" /> Share icon in Safari.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">2</span>
                  Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong>.
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">3</span>
                  Tap <strong className="text-foreground">"Add"</strong> at the top right.
                </li>
              </ol>
            </div>

            {/* Android & Desktop Guide */}
            <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Laptop className="w-4 h-4 text-primary" />
                Android & Desktop (Chrome / Edge)
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click the <strong className="text-foreground">Install</strong> icon in your browser address bar (top right) or tap the browser menu (⋮) → <strong className="text-foreground">"Install CD TRACK"</strong>.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">App Benefits</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Fast Offline Access</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Full-Screen App Mode</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> 3h Deadline Alarms</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Instant Updates</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-secondary hover:bg-border text-foreground transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ─── MAIN TOPNAV COMPONENT ────────────────────────────────────────────────
export default function TopNav({ onMenuToggle }: TopNavProps) {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const notifRef = useRef<HTMLDivElement>(null)
  const { canInstall, isIOS, isInstalled, triggerInstall } = useInstallPrompt()

  const currentMonth = format(new Date(), 'MMMM yyyy')

  useEffect(() => {
    if (!user) return
    let active = true

    const fetchNotifs = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (data && active) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read).length)
      }
    }
    fetchNotifs()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (!active) return
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(c => c + 1)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = async () => {
    if (!user) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/calendar?search=${encodeURIComponent(q)}`)
      setSearchQuery('')
    }
  }

  const handleInstallClick = () => {
    if (canInstall) {
      triggerInstall()
    } else {
      setShowInstallModal(true)
    }
  }

  const notifTypeDot: Record<string, string> = {
    announcement: 'bg-yellow-400',
    deadline: 'bg-red-400',
    event: 'bg-blue-400',
    assignment: 'bg-orange-400',
    reminder: 'bg-purple-400',
    general: 'bg-gray-400',
  }

  return (
    <header className="h-16 bg-background border-b border-border flex items-center px-4 gap-3 sm:gap-4 sticky top-0 z-30">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Current month */}
      <div className="hidden md:block flex-shrink-0">
        <span className="text-sm font-semibold text-foreground">{currentMonth}</span>
      </div>

      {/* Global Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md mx-2 sm:mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events, notes, announcements..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-secondary rounded-lg border border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground placeholder:text-muted-foreground transition-all duration-150"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto flex-shrink-0">
        {/* 1-CLICK EASY INSTALL BUTTON — MOVED TO THE LEFT SIDE OF NIGHT MODE */}
        {!isInstalled && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-700 active:scale-[0.97] transition-all duration-150 shadow-sm flex-shrink-0"
            title="Install CD TRACK App to Home Screen"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Dark / Light Mode Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150 flex items-center justify-center flex-shrink-0"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-500" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative flex-shrink-0">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-150"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-panel animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-xs text-primary hover:text-primary-700 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors cursor-pointer',
                        !notif.read && 'bg-primary/5'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 mt-1">
                          <span className={`w-2 h-2 rounded-full block ${notifTypeDot[notif.type] || 'bg-gray-400'}`} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.body}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1 font-mono">
                            {format(new Date(notif.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Install Modal */}
      {showInstallModal && (
        <InstallModal
          onClose={() => setShowInstallModal(false)}
          onTriggerInstall={triggerInstall}
          canInstall={canInstall}
          isIOS={isIOS}
        />
      )}
    </header>
  )
}
