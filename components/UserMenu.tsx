import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function UserMenu({ currentUser, onLogout }: any) {
  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Đăng nhập</Button>
      </div>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'staff': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị';
      case 'manager': return 'Quản lý';
      case 'staff': return 'Nhân viên';
      default: return 'Khách';
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="text-right hidden sm:block">
        <div className="text-xs md:text-sm font-medium">{currentUser.name || currentUser.username}</div>
        <Badge variant="secondary" className={`text-xs ${getRoleColor(currentUser.role)}`}>
          {getRoleLabel(currentUser.role)}
        </Badge>
      </div>
      <div className="block sm:hidden">
        <Badge variant="secondary" className={`text-xs ${getRoleColor(currentUser.role)}`}>
          {getRoleLabel(currentUser.role)}
        </Badge>
      </div>
      <Button variant="outline" size="sm" onClick={onLogout} className="mobile-btn text-xs md:text-sm">Đăng xuất</Button>
    </div>
  );
}
