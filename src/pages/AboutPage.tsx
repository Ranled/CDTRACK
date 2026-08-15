import React from 'react'
import { Mail, Globe, Github, Heart, Star, Users, Target, Eye } from 'lucide-react'

const officers = [
  { name: 'President', role: 'Organization President', initials: 'P' },
  { name: 'Vice President', role: 'Vice President for Internal Affairs', initials: 'V' },
  { name: 'Secretary', role: 'Executive Secretary', initials: 'S' },
  { name: 'Treasurer', role: 'Finance Officer', initials: 'T' },
  { name: 'Auditor', role: 'Internal Auditor', initials: 'A' },
  { name: 'PRO', role: 'Public Relations Officer', initials: 'PR' },
]

export default function AboutPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Hero section */}
      <div className="cd-card text-center space-y-4 py-8">
        <img src="/logo.png" alt="Code Dreamers" className="w-20 h-20 object-contain mx-auto" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Code Dreamers</h1>
          <p className="text-muted-foreground text-sm mt-1">Academic Excellence Through Technology</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Code Dreamers is a student organization dedicated to fostering excellence in technology, programming, and academic achievement. We empower students to dream bigger, code smarter, and grow together as a community.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cd-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Our Mission</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To provide a collaborative and inclusive environment where students can develop their technical skills, explore their passions in technology, and achieve academic excellence through structured support, mentorship, and meaningful projects.
          </p>
        </div>

        <div className="cd-card space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/20 rounded-lg">
              <Eye className="w-5 h-5 text-yellow-600" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Our Vision</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To be the leading student organization that produces world-class software developers, innovators, and technology leaders who will shape the future of the digital world through continuous learning and community service.
          </p>
        </div>
      </div>

      {/* Organization Officers */}
      <div className="cd-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Organization Officers</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {officers.map(officer => (
            <div key={officer.role} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">{officer.initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{officer.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight truncate">{officer.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="cd-card space-y-4">
        <h2 className="text-base font-semibold text-foreground">Contact Us</h2>
        <div className="space-y-3">
          {[
            { icon: <Mail className="w-4 h-4" />, label: 'Email', value: 'codedreamers@org.edu' },
            { icon: <Globe className="w-4 h-4" />, label: 'Website', value: 'www.codedreamers.org' },
            { icon: <Github className="w-4 h-4" />, label: 'GitHub', value: 'github.com/codedreamers' },
          ].map(contact => (
            <div key={contact.label} className="flex items-center gap-3">
              <div className="p-2 bg-secondary rounded-lg text-muted-foreground">
                {contact.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{contact.label}</p>
                <p className="text-sm text-foreground font-medium">{contact.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Credits + Version */}
      <div className="cd-card space-y-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <Star className="w-4 h-4 text-accent" />
          <h2 className="text-base font-semibold text-foreground">CD TRACK</h2>
          <Star className="w-4 h-4 text-accent" />
        </div>
        <p className="text-sm text-muted-foreground">
          Code Dreamers Academic Tracking System
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
          Version 1.0.0
        </div>
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          Built with <Heart className="w-3 h-3 text-red-500" /> by Code Dreamers Dev Team
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          Powered by React · TypeScript · TailwindCSS · Supabase
        </p>
        <p className="text-[10px] text-muted-foreground/40">
          © 2025 Code Dreamers. All rights reserved.
        </p>
      </div>
    </div>
  )
}
