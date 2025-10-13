'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { testDataFlow } from '../utils/testDataFlow'

export function TestSupabase() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  const handleTest = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      const success = await testDataFlow()
      setTestResult(success ? '✅ All tests passed!' : '❌ Some tests failed. Check console.')
    } catch (error: any) {
      console.error('Test error:', error)
      setTestResult(`❌ Error: ${error.message || error}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>🧪 Test Supabase Connection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleTest} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Testing...' : 'Run Tests'}
        </Button>
        
        {testResult && (
          <div className="p-3 rounded-md bg-gray-100 text-sm">
            {testResult}
          </div>
        )}
        
        <div className="text-xs text-gray-600">
          <p>This will test:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Save booking to database</li>
            <li>Retrieve bookings</li>
            <li>Update booking status</li>
            <li>Save customer data</li>
            <li>Lock/unlock table</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
