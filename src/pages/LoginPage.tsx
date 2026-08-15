import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Key, LogIn, Loader2 } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#0a1628]">

      {/* Subtle background orbs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#1B3A7A]/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#0F2C6F]/40 blur-[100px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-[#FACC15]/5 blur-[80px]" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 animate-fade-in">

        {/* Logo + Heading */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(27,58,122,0.5)]">
              <img
                src="/logo.png"
                alt="CD TRACK"
                className="w-14 h-14 object-contain"
              />
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">CD TRACK</h1>
            <p className="text-sm text-white/50 tracking-widest uppercase font-medium">
              Academic Tracking System
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-white">Enter Access Code</h2>
            <p className="text-sm text-white/50">
              Enter your assigned access code to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Access Code Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/20 font-mono tracking-widest uppercase text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 focus:border-[#FACC15]/40 transition-all duration-200"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#FACC15] text-[#0a1628] rounded-xl font-semibold text-sm hover:bg-[#F59E0B] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2 shadow-[0_4px_20px_rgba(250,204,21,0.25)]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Enter
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-xs text-white/25">
            © 2026 All Rights Reserved
          </p>
          <p className="text-xs text-white/20">
            Developed by <span className="text-white/40 font-medium">Raian Lee D. Vallejo</span>
          </p>
        </div>

      </div>
    </div>
  )
}
