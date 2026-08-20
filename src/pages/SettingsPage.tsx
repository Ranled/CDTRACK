import React, { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon, Bell, Volume2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { playAlarmSound } from '@/hooks/useDeadlineAlarm'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [notifStatus, setNotifStatus] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission
    }
    return 'default'
  })
  const [tested, setTested] = useState(false)

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifStatus(perm)
      if (perm === 'granted') {
        new Notification('⏰ CD TRACK Deadline Alarm Enabled', {
          body: "You will be alerted with an audio chime and notification 3 hours before every deadline!",
          icon: '/logo.png',
        })
      }
    }
  }

  const handleTestAlarm = () => {
    playAlarmSound()
    if ('vibrate' in navigator) navigator.vibrate([150, 80, 150])
    setTested(true)
    setTimeout(() => setTested(false), 3000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Customize your app preferences and alerts</p>
      </div>

      {/* Appearance Section */}
      <div className="cd-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
              {isDark ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark / light appearance</p>
            </div>
          </div>

          {/* Pixel-perfect standard toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            onClick={toggleTheme}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              isDark ? 'bg-primary' : 'bg-neutral-300 dark:bg-neutral-700'
            )}
          >
            <span className="sr-only">Toggle Dark Mode</span>
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                isDark ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </button>
        </div>
      </div>

      {/* Notifications & 3-Hour Deadline Alarm */}
      <div className="cd-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Deadline Alarms & Alerts</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            3-Hour Prior Active
          </span>
        </div>

        {/* 3-Hour Alarm Details */}
        <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">3-Hour Deadline Alarm</p>
              <p className="text-xs text-muted-foreground">
                Automatically plays an audio chime and sends an urgent notification 3 hours before every assignment, exam, or project is due.
              </p>
            </div>
          </div>
        </div>

        {/* Test Sound & Permissions */}
        <div className="space-y-3 pt-1">
          {/* Test Alarm Sound Button */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                <Volume2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Alarm Sound Chime</p>
                <p className="text-xs text-muted-foreground">Audible dual-tone chime (works offline)</p>
              </div>
            </div>
            <button
              onClick={handleTestAlarm}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary hover:bg-border text-foreground transition-all duration-150 active:scale-95 shadow-sm"
            >
              <Volume2 className="w-3.5 h-3.5" />
              {tested ? 'Playing...' : 'Test Alarm'}
            </button>
          </div>

          {/* Browser Notification Permissions */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary text-muted-foreground">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">System Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Status: <strong className={notifStatus === 'granted' ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}>{notifStatus === 'granted' ? 'Enabled' : 'Not Enabled'}</strong>
                </p>
              </div>
            </div>
            {notifStatus === 'granted' ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/50 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            ) : (
              <button
                onClick={requestNotifPermission}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-700 transition-all duration-150 shadow-sm"
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
