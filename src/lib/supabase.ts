import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Types
export type Company = {
  id: string
  name: string
  slug: string
  email?: string
  phone?: string
  industry?: string
  size?: string
  logo_url?: string
  settings?: any
  created_at: string
  updated_at: string
}

export type User = {
  id: string
  company_id: string
  email: string
  full_name: string
  role: 'employee' | 'admin' | 'hr_manager'
  department?: string
  position?: string
  phone?: string
  avatar_url?: string
  preferences?: any
  created_at: string
  updated_at: string
}

export type Conversation = {
  id: string
  user_id: string
  company_id: string
  channel: 'voice' | 'chat' | 'phone'
  status: 'active' | 'resolved' | 'escalated'
  category?: string
  started_at: string
  ended_at?: string
  duration_seconds?: number
  satisfaction_rating?: number
  created_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender: 'user' | 'aria' | 'system'
  content: string
  content_type: 'text' | 'voice' | 'document'
  metadata?: any
  created_at: string
}

export type Document = {
  id: string
  company_id: string
  title: string
  category: string
  file_url: string
  file_type?: string
  file_size?: number
  created_by?: string
  created_at: string
  updated_at: string
}

export type Notification = {
  id: string
  company_id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'urgent' | 'system'
  read: boolean
  created_at: string
}
