import { useState, useEffect } from 'react'
import { createStorage } from '../lib/storage'

export function useSupabaseData() {
  const [bookings, setBookings] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [lockedTables, setLockedTables] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storage = createStorage()

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [bookingsData, customersData, lockedTablesData] = await Promise.all([
        storage.getBookings(),
        storage.getCustomers(),
        storage.getLockedTables()
      ])

      setBookings(bookingsData)
      setCustomers(customersData)
      setLockedTables(lockedTablesData)

    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const saveBooking = async (booking: any) => {
    try {
      const savedBooking = await storage.saveBooking(booking)
      setBookings(prev => [savedBooking, ...prev])
      return savedBooking
    } catch (err) {
      console.error('Error saving booking:', err)
      throw err
    }
  }

  const updateBooking = async (id: string, updates: any) => {
    try {
      const updatedBooking = await storage.updateBooking(id, updates)
      setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b))
      return updatedBooking
    } catch (err) {
      console.error('Error updating booking:', err)
      throw err
    }
  }

  const deleteBooking = async (id: string) => {
    try {
      await storage.deleteBooking(id)
      setBookings(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('Error deleting booking:', err)
      throw err
    }
  }

  const saveCustomer = async (customer: any) => {
    try {
      const savedCustomer = await storage.saveCustomer(customer)
      setCustomers(prev => {
        const existing = prev.find(c => c.phone === customer.phone)
        if (existing) {
          return prev.map(c => c.phone === customer.phone ? savedCustomer : c)
        }
        return [savedCustomer, ...prev]
      })
      return savedCustomer
    } catch (err) {
      console.error('Error saving customer:', err)
      throw err
    }
  }

  const lockTable = async (tableId: string, area: string, lockedBy: string) => {
    try {
      await storage.lockTable(tableId, area, lockedBy)
      setLockedTables(prev => [...prev, { table_id: tableId, area, locked_by: lockedBy }])
    } catch (err) {
      console.error('Error locking table:', err)
      throw err
    }
  }

  const unlockTable = async (tableId: string, area: string) => {
    try {
      await storage.unlockTable(tableId, area)
      setLockedTables(prev => prev.filter(lt => !(lt.table_id === tableId && lt.area === area)))
    } catch (err) {
      console.error('Error unlocking table:', err)
      throw err
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return {
    // Data
    bookings,
    customers,
    lockedTables,
    loading,
    error,
    
    // Actions
    loadData,
    saveBooking,
    updateBooking,
    deleteBooking,
    saveCustomer,
    lockTable,
    unlockTable,
    
    // Computed
    completedBookings: bookings.filter(b => b.status === 'CLOSED' || b.status === 'CANCELLED'),
    activeBookings: bookings.filter(b => b.status === 'HOLD' || b.status === 'SEATED' || b.status === 'WALKIN')
  }
}
