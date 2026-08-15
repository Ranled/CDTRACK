import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Key, LogIn } from 'lucide-react'

export default function LoginPage() {
  const { signInWithCode } = useAuth()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signInWithCode(code)
      if (result.error) setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 right-8 w-32 h-32 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Code Dreamers" className="w-14 h-14 object-contain rounded-xl bg-white/10 p-1" />
            <div>
              <div className="text-white font-bold text-xl tracking-tight">CD TRACK</div>
              <div className="text-white/60 text-sm">Academic Tracking System</div>
            </div>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-white font-bold text-4xl leading-tight">
              Stay organized.<br />Stay on track.
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-sm">
              Your centralized platform for managing academic activities, deadlines, projects, and organization events.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Track deadlines and assignments',
              'Manage organization events',
              'Collaborate with your team',
              'Never miss a thesis milestone',
            ].map(feature => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/40 text-xs">
          © 2025 Code Dreamers. All rights reserved.
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <img src="/logo.png" alt="Code Dreamers" className="w-12 h-12 object-contain" />
            <div>
              <div className="font-bold text-lg text-foreground">CD TRACK</div>
              <div className="text-muted-foreground text-xs">Academic Tracking System</div>
            </div>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-bold text-foreground">Enter Access Code</h2>
            <p className="text-muted-foreground text-sm">
              Use your organization access code to enter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Access Code</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter your access code"
                  className="cd-input pl-10 font-mono tracking-widest uppercase"
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Members: <span className="font-mono font-medium">CD01</span> &nbsp;·&nbsp; Administrators: <span className="font-mono font-medium">CDADMIN01</span>
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><LogIn className="w-4 h-4" /> Enter</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
