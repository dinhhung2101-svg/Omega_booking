import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Calendar, Users, Settings } from 'lucide-react';

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
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'tables', label: 'Booking', icon: Calendar },
    { id: 'crm', label: 'CRM', icon: Users },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];


  return (
    <div 
      className="bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        height: '64px',
        width: '100%'
      }}
    >
      {menuItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = currentPage === item.id;
        
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id as "tables" | "dashboard" | "crm" | "settings")}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive 
                ? "text-blue-600 bg-blue-50" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
            style={{
              flex: 1,
              height: '100%',
              width: '100%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              minWidth: 0
            }}
          >
            <IconComponent className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className={`text-xs font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
