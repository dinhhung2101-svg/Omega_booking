import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Booking {
  id?: string
  booking_id: string
  customer_name: string
  customer_phone?: string
  booking_time: string
  start_time?: string
  end_time?: string
  status: 'HOLD' | 'SEATED' | 'WALKIN' | 'CLOSED' | 'CANCELLED'
  party_size: number
  staff?: string
  note?: string
  area: string
  table_id: string
  table_name?: string
  created_at?: string
  updated_at?: string
}

export interface Customer {
  id?: string
  name: string
  phone?: string
  visit_count: number
  last_visit?: string
  created_at?: string
  updated_at?: string
}

export interface LockedTable {
  id?: string
  table_id: string
  area: string
  locked_by?: string
  locked_at?: string
}
