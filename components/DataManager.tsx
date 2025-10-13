'use client'

import { useState } from 'react'
import { Button } from '../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card'
import { migrateMockDataToSupabase, clearAllData } from '../utils/migrateData'
import { createStorage } from '../lib/storage'

export function DataManager() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string>('')
  const [dataStats, setDataStats] = useState<{bookings: number, customers: number} | null>(null)

  const handleMigrate = async () => {
    setIsLoading(true)
    setResult('')
    
    try {
      const result = await migrateMockDataToSupabase()
      if (result.success) {
        setResult(`✅ Migration successful! Migrated ${result.bookings} bookings and ${result.customers} customers.`)
        await loadDataStats()
      } else {
        setResult(`❌ Migration failed: ${result.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all data? This cannot be undone!')) {
      return
    }
    
    setIsLoading(true)
    setResult('')
    
    try {
      const result = await clearAllData()
      if (result.success) {
        setResult('✅ All data cleared successfully!')
        await loadDataStats()
      } else {
        setResult(`❌ Clear failed: ${result.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDataStats = async () => {
    try {
      const storage = createStorage()
      const bookings = await storage.getBookings()
      const customers = await storage.getCustomers()
      
      setDataStats({
        bookings: bookings.length,
        customers: customers.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLoadStats = async () => {
    setIsLoading(true)
    await loadDataStats()
    setIsLoading(false)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🗄️ Data Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Data Stats */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Database Status:</h3>
          {dataStats ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Bookings:</span> {dataStats.bookings}
              </div>
              <div>
                <span className="font-medium">Customers:</span> {dataStats.customers}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">Click "Load Stats" to see current data</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleLoadStats}
            disabled={isLoading}
            variant="outline"
          >
            📊 Load Stats
          </Button>
          
          <Button 
            onClick={handleMigrate}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Migrating...' : '🚀 Migrate Mock Data'}
          </Button>
          
          <Button 
            onClick={handleClear}
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? 'Clearing...' : '🗑️ Clear All Data'}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="p-3 rounded-md bg-gray-100 text-sm">
            {result}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-2">
          <div>
            <strong>📝 Migrate Mock Data:</strong> Import sample bookings and customers into Supabase
          </div>
          <div>
            <strong>📊 Load Stats:</strong> Check current data count in database
          </div>
          <div>
            <strong>🗑️ Clear All Data:</strong> Remove all data from database (for testing)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
