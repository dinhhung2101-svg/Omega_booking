import { createStorage } from '../lib/storage'

export async function testDataFlow() {
  const storage = createStorage()
  
  console.log('🧪 Testing Data Flow...')
  
  try {
    // Clean up previous test data
    console.log('🧹 Cleaning up previous test data...')
    try {
      const existingBookings = await storage.getBookings()
      for (const booking of existingBookings) {
        if (booking.booking_id && booking.booking_id.startsWith('TEST-')) {
          await storage.deleteBooking(booking.id)
        }
      }
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError)
    }
    // Test 1: Save booking
    const testBooking = {
      booking_id: `TEST-${Date.now()}`, // Unique ID based on timestamp
      customer_name: 'Test Customer',
      customer_phone: '0123456789',
      booking_time: new Date().toISOString(),
      status: 'HOLD' as const,
      party_size: 4,
      staff: 'Test Staff',
      area: 'area1',
      table_id: 'T1'
    }
    
    const savedBooking = await storage.saveBooking(testBooking)
    console.log('✅ Booking saved:', savedBooking)
    
    // Test 2: Get bookings
    const bookings = await storage.getBookings()
    console.log('✅ Bookings retrieved:', bookings.length)
    
    // Test 3: Update booking
    if (savedBooking.id) {
      await storage.updateBooking(savedBooking.id, { status: 'SEATED' })
      console.log('✅ Booking updated')
    }
    
    // Test 4: Save customer
    const testCustomer = {
      name: 'Test Customer',
      phone: '0123456789',
      visit_count: 1,
      last_visit: new Date().toISOString()
    }
    
    await storage.saveCustomer(testCustomer)
    console.log('✅ Customer saved')
    
    // Test 5: Lock table
    await storage.lockTable('T1', 'area1', 'Test Staff')
    console.log('✅ Table locked')
    
    // Test 6: Get locked tables
    const lockedTables = await storage.getLockedTables()
    console.log('✅ Locked tables retrieved:', lockedTables.length)
    
    // Test 7: Unlock table
    await storage.unlockTable('T1', 'area1')
    console.log('✅ Table unlocked')
    
    console.log('🎉 All tests passed!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return false
  }
}
