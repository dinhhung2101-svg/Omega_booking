import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BottomNavigationProps {
  currentPage: string;
  onPageChange: (page: "tables" | "dashboard" | "crm" | "settings") => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentUser: any;
  onLogout: () => void;
}

export function BottomNavigation({ 
  currentPage, 
  onPageChange, 
  isSidebarOpen, 
  onToggleSidebar, 
  currentUser, 
  onLogout 
}: BottomNavigationProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tables', label: 'Quản lý booking', icon: '📋' },
    { id: 'crm', label: 'CRM', icon: '👥' },
    { id: 'settings', label: 'Cài đặt', icon: '⚙️' },
  ];

  return (
    <div className="bottom-nav">
      <div className="flex items-center justify-center py-3">
        <div className="flex items-center justify-center w-full max-w-sm">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              onClick={() => onPageChange(item.id as "tables" | "dashboard" | "crm" | "settings")}
              className={`flex flex-col items-center gap-1 h-16 px-2 mx-1 text-sm ${
                currentPage === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-medium text-center">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
