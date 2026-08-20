import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// Shared access codes
const ADMIN_CODE = 'CDADMIN01'
const USER_CODE = 'CD01'

// Each code maps to a single shared Supabase account
const CODE_CREDENTIALS: Record<string, { email: string; password: string; role: UserRole; displayName: string }> = {
  [USER_CODE]:  { email: 'cd01@cdtrack.local',      password: 'cdtrack-cd01-shared',      role: 'user',  displayName: 'CD Member' },
  [ADMIN_CODE]: { email: 'cdadmin01@cdtrack.local',  password: 'cdtrack-cdadmin01-shared', role: 'admin', displayName: 'CD Admin'  },
}

export type UserRole = 'admin' | 'user'

export interface Profile {
  id?: string
  user_id: string
  display_name: string
  role: UserRole
  avatar_url?: string | null
  created_at?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: Profile | null
  role: UserRole | null
  isAdmin: boolean
  isLoading: boolean
  signInWithCode: (code: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getRoleForUser = (u: User | null): UserRole => {
    if (u?.email === 'cdadmin01@cdtrack.local') return 'admin'
    return 'user'
  }

  const fetchProfile = useCallback(async (userId: string, userObj?: User | null) => {
    // Use the passed-in userObj exclusively — never the outer 'user' state.
    // This keeps fetchProfile referentially stable (empty dep array),
    // which prevents onAuthStateChange from being re-registered on every login.
    const targetEmail = userObj?.email
    const expectedRole: UserRole = targetEmail === 'cdadmin01@cdtrack.local' ? 'admin' : 'user'
    const expectedName = expectedRole === 'admin' ? 'CD Admin' : 'CD Member'

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && data) {
        // If the role in DB doesn't match the required code role, auto-fix it
        if (data.role !== expectedRole) {
          await supabase.from('profiles').update({ role: expectedRole }).eq('user_id', userId)
          data.role = expectedRole
        }
        setProfile(data as Profile)
        return data
      } else {
        // Profile missing -> auto create/upsert so RLS and state work immediately
        const newProfile: Profile = {
          user_id: userId,
          display_name: expectedName,
          role: expectedRole,
        }
        await supabase.from('profiles').upsert(newProfile, { onConflict: 'user_id' })
        setProfile(newProfile)
        return newProfile
      }
    } catch {
      // Fallback in case of network or table issue
      const fallbackProfile: Profile = {
        user_id: userId,
        display_name: expectedName,
        role: expectedRole,
      }
      setProfile(fallbackProfile)
      return fallbackProfile
    }
  }, [])  // ✔ Stable reference: no outer state captured — onAuthStateChange registers once

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id, user)
  }, [user, fetchProfile])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser).finally(() => setIsLoading(false))
      } else {
        setIsLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Universal sign-in: just the access code
  const signInWithCode = async (code: string): Promise<{ error: string | null }> => {
    const creds = CODE_CREDENTIALS[code]
    if (!creds) return { error: 'Invalid access code. Please check and try again.' }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    })

    if (error) {
      return { error: `Sign-in error: ${error.message}. Please verify the account is created in Supabase.` }
    }

    if (data.user) {
      setUser(data.user)
      await fetchProfile(data.user.id, data.user)
    }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setUser(null)
  }

  const activeRole: UserRole = profile?.role || getRoleForUser(user)
  const isAdmin = activeRole === 'admin' || user?.email === 'cdadmin01@cdtrack.local'

  return (
    <AuthContext.Provider value={{
      user, session, profile,
      role: activeRole,
      isAdmin,
      isLoading,
      signInWithCode, signOut, refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
