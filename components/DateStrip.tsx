import React from 'react';
import { addDays, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export function DateStrip({ date, setDate }: any) {
  return (
    <div className="flex items-center gap-1 md:gap-2 w-full">
      <Button variant="outline" onClick={() => setDate(addDays(date, -1))} className="px-3 py-2">←</Button>
      <div className="flex items-center justify-center gap-4 md:gap-8 px-2 md:px-4 overflow-x-auto flex-1">
        {[-2, -1, 0, 1, 2].map(offset => {
          const targetDate = addDays(date, offset);
          const isSelected = targetDate.toDateString() === date.toDateString();
          
          return (
            <button
              key={offset}
              onClick={() => setDate(targetDate)}
              className="text-center p-3 md:p-4 rounded-lg transition-colors min-w-[80px] md:min-w-[100px] hover:bg-gray-100"
              style={{
                backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                color: isSelected ? '#ffffff' : '#000000',
                fontWeight: isSelected ? '600' : 'normal',
                boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <div 
                className="text-xs"
                style={{ color: isSelected ? '#dbeafe' : '#6b7280' }}
              >
                {format(targetDate, "EEE", { locale: vi })}
              </div>
              <div className="text-sm md:text-lg font-bold">
                {format(targetDate, "dd")}
              </div>
              <div 
                className="text-xs hidden md:block"
                style={{ color: isSelected ? '#dbeafe' : '#6b7280' }}
              >
                {format(targetDate, "LLL", { locale: vi })}
              </div>
            </button>
          );
        })}
      </div>
      <Button variant="outline" onClick={() => setDate(addDays(date, 1))} className="px-3 py-2">→</Button>
    </div>
  );
}