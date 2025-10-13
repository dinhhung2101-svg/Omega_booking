import { DataService } from './dataService'

export interface StorageInterface {
  // Bookings
  getBookings(): Promise<any[]>
  saveBooking(booking: any): Promise<any>
  updateBooking(id: string, updates: any): Promise<any>
  deleteBooking(id: string): Promise<void>
  
  // Customers
  getCustomers(): Promise<any[]>
  saveCustomer(customer: any): Promise<any>
  
  // Locked Tables
  getLockedTables(): Promise<any[]>
  lockTable(tableId: string, area: string, lockedBy: string): Promise<void>
  unlockTable(tableId: string, area: string): Promise<void>
}

export class SupabaseStorage implements StorageInterface {
  async getBookings() {
    return DataService.getBookings()
  }

  async saveBooking(booking: any) {
    return DataService.saveBooking(booking)
  }

  async updateBooking(id: string, updates: any) {
    return DataService.updateBooking(id, updates)
  }

  async deleteBooking(id: string) {
    return DataService.deleteBooking(id)
  }

  async getCustomers() {
    return DataService.getCustomers()
  }

  async saveCustomer(customer: any) {
    return DataService.saveCustomer(customer)
  }

  async getLockedTables() {
    return DataService.getLockedTables()
  }

  async lockTable(tableId: string, area: string, lockedBy: string) {
    return DataService.lockTable(tableId, area, lockedBy)
  }

  async unlockTable(tableId: string, area: string) {
    return DataService.unlockTable(tableId, area)
  }
}

// In-memory storage (fallback)
export class InMemoryStorage implements StorageInterface {
  private bookings: any[] = []
  private customers: any[] = []
  private lockedTables: any[] = []

  async getBookings() { return this.bookings }
  async saveBooking(booking: any) { 
    this.bookings.push(booking)
    return booking
  }
  async updateBooking(id: string, updates: any) {
    const index = this.bookings.findIndex(b => b.id === id)
    if (index >= 0) {
      this.bookings[index] = { ...this.bookings[index], ...updates }
      return this.bookings[index]
    }
    throw new Error('Booking not found')
  }
  async deleteBooking(id: string) {
    this.bookings = this.bookings.filter(b => b.id !== id)
  }
  async getCustomers() { return this.customers }
  async saveCustomer(customer: any) { 
    this.customers.push(customer)
    return customer
  }
  async getLockedTables() { return this.lockedTables }
  async lockTable(tableId: string, area: string, lockedBy: string) {
    this.lockedTables.push({ table_id: tableId, area, locked_by: lockedBy })
  }
  async unlockTable(tableId: string, area: string) {
    this.lockedTables = this.lockedTables.filter(lt => 
      !(lt.table_id === tableId && lt.area === area)
    )
  }
}

// Storage factory
export function createStorage(): StorageInterface {
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true'
  return useSupabase ? new SupabaseStorage() : new InMemoryStorage()
}
