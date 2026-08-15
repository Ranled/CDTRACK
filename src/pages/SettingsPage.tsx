import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Sun, Moon } from 'lucide-react'

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>
      <div className="cd-card space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium text-foreground">Dark Mode</p>
              <p className="text-xs text-muted-foreground">Toggle dark / light appearance</p>
            </div>
          </div>
          <button onClick={toggleTheme} className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
