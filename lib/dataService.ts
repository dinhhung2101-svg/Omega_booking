import { supabase, Booking, Customer, LockedTable } from './supabase'

export class DataService {
  // Bookings
  static async getBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching bookings:', error)
      console.error('Error details:', error.message, error.details, error.hint)
      throw error
    }
    return data || []
  }

  static async saveBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()
    
    if (error) {
      console.error('Error saving booking:', error)
      throw error
    }
    return data
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating booking:', error)
      throw error
    }
    return data
  }

  static async deleteBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting booking:', error)
      throw error
    }
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('last_visit', { ascending: false })
    
    if (error) {
      console.error('Error fetching customers:', error)
      throw error
    }
    return data || []
  }

  static async saveCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .upsert(customer, { onConflict: 'phone' })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving customer:', error)
      throw error
    }
    return data
  }

  // Locked Tables
  static async getLockedTables(): Promise<LockedTable[]> {
    const { data, error } = await supabase
      .from('locked_tables')
      .select('*')
    
    if (error) {
      console.error('Error fetching locked tables:', error)
      throw error
    }
    return data || []
  }

  static async lockTable(tableId: string, area: string, lockedBy: string): Promise<void> {
    const { error } = await supabase
      .from('locked_tables')
      .insert({ table_id: tableId, area, locked_by: lockedBy })
    
    if (error) {
      console.error('Error locking table:', error)
      throw error
    }
  }

  static async unlockTable(tableId: string, area: string): Promise<void> {
    const { error } = await supabase
      .from('locked_tables')
      .delete()
      .eq('table_id', tableId)
      .eq('area', area)
    
    if (error) {
      console.error('Error unlocking table:', error)
      throw error
    }
  }
}
