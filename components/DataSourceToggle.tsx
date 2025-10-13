'use client'

import { useState } from 'react'
import { Button } from '../src/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../src/components/ui/card'
import { Badge } from '../src/components/ui/badge'

interface DataSourceToggleProps {
  currentSource: 'memory' | 'supabase'
  onToggle: (source: 'memory' | 'supabase') => void
  memoryStats: { bookings: number, customers: number }
  supabaseStats: { bookings: number, customers: number }
}

export function DataSourceToggle({ 
  currentSource, 
  onToggle, 
  memoryStats, 
  supabaseStats 
}: DataSourceToggleProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔄 Data Source Toggle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Current Data Source:</h3>
          <div className="flex items-center gap-2">
            <Badge variant={currentSource === 'memory' ? 'default' : 'secondary'}>
              {currentSource === 'memory' ? '🧠 In-Memory' : '☁️ Supabase'}
            </Badge>
            <span className="text-sm text-gray-600">
              {currentSource === 'memory' 
                ? 'Data stored in browser memory (lost on refresh)' 
                : 'Data stored in Supabase database (persistent)'
              }
            </span>
          </div>
        </div>

        {/* Data Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-2">🧠 In-Memory Data</h4>
            <div className="text-xs space-y-1">
              <div>Bookings: {memoryStats.bookings}</div>
              <div>Customers: {memoryStats.customers}</div>
            </div>
            <Button 
              variant={currentSource === 'memory' ? 'default' : 'outline'}
              onClick={() => onToggle('memory')}
              className="w-full mt-2 text-sm"
            >
              Use In-Memory
            </Button>
          </div>
          
          <div className="p-3 border rounded-lg">
            <h4 className="font-medium text-sm mb-2">☁️ Supabase Data</h4>
            <div className="text-xs space-y-1">
              <div>Bookings: {supabaseStats.bookings}</div>
              <div>Customers: {supabaseStats.customers}</div>
            </div>
            <Button 
              variant={currentSource === 'supabase' ? 'default' : 'outline'}
              onClick={() => onToggle('supabase')}
              className="w-full mt-2 text-sm"
            >
              Use Supabase
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-1">
          <div><strong>In-Memory:</strong> Fast, temporary data for development</div>
          <div><strong>Supabase:</strong> Persistent data for production testing</div>
        </div>
      </CardContent>
    </Card>
  )
}
