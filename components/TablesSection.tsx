import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableCard } from './TableCard';

export function TablesSection({ title, tables, bookingsByTable, onPickTable, isOccupied, isLocked }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [gridCols, setGridCols] = useState('repeat(2, 1fr)');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateGridCols = () => {
      const windowWidth = window.innerWidth;
      
      if (windowWidth >= 1024) {
        setGridCols('repeat(5, 1fr)'); // Desktop: 5 columns
      } else if (windowWidth >= 768) {
        setGridCols('repeat(3, 1fr)'); // Tablet: 3 columns
      } else {
        setGridCols('repeat(2, 1fr)'); // Mobile: 2 columns
      }
    };

    // Initial calculation
    updateGridCols();

    // Update on window resize
    window.addEventListener('resize', updateGridCols);
    
    return () => {
      window.removeEventListener('resize', updateGridCols);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{title}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-8 w-8"
            >
              <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`}>
                ▶
              </div>
            </Button>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: gridCols
              }}
            >
              {tables.map((t:any) => (
                <TableCard
                  key={t.id}
                  table={t}
                  data={bookingsByTable[t.id]}
                  onClick={onPickTable}
                  isOccupied={isOccupied(t.id)}
                  isLocked={isLocked(t.id)}
                />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
