import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
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
    </div>
  )
}
