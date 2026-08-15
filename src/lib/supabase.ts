import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccdpzvscbdefficypude.supabase.co'
const supabaseAnonKey = 'sb_publishable_tNX0JPp1aemCdcstkxpj1w_twR8guuK'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          display_name: string
          role: 'admin' | 'user'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          course: string | null
          date: string
          time: string | null
          end_time: string | null
          location: string | null
          priority: 'low' | 'medium' | 'high'
          status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      announcements: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string | null
          is_pinned: boolean
          is_important: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['announcements']['Insert']>
      }
      notes: {
        Row: {
          id: string
          user_id: string
          title: string
          content: string
          color: string
          pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['notes']['Insert']>
      }
      reminders: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          time: string
          repeat: 'none' | 'daily' | 'weekly' | 'monthly'
          priority: 'low' | 'medium' | 'high'
          completed: boolean
          notification_enabled: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['reminders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['reminders']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          read: boolean
          type: 'announcement' | 'deadline' | 'event' | 'assignment' | 'reminder' | 'general'
          ref_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
  }
}
