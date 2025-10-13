import { createStorage } from '../lib/storage'

// Mock data từ seedMockState function
const mockBookings = [
  {
    booking_id: 'BK-A-001',
    customer_name: 'Nguyễn Văn A',
    customer_phone: '0901234567',
    booking_time: new Date().toISOString(),
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2h
    status: 'SEATED' as const,
    party_size: 4,
    staff: 'Nhân viên 1',
    note: 'Khách VIP',
    area: 'A',
    table_id: 'A01',
    table_name: 'A01'
  },
  {
    booking_id: 'BK-B-002',
    customer_name: 'Trần Thị B',
    customer_phone: '0907654321',
    booking_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // -24h
    start_time: null,
    end_time: null,
    status: 'HOLD' as const,
    party_size: 2,
    staff: 'Nhân viên 2',
    note: '',
    area: 'B',
    table_id: 'B01',
    table_name: 'B01'
  },
  {
    booking_id: 'BK-C-003',
    customer_name: 'Lê Văn C',
    customer_phone: '0912345678',
    booking_time: new Date().toISOString(),
    start_time: new Date().toISOString(),
    end_time: null,
    status: 'WALKIN' as const,
    party_size: 6,
    staff: 'Quản lý',
    note: 'Khách vãng lai',
    area: 'C',
    table_id: 'C01',
    table_name: 'C01'
  }
]

const mockCustomers = [
  {
    name: 'Nguyễn Văn A',
    phone: '0901234567',
    visit_count: 3,
    last_visit: new Date().toISOString()
  },
  {
    name: 'Trần Thị B',
    phone: '0907654321',
    visit_count: 1,
    last_visit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // -7 days
  },
  {
    name: 'Lê Văn C',
    phone: '0912345678',
    visit_count: 5,
    last_visit: new Date().toISOString()
  }
]

export async function migrateMockDataToSupabase() {
  const storage = createStorage()
  
  console.log('🚀 Starting data migration...')
  
  try {
    // 1. Migrate bookings
    console.log('📝 Migrating bookings...')
    for (const booking of mockBookings) {
      await storage.saveBooking(booking)
      console.log(`✅ Migrated booking: ${booking.booking_id}`)
    }
    
    // 2. Migrate customers
    console.log('👥 Migrating customers...')
    for (const customer of mockCustomers) {
      await storage.saveCustomer(customer)
      console.log(`✅ Migrated customer: ${customer.name}`)
    }
    
    // 3. Verify migration
    console.log('🔍 Verifying migration...')
    const bookings = await storage.getBookings()
    const customers = await storage.getCustomers()
    
    console.log(`📊 Migration completed:`)
    console.log(`   - Bookings: ${bookings.length}`)
    console.log(`   - Customers: ${customers.length}`)
    
    return {
      success: true,
      bookings: bookings.length,
      customers: customers.length
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return {
      success: false,
      error: error
    }
  }
}

// Function để clear all data (for testing)
export async function clearAllData() {
  const storage = createStorage()
  
  console.log('🗑️ Clearing all data...')
  
  try {
    // Get all bookings and delete them
    const bookings = await storage.getBookings()
    for (const booking of bookings) {
      if (booking.id) {
        await storage.deleteBooking(booking.id)
      }
    }
    
    console.log('✅ All data cleared')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Clear data failed:', error)
    return { success: false, error }
  }
}
