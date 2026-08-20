import React from 'react'
import { Heart, Users, Crown } from 'lucide-react'

const officers = [
  { name: 'Raian Lee Vallejo',       role: 'Mayor',      initials: 'RV' },
  { name: 'Jhona Mae Tayco',         role: 'Vice Mayor', initials: 'JT' },
  { name: 'Janelle Sespeñe',         role: 'Secretary',  initials: 'JS' },
  { name: 'Frankie Jane Manggana',   role: 'Treasurer',  initials: 'FM' },
  { name: 'Christian Jay Tumampil',  role: 'Auditor',    initials: 'CT' },
  { name: 'John Louie Castillon',    role: 'Councilor',  initials: 'JC' },
  { name: 'Michelle Danielle Macasa',role: 'Councilor',  initials: 'MM' },
  { name: 'Kirt Dologuin',           role: 'Councilor',  initials: 'KD' },
  { name: 'Kimberly Italia',         role: 'Muse',       initials: 'KI' },
  { name: 'Jayvee Ascaño',           role: 'Escort',     initials: 'JA' },
]

export default function AboutPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Hero */}
      <div className="cd-card text-center space-y-4 py-8">
        <img src="/logo.png" alt="Code Dreamers" className="w-20 h-20 object-contain mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Code Dreamers</h1>
          <p className="text-muted-foreground text-sm mt-1">Academic Excellence Through Technology</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Code Dreamers is a student section led by Mayor and Former Governor <span className="text-foreground font-medium">Raian Lee D. Vallejo</span>, Former Mayor <span className="text-foreground font-medium">John Louie S. Castillon</span>, and Former Mayor <span className="text-foreground font-medium">Jhona Mae R. Tayco</span> — a section dedicated to fostering excellence in technology, programming, and academic achievement. We want to dream big, code smarter, and grow together as a community.
        </p>
      </div>

      {/* Classroom Officers */}
      <div className="cd-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">BSCS 4-B</h2>
            <p className="text-xs text-muted-foreground">New Elected Classroom Officers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {officers.map(officer => (
            <div
              key={officer.name}
              className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{officer.initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{officer.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{officer.role}</p>
              </div>
              {(officer.role === 'Mayor') && (
                <Crown className="w-3.5 h-3.5 text-yellow-500 ml-auto flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Developer Credits + Version */}
      <div className="cd-card space-y-3 text-center">
        <h2 className="text-base font-semibold text-foreground">CD TRACK</h2>
        <p className="text-sm text-muted-foreground">
          Code Dreamers Academic Tracking System
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          Version 1.08.20
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-500" /> by Dev. Raian Lee D. Vallejo
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Powered by React · TypeScript · TailwindCSS · Supabase
        </p>
      </div>

    </div>
  )
}
