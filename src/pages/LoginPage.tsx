import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Key, LogIn, Loader2 } from 'lucide-react'

// All CD organization images
const CD_IMAGES = [
  '/cd-images/364890799_816652566797759_2380321335836222700_n.jpg',
  '/cd-images/437754671_963880858435644_4384369972237822167_n.jpg',
  '/cd-images/440148977_4199892896903699_278790799316936991_n.jpg',
  '/cd-images/440805512_1661767057924871_203884916060331406_n.jpg',
  '/cd-images/440820577_1001640644915279_1202557263125349756_n.jpg',
  '/cd-images/479877982_951098887205307_6939966253945032418_n.jpg',
  '/cd-images/480135718_1674982303374633_7861099347657711157_n.jpg',
  '/cd-images/480176571_1319304065888003_4785808837297624048_n.jpg',
  '/cd-images/480179222_1167924018265420_1760160179654622926_n.jpg',
  '/cd-images/480446401_638644385413833_8750232804432311208_n.jpg',
  '/cd-images/481088106_1055093123112643_4860280362991176867_n.jpg',
  '/cd-images/481186281_535632552294263_199078023989057048_n.jpg',
  '/cd-images/481514302_1592036864822504_8062977933689002423_n.jpg',
  '/cd-images/481845756_628478046749384_1718794063148445810_n.jpg',
]

// Flashback slideshow component — crossfades through images
function FlashbackSlideshow() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setPrev(current)
        setCurrent(c => (c + 1) % CD_IMAGES.length)
        setFading(false)
      }, 1500) // crossfade duration
    }, 4000) // show each image for 4s
    return () => clearInterval(interval)
  }, [current])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Previous image (fades out) */}
      {prev !== null && (
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            backgroundImage: `url(${CD_IMAGES[prev]})`,
            opacity: fading ? 0 : 1,
            transition: 'opacity 1500ms ease-in-out',
          }}
        />
      )}
      {/* Current image (fades in) */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: `url(${CD_IMAGES[current]})`,
          opacity: fading ? 0 : 1,
          transition: 'opacity 1500ms ease-in-out',
          animation: 'kenBurns 8s ease-in-out infinite alternate',
        }}
      />
      {/* Heavy dark overlay so card stays readable */}
      <div className="absolute inset-0 bg-[#0a1628]/75" />
      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628]/90 via-transparent to-[#0a1628]/60" />
    </div>
  )
}

// Matrix-style binary code rain
function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const chars = '01CDTRACK01100110'
    const fontSize = 13
    let cols = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array(cols).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 22, 40, 0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const x = i * fontSize
        const alpha = Math.random() * 0.25 + 0.05
        ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`
        ctx.fillText(char, x, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }

      const newCols = Math.floor(canvas.width / fontSize)
      if (newCols !== cols) {
        cols = newCols
        drops.length = cols
        for (let i = 0; i < cols; i++) if (drops[i] === undefined) drops[i] = 1
      }
    }

    const interval = setInterval(draw, 60)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.35 }}
    />
  )
}

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

      {/* Layer 1: Flashback photo slideshow */}
      <FlashbackSlideshow />

      {/* Layer 2: Code rain on top */}
      <CodeRain />

      {/* Layer 3: Ambient glow */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#1B3A7A]/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#0F2C6F]/30 blur-[120px]" />
      </div>

      {/* Layer 4: Login card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6 animate-fade-in">

        {/* Logo + Heading */}
        <div className="flex flex-col items-center text-center mb-10 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(27,58,122,0.7)]">
            <img
              src="/logo.png"
              alt="CD TRACK"
              className="w-14 h-14 object-contain"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">CD TRACK</h1>
            <p className="text-xs text-white/50 tracking-[0.2em] uppercase font-medium">
              Academic Tracking System
            </p>
          </div>
        </div>

        {/* Form card — glassmorphism */}
        <div
          className="rounded-2xl p-8 shadow-[0_8px_48px_rgba(0,0,0,0.6)] border border-white/15"
          style={{ background: 'rgba(10, 22, 40, 0.72)', backdropFilter: 'blur(20px)' }}
        >
          <div className="mb-6 space-y-1">
            <h2 className="text-lg font-semibold text-white">Enter Access Code</h2>
            <p className="text-sm text-white/40">
              Enter your assigned access code to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                Access Code
              </label>
              <div className="relative">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter your code"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/15 text-white placeholder:text-white/20 font-mono tracking-widest uppercase text-sm focus:outline-none focus:ring-2 focus:ring-[#FACC15]/40 focus:border-[#FACC15]/30 transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#FACC15] text-[#0a1628] rounded-xl font-bold text-sm hover:bg-[#F59E0B] active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(250,204,21,0.35)]"
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
          <p className="text-xs text-white/25">&copy; 2026 All Rights Reserved</p>
          <p className="text-xs text-white/20">
            Developed by{' '}
            <span className="text-white/40 font-medium">Raian Lee D. Vallejo</span>
          </p>
        </div>
      </div>

      {/* Ken Burns keyframe */}
      <style>{`
        @keyframes kenBurns {
          0%   { transform: scale(1.0) translateX(0px) translateY(0px); }
          100% { transform: scale(1.08) translateX(-8px) translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
