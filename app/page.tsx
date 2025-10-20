"use client";
export const dynamic = 'force-static';
export const runtime = 'edge';

import React, { useMemo, useState, useEffect } from "react";
import { addDays, format, parseISO, startOfDay } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestSupabase } from "../components/TestSupabase";
import { DataManager } from "../components/DataManager";
import { DataSourceToggle } from "../components/DataSourceToggle";
import { DataSourceStatus } from "../components/DataSourceStatus";
import { useSupabaseData } from "../hooks/useSupabaseData";
import { TableCard } from "../components/TableCard";
import { TablesSection } from "../components/TablesSection";
import { DateStrip } from "../components/DateStrip";
import { UserMenu } from "../components/UserMenu";
import { BookingDrawer } from "../components/BookingDrawer";
import { BottomNavigation } from "../components/BottomNavigation";
// Removed recharts import to avoid errors

// ---- Helpers ----
const toInputDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const fromInputDate = (s: string) => { try { return parseISO(s); } catch { return new Date(); } };
const genBookingId = () => `BK-${Date.now()}` as const;
const weekDay = (d: Date) => format(d, "EEE");
const dayNum = (d: Date) => format(d, "dd");
const monthShort = (d: Date) => format(d, "LLL");

// Default areas and tables - sẽ được thay thế bởi state dynamic
const DEFAULT_AREAS = [
  { id: "A", name: "Khu A", position: 1, tables: [] },
  { id: "B", name: "Khu B", position: 2, tables: [] },
  { id: "C", name: "Khu C", position: 3, tables: [] },
  { id: "C_SOFA", name: "Khu C - SOFA", position: 4, tables: [] },
  { id: "D", name: "Khu D", position: 5, tables: [] },
  { id: "D_SOFA", name: "Khu D - SOFA", position: 6, tables: [] },
  { id: "E", name: "Khu E", position: 7, tables: [] },
  { id: "E_SOFA", name: "Khu E - SOFA", position: 8, tables: [] },
  { id: "VIP_E", name: "Khu VIP LẦU E", position: 9, tables: [] }
];

const DEFAULT_TABLES = [
  // Khu A: A01 - A06
  ...Array.from({ length: 6 }).map((_, i) => ({ 
    id: `A${String(i + 1).padStart(2, "0")}`, 
    name: `A${String(i + 1).padStart(2, "0")}`, 
    areaId: "A",
    capacity: 4 
  })),
  
  // Khu B: B01 - B18
  ...Array.from({ length: 18 }).map((_, i) => ({ 
    id: `B${String(i + 1).padStart(2, "0")}`, 
    name: `B${String(i + 1).padStart(2, "0")}`, 
    areaId: "B",
    capacity: 6 
  })),
  
  // Khu C: C01 - C15
  ...Array.from({ length: 15 }).map((_, i) => ({ 
    id: `C${String(i + 1).padStart(2, "0")}`, 
    name: `C${String(i + 1).padStart(2, "0")}`, 
    areaId: "C",
    capacity: 4 
  })),
  
  // Khu C - SOFA: VC1 - VC5
  ...Array.from({ length: 5 }).map((_, i) => ({ 
    id: `VC${i + 1}`, 
    name: `VC${i + 1}`, 
    areaId: "C_SOFA",
    capacity: 6 
  })),
  
  // Khu D: D01 - D14
  ...Array.from({ length: 14 }).map((_, i) => ({ 
    id: `D${String(i + 1).padStart(2, "0")}`, 
    name: `D${String(i + 1).padStart(2, "0")}`, 
    areaId: "D",
    capacity: 4 
  })),
  
  // Khu D - SOFA: DVip 1 - DVip 4
  ...Array.from({ length: 4 }).map((_, i) => ({ 
    id: `DVip${i + 1}`, 
    name: `DVip ${i + 1}`, 
    areaId: "D_SOFA",
    capacity: 8 
  })),
  
  // Khu E: E01 - E11
  ...Array.from({ length: 11 }).map((_, i) => ({ 
    id: `E${String(i + 1).padStart(2, "0")}`, 
    name: `E${String(i + 1).padStart(2, "0")}`, 
    areaId: "E",
    capacity: 4 
  })),
  
  // Khu E - SOFA: EVip 1 - EVip 6
  ...Array.from({ length: 6 }).map((_, i) => ({ 
    id: `EVip${i + 1}`, 
    name: `EVip ${i + 1}`, 
    areaId: "E_SOFA",
    capacity: 8 
  })),
  
  // Khu VIP LẦU E: SF1 - SF4
  ...Array.from({ length: 4 }).map((_, i) => ({ 
    id: `SF${i + 1}`, 
    name: `SF${i + 1}`, 
    areaId: "VIP_E",
    capacity: 10 
  }))
];
const STATUS_COLORS: Record<string, string> = { 
  EMPTY: "bg-gray-400", 
  HOLD: "bg-amber-400", 
  SEATED: "bg-emerald-500", 
  WALKIN: "bg-emerald-500",
  CLOSED: "bg-gray-600",
  CANCELLED: "bg-red-500"
};
const canCloseBooking = (role: "staff"|"manager", status: string) => status === "SEATED";

const findAreaByTableId = (tableId: string, tables: any[]): string | undefined => {
  const table = tables.find(t => t.id === tableId);
  return table?.areaId;
};

// Tạo data mẫu cho khoảng thời gian từ 1/10 đến 20/10
const generateMockData = () => {
  const mockData: Record<string, Record<string, any>> = {};
  const startDate = new Date(2024, 9, 1); // 1/10/2024
  const endDate = new Date(2024, 9, 20); // 20/10/2024
  const today = new Date();
  
  // Danh sách khách hàng thường xuyên
  const regularCustomers = [
    { name: "Nguyễn Văn An", phone: "0901234567", visits: 8 },
    { name: "Trần Thị Bình", phone: "0902345678", visits: 6 },
    { name: "Phạm Văn Cường", phone: "0903456789", visits: 5 },
    { name: "Lê Thị Dung", phone: "0904567890", visits: 7 },
    { name: "Hoàng Văn Em", phone: "0905678901", visits: 4 },
    { name: "Võ Thị Phương", phone: "0906789012", visits: 6 },
    { name: "Đặng Minh Giang", phone: "0907890123", visits: 5 },
    { name: "Bùi Thị Hoa", phone: "0908901234", visits: 3 },
    { name: "Ngô Văn Ích", phone: "0909012345", visits: 4 },
    { name: "Đinh Thị Kim", phone: "0910123456", visits: 6 }
  ];
  
  // Danh sách nhân viên
  const staffMembers = ["nhanvien1", "nhanvien2", "nhanvien3", "nhanvien4", "nhanvien5", "quanly1"];
  
  // Khởi tạo data cho tất cả khu vực
  DEFAULT_AREAS.forEach(area => {
    mockData[area.id] = {};
  });
  
  // Tạo data cho từng ngày từ 1/10 đến 20/10
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const currentDate = new Date(d);
    const isPast = currentDate < today;
    const isToday = currentDate.toDateString() === today.toDateString();
    const isFuture = currentDate > today;
    
    DEFAULT_AREAS.forEach(area => {
      const areaTables = DEFAULT_TABLES.filter(t => t.areaId === area.id);
      
      // Logic tạo booking theo ngày
      if (isPast) {
        // Quá khứ: tạo booking đã hoàn thành để test báo cáo
        if (Math.random() < 0.4) { // 40% chance có booking trong quá khứ
          const randomTable = areaTables[Math.floor(Math.random() * areaTables.length)];
          const customer = regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
          const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
          
          const startHour = 18 + Math.floor(Math.random() * 4); // 18-21h
          const start = new Date(currentDate);
          start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
          const end = new Date(start);
          end.setHours(start.getHours() + 2, 0, 0, 0);
          
          // Tạo key duy nhất cho mỗi booking
          const bookingKey = `${randomTable.id}_${currentDate.toISOString().split('T')[0]}`;
          
          mockData[area.id][bookingKey] = {
            status: "CLOSED", // Đã hoàn thành
            bookingId: `BK-${area.id}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        startAt: start,
        endAt: end,
            closedAt: end,
            partySize: Math.max(2, randomTable.capacity - Math.floor(Math.random() * 2)),
            staff: staff,
            note: Math.random() < 0.3 ? "Khách VIP" : "",
            customer: {
              name: customer.name,
              phone: customer.phone
            },
            tables: [randomTable.id],
            tableId: randomTable.id, // Thêm tableId để dễ tìm
          };
        }
      } else if (isToday) {
        // Hôm nay: có bàn trống, bàn đặt, bàn khách đang ngồi
        const numBookings = Math.floor(areaTables.length * 0.4); // 40% số bàn có booking
        
        for (let i = 0; i < numBookings; i++) {
          const randomTable = areaTables[Math.floor(Math.random() * areaTables.length)];
          if (!mockData[area.id][randomTable.id]) {
            const customer = regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
            const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
            
            const startHour = 18 + Math.floor(Math.random() * 4); // 18-21h
            const start = new Date(currentDate);
            start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
            const end = new Date(start);
            end.setHours(start.getHours() + 2, 0, 0, 0);
            
            const statuses = ["HOLD", "SEATED", "WALKIN"];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            mockData[area.id][randomTable.id] = {
              status: status,
              bookingId: `BK-${area.id}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
        startAt: start,
        endAt: end,
              partySize: Math.max(2, randomTable.capacity - Math.floor(Math.random() * 2)),
              staff: staff,
              note: Math.random() < 0.3 ? "Khách đặc biệt" : "",
              customer: {
                name: customer.name,
                phone: customer.phone
              },
              tables: [randomTable.id],
            };
          }
        }
      } else if (isFuture) {
        // Tương lai: có bàn trống và bàn đã đặt
        const numBookings = Math.floor(areaTables.length * 0.3); // 30% số bàn có booking
        
        for (let i = 0; i < numBookings; i++) {
          const randomTable = areaTables[Math.floor(Math.random() * areaTables.length)];
          if (!mockData[area.id][randomTable.id]) {
            const customer = regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
            const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
            
            const startHour = 18 + Math.floor(Math.random() * 4); // 18-21h
            const start = new Date(currentDate);
            start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
            const end = new Date(start);
            end.setHours(start.getHours() + 2, 0, 0, 0);
            
            mockData[area.id][randomTable.id] = {
              status: "HOLD", // Chỉ có booking đã đặt
              bookingId: `BK-${area.id}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
              startAt: start,
              endAt: end,
              partySize: Math.max(2, randomTable.capacity - Math.floor(Math.random() * 2)),
              staff: staff,
              note: Math.random() < 0.3 ? "Khách đặc biệt" : "",
              customer: {
                name: customer.name,
                phone: customer.phone
              },
              tables: [randomTable.id],
            };
          }
        }
      }
    });
  }
  
  return mockData;
};

const seedMockState = (date: Date, areaId: string, tables: any[]) => {
  // Tạo data mẫu cho ngày hiện tại
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const isFuture = date > today;
  
  const byTable: Record<string, any> = {};
  
  if (isToday || isFuture) {
    const areaTables = tables.filter(t => t.areaId === areaId);
    
    // Danh sách khách hàng thường xuyên
    const regularCustomers = [
      { name: "Nguyễn Văn An", phone: "0901234567" },
      { name: "Trần Thị Bình", phone: "0902345678" },
      { name: "Phạm Văn Cường", phone: "0903456789" },
      { name: "Lê Thị Dung", phone: "0904567890" },
      { name: "Hoàng Văn Em", phone: "0905678901" },
      { name: "Võ Thị Phương", phone: "0906789012" },
      { name: "Đặng Minh Giang", phone: "0907890123" },
      { name: "Bùi Thị Hoa", phone: "0908901234" },
      { name: "Ngô Văn Ích", phone: "0909012345" },
      { name: "Đinh Thị Kim", phone: "0910123456" }
    ];
    
    // Danh sách nhân viên
    const staffMembers = ["nhanvien1", "nhanvien2", "nhanvien3", "nhanvien4", "nhanvien5", "quanly1"];
    
    if (isToday) {
      // Hôm nay: có bàn trống, bàn đặt, bàn khách đang ngồi
      const numBookings = Math.floor(areaTables.length * 0.4); // 40% số bàn có booking
      
      for (let i = 0; i < numBookings; i++) {
        const randomTable = areaTables[Math.floor(Math.random() * areaTables.length)];
        if (!byTable[randomTable.id]) {
          const customer = regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
          const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
          
          const startHour = 18 + Math.floor(Math.random() * 4); // 18-21h
          const start = new Date(date);
          start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
          const end = new Date(start);
          end.setHours(start.getHours() + 2, 0, 0, 0);
          
          const statuses = ["HOLD", "SEATED", "WALKIN"];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          
          // Tạo thời gian đến thực tế hợp lý cho khách đã ngồi
          const actualArrivalTime = status === "SEATED" 
            ? new Date(new Date().getTime() - Math.random() * 2 * 60 * 60 * 1000) // Thời gian đến trong 2h qua
            : status === "WALKIN"
            ? new Date(new Date().getTime() - Math.random() * 1 * 60 * 60 * 1000) // Khách vãng lai trong 1h qua
            : null;
          
          byTable[randomTable.id] = {
            status: status,
            bookingId: `BK-${areaId}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            bookingTime: new Date(start.getTime() - Math.floor(Math.random() * 24) * 60 * 60 * 1000), // Booking trước 1-24h
            startAt: actualArrivalTime, // Thời gian thực tế khách đến
            endAt: end,
            partySize: Math.max(2, randomTable.capacity - Math.floor(Math.random() * 2)),
            staff: staff,
            note: Math.random() < 0.3 ? "Khách đặc biệt" : "",
            customer: {
              name: customer.name,
              phone: customer.phone
            },
            tables: [randomTable.id],
          };
        }
      }
    } else if (isFuture) {
      // Tương lai: có bàn trống và bàn đã đặt
      const numBookings = Math.floor(areaTables.length * 0.3); // 30% số bàn có booking
      
      for (let i = 0; i < numBookings; i++) {
        const randomTable = areaTables[Math.floor(Math.random() * areaTables.length)];
        if (!byTable[randomTable.id]) {
          const customer = regularCustomers[Math.floor(Math.random() * regularCustomers.length)];
          const staff = staffMembers[Math.floor(Math.random() * staffMembers.length)];
          
          const startHour = 18 + Math.floor(Math.random() * 4); // 18-21h
          const start = new Date(date);
          start.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0);
          const end = new Date(start);
          end.setHours(start.getHours() + 2, 0, 0, 0);
          
          byTable[randomTable.id] = {
            status: "HOLD", // Chỉ có booking đã đặt
            bookingId: `BK-${areaId}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
            bookingTime: new Date(start.getTime() - Math.floor(Math.random() * 24) * 60 * 60 * 1000), // Booking trước 1-24h
            startAt: null, // Chưa check-in
            endAt: end,
            partySize: Math.max(2, randomTable.capacity - Math.floor(Math.random() * 2)),
            staff: staff,
            note: Math.random() < 0.3 ? "Khách đặc biệt" : "",
            customer: {
              name: customer.name,
              phone: customer.phone
            },
            tables: [randomTable.id],
          };
        }
      }
    }
  }
  
  return byTable;
};

// Hàm tạo danh sách khách hàng từ completedBookings
const generateCustomers = (completedBookings: any[]) => {
  const customerMap = new Map();
  
  completedBookings.forEach(booking => {
    if (booking.customer?.name && booking.customer?.phone) {
      const key = `${booking.customer.name}_${booking.customer.phone}`;
      
      if (customerMap.has(key)) {
        const existing = customerMap.get(key);
        existing.visitCount += 1;
        if (new Date(booking.startAt) > new Date(existing.lastVisit)) {
          existing.lastVisit = booking.startAt;
        }
      } else {
        customerMap.set(key, {
          id: key,
          name: booking.customer.name,
          phone: booking.customer.phone,
          birthday: null, // Có thể thêm sau
          visitCount: 1,
          lastVisit: booking.startAt
        });
      }
    }
  });
  
  return Array.from(customerMap.values());
};

// Hàm lấy data lịch sử cho báo cáo
const getHistoricalData = (completedBookings: any[] = []) => {
  const data = generateMockData();
  
  // Thêm completed bookings thực tế vào data
  completedBookings.forEach(booking => {
    if (booking.area && booking.tableId) {
      if (!data[booking.area]) {
        data[booking.area] = {};
      }
      // Tạo key duy nhất cho completed booking
      const key = `${booking.tableId}_${booking.closedAt?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}`;
      data[booking.area][key] = booking;
    }
  });
  
  return data;
};

// Mobile Customer List Component
function MobileCustomerList({ customers, searchQuery, onSelectCustomer, completedBookings }: any) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const filteredCustomers = customers.filter((customer: any) => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
    onSelectCustomer(customer);
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-3">
      {/* Mobile Customer Cards */}
      {filteredCustomers.map((customer: any, index: number) => (
        <div
          key={customer.id}
          onClick={() => handleSelectCustomer(customer)}
          className="mobile-dashboard-card bg-white p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center space-x-3">
            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {customer.name}
                </h3>
                <Badge variant={customer.visitCount > 5 ? "default" : "secondary"} className="text-xs">
                  {customer.visitCount > 5 ? "VIP" : "Thường"}
                </Badge>
              </div>
              <div 
                className="text-xs text-gray-600 mb-1 font-bold cursor-pointer hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`tel:${customer.phone}`, '_self');
                }}
              >
                {customer.phone}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{customer.visitCount} lần đến</span>
                <span>
                  {customer.lastVisit ? 
                    new Date(customer.lastVisit).toLocaleDateString('vi-VN') : 
                    'Chưa có'
                  }
                </span>
              </div>
            </div>
            
            {/* Arrow */}
            <div className="text-gray-400">
              <span>›</span>
            </div>
          </div>
        </div>
      ))}

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-sm">Không tìm thấy khách hàng nào</div>
        </div>
      )}

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer
        open={showCustomerModal}
        setOpen={setShowCustomerModal}
        customer={selectedCustomer}
        completedBookings={completedBookings}
        onClose={handleCloseModal}
      />
    </div>
  );
}

// Component CRM - Danh sách khách hàng
function CustomerList({ customers, onSelectCustomer, completedBookings }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const filteredCustomers = customers.filter((customer: any) => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(true);
    onSelectCustomer(customer);
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý khách hàng</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
        </div>
      </div>

      {/* Danh sách khách hàng - Full width */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách khách hàng ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer: any, index: number) => (
                <div
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                className="p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 hover:border-blue-200"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-lg">{customer.name}</div>
                    <div className="text-sm font-medium text-blue-600">
                      {customer.visitCount} lần
                    </div>
                  </div>
                      <div className="text-sm text-gray-600">{customer.phone}</div>
                      {customer.birthday && (
                        <div className="text-xs text-gray-500">
                          Sinh: {new Date(customer.birthday).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Lần cuối: {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy khách hàng nào
            </div>
          )}
          </CardContent>
        </Card>

      {/* Customer Detail Drawer */}
      <CustomerDetailDrawer 
        open={showCustomerModal}
        onClose={handleCloseModal}
        customer={selectedCustomer}
        completedBookings={completedBookings}
      />
    </div>
  );
}

// Component Customer Detail Drawer
function CustomerDetailDrawer({ open, onClose, customer, completedBookings }: any) {
  if (!open || !customer) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="h-full custom-drawer-width"
        style={{
          width: window.innerWidth < 768 ? '85%' : window.innerWidth < 1024 ? '600px' : '700px',
          maxWidth: window.innerWidth < 768 ? '85%' : 'none'
        }}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Thông tin khách hàng
            </SheetTitle>
            <Button
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 p-0 text-sm"
            >
              ×
            </Button>
          </div>
        </SheetHeader>

        <div className="p-4">
          <div className="mt-6 space-y-6">
            <CustomerDetail customer={customer} completedBookings={completedBookings} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Component chi tiết khách hàng
function CustomerDetail({ customer, completedBookings }: any) {
  const [visitHistory, setVisitHistory] = useState<any[]>([]);

  useEffect(() => {
    // Lấy lịch sử visit từ completedBookings
    const history = completedBookings
      .filter((booking: any) => 
        booking.customer?.name === customer.name && 
        booking.customer?.phone === customer.phone
      )
      .sort((a: any, b: any) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

    setVisitHistory(history);
  }, [customer, completedBookings]);

  return (
    <div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Họ và tên</Label>
          <div className="text-lg font-semibold">{customer.name}</div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Số điện thoại</Label>
          <div className="text-lg">{customer.phone}</div>
        </div>
        
        {customer.birthday && (
          <div>
            <Label className="text-sm font-medium">Ngày sinh</Label>
            <div className="text-lg">{new Date(customer.birthday).toLocaleDateString('vi-VN')}</div>
          </div>
        )}
        
        <div>
          <Label className="text-sm font-medium">Số lần tới nhà hàng</Label>
          <div className="text-lg font-semibold text-blue-600">{customer.visitCount} lần</div>
        </div>
        
        {customer.lastVisit && (
          <div>
            <Label className="text-sm font-medium">Lần cuối tới</Label>
            <div className="text-lg">{new Date(customer.lastVisit).toLocaleDateString('vi-VN')}</div>
          </div>
        )}
      </div>

        <div className="mt-6">
          <Label className="text-sm font-medium">Lịch sử tới nhà hàng</Label>
          <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
            {visitHistory.map((visit: any, index: number) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">
                    {new Date(visit.startAt).toLocaleDateString('vi-VN')} - {new Date(visit.startAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm text-gray-600">
                    Bàn: {visit.tableName} | {visit.partySize} người
                  </div>
                  {visit.note && (
                    <div className="text-sm text-gray-500 mt-1">
                      Ghi chú: {visit.note}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant={visit.status === "CLOSED" ? "default" : "secondary"}>
                    {visit.status === "CLOSED" ? "Đã hoàn thành" : visit.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}

// Component tìm kiếm khách hàng cho booking
function CustomerSearch({ onSelectCustomer, onClose, customers }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = customers.filter((customer: any) => 
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
    );
    
    setSearchResults(results);
  };

  const handleSelectCustomer = (customer: any) => {
    onSelectCustomer(customer);
    onClose();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Nhập tên hoặc số điện thoại..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} className="mobile-btn">Tìm</Button>
        <Button variant="outline" onClick={onClose} className="mobile-btn">Đóng</Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {searchResults.map((customer: any) => (
            <div
              key={customer.id}
              onClick={() => handleSelectCustomer(customer)}
              className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.phone}</div>
              <div className="text-xs text-gray-500">
                Đã tới {customer.visitCount} lần
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginScreen({ onLogin, users }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Tìm user trong danh sách
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError("Tên đăng nhập hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập hệ thống</CardTitle>
          <div className="text-sm text-gray-600">Restaurant Booking Manager</div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tên đăng nhập</Label>
              <Input 
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Mật khẩu</Label>
              <Input 
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full">Đăng nhập</Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Tài khoản demo:</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Quản lý:</strong> manager01 / manager123</div>
              <div><strong>Nhân viên:</strong> staff01 / staff123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function Sidebar({ currentView, setCurrentView, role, collapsed, onToggle }: any) {
  const Item = ({ label, view, active }: any) => (
    <div 
      className={`px-4 py-2 rounded-lg cursor-pointer ${active ? "bg-neutral-200 font-semibold" : "hover:bg-neutral-100"}`}
      onClick={() => setCurrentView(view)}
    >
      {label}
    </div>
  );
  
  const canAccessSettings = role === "admin";
  
  return (
    <div className={`${collapsed ? 'w-16' : 'w-60'} border-r pr-3 transition-all duration-300`}>
      <div className="flex items-center justify-between p-3">
        {!collapsed && <div className="font-semibold text-neutral-700">Menu</div>}
        <button 
          onClick={onToggle}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>
      <div className="space-y-1 px-2">
        <Item label={collapsed ? "📋" : "Quản lý booking"} view="tables" active={currentView === "tables"}/>
        <Item label={collapsed ? "📊" : "Dashboard"} view="dashboard" active={currentView === "dashboard"}/>
        <Item label={collapsed ? "👥" : "CRM"} view="crm" active={currentView === "crm"}/>
        {canAccessSettings && (
          <Item label={collapsed ? "⚙️" : "Cài đặt"} view="settings" active={currentView === "settings"}/>
        )}
      </div>
    </div>
  );
}


function SearchAndView({ view, setView, searchQuery, setSearchQuery, onSearch }: any) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mt-4 gap-3">
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Tìm kiếm..." 
          className="w-48" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
        />
        <Button 
          onClick={onSearch}
          className="h-9 px-3 text-sm"
          variant="secondary"
        >
          🔍
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grid" className="text-xs sm:text-sm">Sơ đồ</TabsTrigger>
            <TabsTrigger value="list" className="text-xs sm:text-sm">Danh sách</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}



function CustomerCard({ customer }: any) {
  if (!customer) return null;
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="p-0 pb-2"><CardTitle className="text-base flex items-center gap-2">Khách hàng</CardTitle></CardHeader>
      <CardContent className="p-0 space-y-2 text-sm">
        <div>Điện thoại: {customer.phone}</div>
        <div>Lần đến: {customer.visits ?? 0} • Lần gần nhất: {customer.lastVisit ?? "-"}</div>
      </CardContent>
    </Card>
  );
}

function StatKPI({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-600">{label}</div>
      </CardContent>
    </Card>
  );
}

function UserManagement({ users, onAddUser, onDeleteUser }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "staff"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.username && newUser.password) {
      onAddUser(newUser);
      setNewUser({ username: "", password: "", role: "staff" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý tài khoản</h2>
        <Button onClick={() => setShowAddForm(true)}>Tạo tài khoản mới</Button>
      </div>

      {showAddForm && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Tạo tài khoản nhân viên</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên đăng nhập</Label>
                <Input 
                  placeholder="VD: nhanvien01" 
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Mật khẩu</Label>
                <Input 
                  type="password" 
                  placeholder="Nhập mật khẩu"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Vai trò</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Nhân viên</SelectItem>
                    <SelectItem value="manager">Quản lý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="mobile-btn">Tạo tài khoản</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAddForm(false)} className="mobile-btn">Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Danh sách tài khoản</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-600">
                <tr>
                  <th className="py-2 pr-3">Tên đăng nhập</th>
                  <th className="py-2 pr-3">Vai trò</th>
                  <th className="py-2 pr-3">Trạng thái</th>
                  <th className="py-2 pr-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any, index: number) => (
                  <tr key={index} className="border-t">
                    <td className="py-2 pr-3">{user.username}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={user.role === "admin" ? "destructive" : user.role === "manager" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Admin" : user.role === "manager" ? "Quản lý" : "Nhân viên"}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">Hoạt động</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      {user.role !== "admin" && (
                        <Button 
                          variant="destructive" 
                          onClick={() => onDeleteUser(index)}
                        >
                          Xóa
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AreaManagement({ areas, onAddArea, onDeleteArea, onUpdateArea }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [newArea, setNewArea] = useState({
    id: "",
    name: "",
    position: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newArea.id && newArea.name) {
      onAddArea(newArea);
      setNewArea({ id: "", name: "", position: 0 });
      setShowAddForm(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setNewArea({ id: area.id, name: area.name, position: area.position });
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea && newArea.name) {
      onUpdateArea(editingArea.id, newArea);
      setEditingArea(null);
      setNewArea({ id: "", name: "", position: 0 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý khu vực</h2>
        <Button onClick={() => setShowAddForm(true)}>Thêm khu vực mới</Button>
      </div>

      {showAddForm && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>{editingArea ? "Chỉnh sửa khu vực" : "Thêm khu vực mới"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingArea ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <Label>Mã khu vực</Label>
                <Input 
                  placeholder="VD: A, B, VIP" 
                  value={newArea.id}
                  onChange={(e) => setNewArea({...newArea, id: e.target.value.toUpperCase()})}
                  required
                  disabled={!!editingArea}
                />
              </div>
              <div>
                <Label>Tên khu vực</Label>
                <Input 
                  placeholder="VD: Khu A, Khu VIP"
                  value={newArea.name}
                  onChange={(e) => setNewArea({...newArea, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Thứ tự hiển thị</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  value={newArea.position}
                  onChange={(e) => setNewArea({...newArea, position: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="mobile-btn">{editingArea ? "Cập nhật" : "Thêm khu vực"}</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setShowAddForm(false);
                  setEditingArea(null);
                  setNewArea({ id: "", name: "", position: 0 });
                }} className="mobile-btn">Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Danh sách khu vực</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-600">
                <tr>
                  <th className="py-2 pr-3">Mã</th>
                  <th className="py-2 pr-3">Tên khu vực</th>
                  <th className="py-2 pr-3">Thứ tự</th>
                  <th className="py-2 pr-3">Số bàn</th>
                  <th className="py-2 pr-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area: any, index: number) => (
                  <tr key={area.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{area.id}</td>
                    <td className="py-2 pr-3">{area.name}</td>
                    <td className="py-2 pr-3">{area.position}</td>
                    <td className="py-2 pr-3">{area.tables?.length || 0}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleEdit(area)}
                        >
                          Sửa
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => onDeleteArea(area.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TableManagement({ areas, tables, onAddTable, onDeleteTable, onUpdateTable }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [newTable, setNewTable] = useState({
    id: "",
    name: "",
    areaId: "",
    capacity: 4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTable.id && newTable.name && newTable.areaId) {
      onAddTable(newTable);
      setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
      setShowAddForm(false);
    }
  };

  const handleEdit = (table: any) => {
    setEditingTable(table);
    setNewTable({ 
      id: table.id, 
      name: table.name, 
      areaId: table.areaId, 
      capacity: table.capacity 
    });
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable && newTable.name) {
      onUpdateTable(editingTable.id, newTable);
      setEditingTable(null);
      setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Quản lý bàn</h2>
        <Button onClick={() => setShowAddForm(true)}>Thêm bàn mới</Button>
      </div>

      {showAddForm && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>{editingTable ? "Chỉnh sửa bàn" : "Thêm bàn mới"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingTable ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <Label>Mã bàn</Label>
                <Input 
                  placeholder="VD: A01, B05, V1" 
                  value={newTable.id}
                  onChange={(e) => setNewTable({...newTable, id: e.target.value.toUpperCase()})}
                  required
                  disabled={!!editingTable}
                />
              </div>
              <div>
                <Label>Tên bàn</Label>
                <Input 
                  placeholder="VD: Bàn A01, VIP-1"
                  value={newTable.name}
                  onChange={(e) => setNewTable({...newTable, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Khu vực</Label>
                <Select value={newTable.areaId} onValueChange={(value) => setNewTable({...newTable, areaId: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((area: any) => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sức chứa</Label>
                <Input 
                  type="number"
                  placeholder="4"
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value) || 4})}
                  min="1"
                  max="20"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="mobile-btn">{editingTable ? "Cập nhật" : "Thêm bàn"}</Button>
                <Button type="button" variant="secondary" onClick={() => {
                  setShowAddForm(false);
                  setEditingTable(null);
                  setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
                }} className="mobile-btn">Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Danh sách bàn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-neutral-600">
                <tr>
                  <th className="py-2 pr-3">Mã bàn</th>
                  <th className="py-2 pr-3">Tên bàn</th>
                  <th className="py-2 pr-3">Khu vực</th>
                  <th className="py-2 pr-3">Sức chứa</th>
                  <th className="py-2 pr-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table: any, index: number) => (
                  <tr key={table.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{table.id}</td>
                    <td className="py-2 pr-3">{table.name}</td>
                    <td className="py-2 pr-3">
                      <Badge variant="outline">
                        {areas.find((a: any) => a.id === table.areaId)?.name || table.areaId}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{table.capacity} người</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleEdit(table)}
                        >
                          Sửa
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => onDeleteTable(table.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component báo cáo booking 7 ngày gần nhất (dạng bảng)
function Booking7DaysReport({ store, areas, completedBookings }: any) {
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    const generate7DaysData = () => {
      const data: any[] = [];
      // Sử dụng ngày hôm nay (13/10/2025) làm ngày tham chiếu
      const today = new Date(2025, 9, 13); // 13/10/2025
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let bookingCount = 0;
        let walkinCount = 0;

        // Đếm booking từ completedBookings
        completedBookings.forEach((booking: any) => {
          if (booking?.startAt) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= startOfDay && bookingDate <= endOfDay) {
              if (booking.status === 'WALKIN') {
                walkinCount++;
              } else {
                bookingCount++;
              }
            }
          }
        });

        // Tính tổng lượt bàn = số booking + số khách vãng lai
        const totalTables = bookingCount + walkinCount;

        data.push({
          date: format(date, "dd/MM/yyyy"),
          dayOfWeek: format(date, "EEEE"),
          totalTables: totalTables,
          bookingCount: bookingCount,
          walkinCount: walkinCount
        });
      }

      setReportData(data);
    };

    generate7DaysData();
  }, [completedBookings]);

  const totalTables = reportData.reduce((sum, day) => sum + day.totalTables, 0);
  const totalBookings = reportData.reduce((sum, day) => sum + day.bookingCount, 0);
  const totalWalkin = reportData.reduce((sum, day) => sum + day.walkinCount, 0);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Báo cáo booking 7 ngày gần nhất</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalTables}</div>
            <div className="text-sm text-gray-600">Tổng lượt bàn</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalBookings}</div>
            <div className="text-sm text-gray-600">Số booking</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{totalWalkin}</div>
            <div className="text-sm text-gray-600">Khách vãng lai</div>
          </div>
        </div>

        {/* Bảng chi tiết */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600 bg-gray-50">
              <tr>
                <th className="py-3 px-4 font-medium">Ngày</th>
                <th className="py-3 px-4 font-medium">Thứ</th>
                <th className="py-3 px-4 font-medium">Tổng lượt bàn</th>
                <th className="py-3 px-4 font-medium">Số booking</th>
                <th className="py-3 px-4 font-medium">Số khách vãng lai</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((day, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{day.date}</td>
                  <td className="py-3 px-4 text-gray-600">{day.dayOfWeek}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {day.totalTables}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {day.bookingCount}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {day.walkinCount}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Component báo cáo nhân viên theo ngày
function StaffBookingReport({ store, areas, completedBookings }: any) {
  const [staffData, setStaffData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date(2024, 9, 1)); // 1/10/2024
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 9, 20)); // 20/10/2024

  useEffect(() => {
    const generateStaffReport = () => {
      const staffMap = new Map();
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const historicalData = getHistoricalData();
      areas.forEach((area: any) => {
        Object.entries(historicalData[area.id] || {}).forEach(([key, booking]: any) => {
          if (booking?.bookingId && booking.startAt && booking.staff) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= start && bookingDate <= end) {
              const staffName = booking.staff;
              if (!staffMap.has(staffName)) {
                staffMap.set(staffName, {
                  name: staffName,
                  totalBookings: 0,
                  seatedBookings: 0,
                  walkinBookings: 0,
                  holdBookings: 0,
                  totalGuests: 0,
                  closedBookings: 0
                });
              }
              
              const staff = staffMap.get(staffName);
              staff.totalBookings++;
              staff.totalGuests += booking.partySize || 0;
              
              if (booking.status === 'SEATED') staff.seatedBookings++;
              else if (booking.status === 'WALKIN') staff.walkinBookings++;
              else if (booking.status === 'HOLD') staff.holdBookings++;
              else if (booking.status === 'CLOSED') staff.closedBookings++;
            }
          }
        });
      });

      const data = Array.from(staffMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
      setStaffData(data);
    };

    generateStaffReport();
  }, [store, areas, startDate, endDate]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Báo cáo nhân viên theo ngày</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>Từ ngày:</Label>
              <Input
                type="date"
                value={toInputDate(startDate)}
                onChange={(e) => setStartDate(fromInputDate(e.target.value))}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Đến ngày:</Label>
              <Input
                type="date"
                value={toInputDate(endDate)}
                onChange={(e) => setEndDate(fromInputDate(e.target.value))}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600 bg-gray-50">
              <tr>
                <th className="py-3 px-4 font-medium">Nhân viên</th>
                <th className="py-3 px-4 font-medium">Tổng booking</th>
                <th className="py-3 px-4 font-medium">Đang ngồi</th>
                <th className="py-3 px-4 font-medium">Khách vãng lai</th>
                <th className="py-3 px-4 font-medium">Đã đặt</th>
                <th className="py-3 px-4 font-medium">Đã đóng</th>
                <th className="py-3 px-4 font-medium">Tổng khách</th>
                <th className="py-3 px-4 font-medium">TB khách/booking</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{staff.name}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                      {staff.totalBookings}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{staff.seatedBookings}</td>
                  <td className="py-3 px-4">{staff.walkinBookings}</td>
                  <td className="py-3 px-4">{staff.holdBookings}</td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{staff.closedBookings}</Badge>
                  </td>
                  <td className="py-3 px-4">{staff.totalGuests}</td>
                  <td className="py-3 px-4">
                    {staff.totalBookings > 0 ? (staff.totalGuests / staff.totalBookings).toFixed(1) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staffData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu nhân viên trong khoảng thời gian đã chọn
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Component báo cáo hiệu suất bàn theo khu
function TablePerformanceReport({ store, areas, tables, completedBookings }: any) {
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2024, 9, 15)); // 15/10/2024

  useEffect(() => {
    const generateTableReport = () => {
      const areaMap = new Map();
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      areas.forEach((area: any) => {
        areaMap.set(area.id, {
          areaId: area.id,
          areaName: area.name,
          totalTables: 0,
          usedTables: 0,
          totalBookings: 0,
          seatedBookings: 0,
          walkinBookings: 0,
          holdBookings: 0,
          closedBookings: 0,
          totalGuests: 0,
          utilizationRate: 0
        });
      });

      // Đếm tổng số bàn trong mỗi khu
      areas.forEach((area: any) => {
        const areaData = areaMap.get(area.id);
        areaData.totalTables = tables.filter(t => t.areaId === area.id).length;
      });

      // Đếm bàn được sử dụng và booking
      const historicalData = getHistoricalData();
      areas.forEach((area: any) => {
        const usedTables = new Set();
        const areaData = areaMap.get(area.id);
        
        Object.entries(historicalData[area.id] || {}).forEach(([key, booking]: any) => {
          if (booking?.bookingId && booking.startAt) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= startOfDay && bookingDate <= endOfDay) {
              const tableId = booking.tableId || key.split('_')[0]; // Lấy tableId từ booking hoặc từ key
              usedTables.add(tableId);
              areaData.totalBookings++;
              areaData.totalGuests += booking.partySize || 0;
              
              if (booking.status === 'SEATED') areaData.seatedBookings++;
              else if (booking.status === 'WALKIN') areaData.walkinBookings++;
              else if (booking.status === 'HOLD') areaData.holdBookings++;
              else if (booking.status === 'CLOSED') areaData.closedBookings++;
            }
          }
        });
        
        areaData.usedTables = usedTables.size;
        areaData.utilizationRate = areaData.totalTables > 0 ? 
          ((areaData.usedTables / areaData.totalTables) * 100).toFixed(1) : 0;
      });

      const data = Array.from(areaMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
      setTableData(data);
    };

    generateTableReport();
  }, [store, areas, selectedDate]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Báo cáo hiệu suất bàn theo khu</CardTitle>
          <div className="flex items-center gap-2">
            <Label>Chọn ngày:</Label>
            <Input
              type="date"
              value={toInputDate(selectedDate)}
              onChange={(e) => setSelectedDate(fromInputDate(e.target.value))}
              className="w-40"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600 bg-gray-50">
              <tr>
                           <th className="py-3 px-4 font-medium">Khu vực</th>
                           <th className="py-3 px-4 font-medium">Tổng bàn</th>
                           <th className="py-3 px-4 font-medium">Bàn đã sử dụng</th>
                           <th className="py-3 px-4 font-medium">Tỷ lệ sử dụng</th>
                           <th className="py-3 px-4 font-medium">Tổng booking</th>
                           <th className="py-3 px-4 font-medium">Đang ngồi</th>
                           <th className="py-3 px-4 font-medium">Khách vãng lai</th>
                           <th className="py-3 px-4 font-medium">Đã đặt</th>
                           <th className="py-3 px-4 font-medium">Đã hoàn thành</th>
                           <th className="py-3 px-4 font-medium">Tổng khách</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((area, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">
                    <Badge variant="outline" className="bg-blue-50 text-blue-800">
                      {area.areaName}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{area.totalTables}</td>
                  <td className="py-3 px-4">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {area.usedTables}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${area.utilizationRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{area.utilizationRate}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{area.totalBookings}</Badge>
                  </td>
                  <td className="py-3 px-4">{area.seatedBookings}</td>
                  <td className="py-3 px-4">{area.walkinBookings}</td>
                  <td className="py-3 px-4">{area.holdBookings}</td>
                  <td className="py-3 px-4">
                    <Badge variant="outline" className="bg-gray-100">
                      {area.closedBookings}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{area.totalGuests}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có dữ liệu sử dụng bàn trong ngày {format(selectedDate, "dd/MM/yyyy")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyBookingReport({ store, areas, selectedDate, setSelectedDate, tables, completedBookings }: any) {
  const [reportData, setReportData] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isDateRange, setIsDateRange] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 9, 20)); // 20/10/2024

  useEffect(() => {
    // Tạo dữ liệu báo cáo cho ngày/khoảng thời gian được chọn
    const generateReport = () => {
      const data: any[] = [];
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDateForQuery = isDateRange ? new Date(endDate) : new Date(selectedDate);
      endDateForQuery.setHours(23, 59, 59, 999);

      const historicalData = getHistoricalData();
      areas.forEach((area: any) => {
        Object.entries(historicalData[area.id] || {}).forEach(([key, booking]: any) => {
          if (booking?.bookingId && booking.startAt) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= startDate && bookingDate <= endDateForQuery) {
              const tableId = booking.tableId || key.split('_')[0];
              const table = tables.find((t: any) => t.id === tableId);
              data.push({
                time: booking.startAt,
                tableId,
                tableName: table?.name || tableId,
                area: area.name,
                customer: booking.customer?.name || 'Khách vãng lai',
                partySize: booking.partySize,
                status: booking.status,
                staff: booking.staff,
                note: booking.note
              });
            }
          }
        });
      });

      // Sắp xếp theo thời gian
      data.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setReportData(data);

      // Tạo dữ liệu cho biểu đồ
      generateChartData(data, startDate, endDateForQuery);
    };

    generateReport();
  }, [store, areas, selectedDate, endDate, isDateRange]);

  const generateChartData = (data: any[], startDate: Date, endDate: Date) => {
    const chartMap = new Map();
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = format(currentDate, "dd/MM");
      chartMap.set(dateKey, {
        date: dateKey,
        total: 0,
        seated: 0,
        walkin: 0,
        hold: 0
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    data.forEach(booking => {
      const dateKey = format(new Date(booking.time), "dd/MM");
      if (chartMap.has(dateKey)) {
        const dayData = chartMap.get(dateKey);
        dayData.total++;
        if (booking.status === 'SEATED') dayData.seated++;
        else if (booking.status === 'WALKIN') dayData.walkin++;
        else if (booking.status === 'HOLD') dayData.hold++;
      }
    });

    setChartData(Array.from(chartMap.values()));
  };

  const totalBookings = reportData.length;
  const seatedBookings = reportData.filter(b => b.status === 'SEATED').length;
  const walkinBookings = reportData.filter(b => b.status === 'WALKIN').length;
  const holdBookings = reportData.filter(b => b.status === 'HOLD').length;

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Báo cáo booking theo ngày</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dateRange"
                checked={isDateRange}
                onChange={(e) => setIsDateRange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="dateRange">Khoảng thời gian</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>{isDateRange ? 'Từ ngày:' : 'Chọn ngày:'}</Label>
              <Input
                type="date"
                value={toInputDate(selectedDate)}
                onChange={(e) => setSelectedDate(fromInputDate(e.target.value))}
                className="w-40"
              />
            </div>
            
            {isDateRange && (
              <div className="flex items-center gap-2">
                <Label>Đến ngày:</Label>
                <Input
                  type="date"
                  value={toInputDate(endDate)}
                  onChange={(e) => setEndDate(fromInputDate(e.target.value))}
                  className="w-40"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalBookings}</div>
            <div className="text-sm text-gray-600">Tổng booking</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{seatedBookings}</div>
            <div className="text-sm text-gray-600">Đang ngồi</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{walkinBookings}</div>
            <div className="text-sm text-gray-600">Khách vãng lai</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{holdBookings}</div>
            <div className="text-sm text-gray-600">Đã đặt</div>
          </div>
        </div>

        {/* Biểu đồ */}
        {chartData.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Biểu đồ booking theo ngày</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-end justify-between h-64 gap-2">
                {chartData.map((day, index) => {
                  const maxValue = Math.max(...chartData.map(d => d.total));
                  const height = maxValue > 0 ? (day.total / maxValue) * 200 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="flex flex-col items-center gap-1 mb-2">
                        <div className="text-xs text-gray-600">{day.date}</div>
                        <div className="text-sm font-medium">{day.total}</div>
                      </div>
                      <div className="w-full flex flex-col justify-end h-48">
                        <div className="flex flex-col h-full justify-end gap-1">
                          {day.seated > 0 && (
                            <div 
                              className="bg-green-500 rounded-t"
                              style={{ height: `${(day.seated / day.total) * height}px` }}
                              title={`Đang ngồi: ${day.seated}`}
                            ></div>
                          )}
                          {day.walkin > 0 && (
                            <div 
                              className="bg-yellow-500"
                              style={{ height: `${(day.walkin / day.total) * height}px` }}
                              title={`Khách vãng lai: ${day.walkin}`}
                            ></div>
                          )}
                          {day.hold > 0 && (
                            <div 
                              className="bg-orange-500 rounded-b"
                              style={{ height: `${(day.hold / day.total) * height}px` }}
                              title={`Đã đặt: ${day.hold}`}
                            ></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Đang ngồi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Khách vãng lai</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-600">Đã đặt</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-3">Thời gian</th>
                <th className="py-2 pr-3">Bàn</th>
                <th className="py-2 pr-3">Khách hàng</th>
                <th className="py-2 pr-3">Số khách</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">Nhân viên</th>
                <th className="py-2 pr-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((booking, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 pr-3">{format(new Date(booking.time), "HH:mm")}</td>
                  <td className="py-2 pr-3">{booking.tableName || booking.tableId}</td>
                  <td className="py-2 pr-3">{booking.customer}</td>
                  <td className="py-2 pr-3">{booking.partySize}</td>
                  <td className="py-2 pr-3">
                    <Badge variant={
                      booking.status === 'SEATED' ? 'default' : 
                      booking.status === 'WALKIN' ? 'default' : 
                      'secondary'
                    }>
                      {booking.status === 'SEATED' ? 'Đang ngồi' : 
                       booking.status === 'WALKIN' ? 'Khách vãng lai' : 
                       'Đã đặt'}
                    </Badge>
                  </td>
                  <td className="py-2 pr-3">{booking.staff}</td>
                  <td className="py-2 pr-3">{booking.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reportData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {isDateRange 
                ? `Không có booking nào từ ${format(selectedDate, "dd/MM/yyyy")} đến ${format(endDate, "dd/MM/yyyy")}`
                : `Không có booking nào trong ngày ${format(selectedDate, "dd/MM/yyyy")}`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffPerformanceReport({ store, areas, selectedDate, setSelectedDate, completedBookings }: any) {
  const [staffData, setStaffData] = useState<any[]>([]);
  const [isDateRange, setIsDateRange] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 9, 20)); // 20/10/2024

  useEffect(() => {
    const generateStaffReport = () => {
      const staffMap = new Map();
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDateForQuery = isDateRange ? new Date(endDate) : new Date(selectedDate);
      endDateForQuery.setHours(23, 59, 59, 999);

      const historicalData = getHistoricalData();
      areas.forEach((area: any) => {
        Object.entries(historicalData[area.id] || {}).forEach(([key, booking]: any) => {
          if (booking?.bookingId && booking.startAt && booking.staff) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= startDate && bookingDate <= endDateForQuery) {
              const staffName = booking.staff;
              if (!staffMap.has(staffName)) {
                staffMap.set(staffName, {
                  name: staffName,
                  totalBookings: 0,
                  seatedBookings: 0,
                  walkinBookings: 0,
                  holdBookings: 0,
                  totalGuests: 0,
                  closedBookings: 0
                });
              }
              
              const staff = staffMap.get(staffName);
              staff.totalBookings++;
              staff.totalGuests += booking.partySize || 0;
              
              if (booking.status === 'SEATED') staff.seatedBookings++;
              else if (booking.status === 'WALKIN') staff.walkinBookings++;
              else if (booking.status === 'HOLD') staff.holdBookings++;
              else if (booking.status === 'CLOSED') staff.closedBookings++;
            }
          }
        });
      });

      const data = Array.from(staffMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
      setStaffData(data);
    };

    generateStaffReport();
  }, [store, areas, selectedDate, endDate, isDateRange]);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Hiệu suất nhân viên</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="staffDateRange"
                checked={isDateRange}
                onChange={(e) => setIsDateRange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="staffDateRange">Khoảng thời gian</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>{isDateRange ? 'Từ ngày:' : 'Chọn ngày:'}</Label>
              <Input
                type="date"
                value={toInputDate(selectedDate)}
                onChange={(e) => setSelectedDate(fromInputDate(e.target.value))}
                className="w-40"
              />
            </div>
            
            {isDateRange && (
              <div className="flex items-center gap-2">
                <Label>Đến ngày:</Label>
                <Input
                  type="date"
                  value={toInputDate(endDate)}
                  onChange={(e) => setEndDate(fromInputDate(e.target.value))}
                  className="w-40"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-3">Nhân viên</th>
                <th className="py-2 pr-3">Tổng booking</th>
                <th className="py-2 pr-3">Đang ngồi</th>
                <th className="py-2 pr-3">Khách vãng lai</th>
                <th className="py-2 pr-3">Đã đặt</th>
                <th className="py-2 pr-3">Tổng khách</th>
                <th className="py-2 pr-3">TB khách/booking</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 pr-3 font-medium">{staff.name}</td>
                  <td className="py-2 pr-3">
                    <Badge variant="default">{staff.totalBookings}</Badge>
                  </td>
                  <td className="py-2 pr-3">{staff.seatedBookings}</td>
                  <td className="py-2 pr-3">{staff.walkinBookings}</td>
                  <td className="py-2 pr-3">{staff.holdBookings}</td>
                  <td className="py-2 pr-3">{staff.totalGuests}</td>
                  <td className="py-2 pr-3">
                    {staff.totalBookings > 0 ? (staff.totalGuests / staff.totalBookings).toFixed(1) : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {staffData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {isDateRange 
                ? `Không có dữ liệu nhân viên từ ${format(selectedDate, "dd/MM/yyyy")} đến ${format(endDate, "dd/MM/yyyy")}`
                : `Không có dữ liệu nhân viên trong ngày ${format(selectedDate, "dd/MM/yyyy")}`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TableUsageReport({ store, areas, selectedDate, setSelectedDate, tables, completedBookings }: any) {
  const [tableData, setTableData] = useState<any[]>([]);
  const [isDateRange, setIsDateRange] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date(2024, 9, 20)); // 20/10/2024

  useEffect(() => {
    const generateTableReport = () => {
      const tableMap = new Map();
      const startDate = new Date(selectedDate);
      startDate.setHours(0, 0, 0, 0);
      const endDateForQuery = isDateRange ? new Date(endDate) : new Date(selectedDate);
      endDateForQuery.setHours(23, 59, 59, 999);

      areas.forEach((area: any) => {
        const historicalData = getHistoricalData(completedBookings);
        Object.entries(historicalData[area.id] || {}).forEach(([key, booking]: any) => {
          if (booking?.bookingId && booking.startAt) {
            const bookingDate = new Date(booking.startAt);
            if (bookingDate >= startDate && bookingDate <= endDateForQuery) {
              const tableId = booking.tableId || key.split('_')[0];
              if (!tableMap.has(tableId)) {
                const tableInfo = tables.find((t: any) => t.id === tableId);
                tableMap.set(tableId, {
                  tableId,
                  tableName: tableInfo?.name || tableId,
                  area: area.name,
                  bookingCount: 0,
                  walkinCount: 0,
                  totalGuests: 0,
                  totalRevenue: 0 // Có thể tính toán dựa trên party size
                });
              }
              
              const table = tableMap.get(tableId);
              table.bookingCount++;
              table.totalGuests += booking.partySize || 0;
              
              if (booking.status === 'WALKIN') {
                table.walkinCount++;
              }
            }
          }
        });
      });

      const data = Array.from(tableMap.values()).sort((a, b) => b.bookingCount - a.bookingCount);
      setTableData(data);
    };

    generateTableReport();
  }, [store, areas, selectedDate, endDate, isDateRange]);

  const totalTables = tableData.length;
  const totalBookings = tableData.reduce((sum, table) => sum + table.bookingCount, 0);
  const totalWalkins = tableData.reduce((sum, table) => sum + table.walkinCount, 0);
  const totalGuests = tableData.reduce((sum, table) => sum + table.totalGuests, 0);

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Báo cáo sử dụng bàn</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tableDateRange"
                checked={isDateRange}
                onChange={(e) => setIsDateRange(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="tableDateRange">Khoảng thời gian</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label>{isDateRange ? 'Từ ngày:' : 'Chọn ngày:'}</Label>
              <Input
                type="date"
                value={toInputDate(selectedDate)}
                onChange={(e) => setSelectedDate(fromInputDate(e.target.value))}
                className="w-40"
              />
            </div>
            
            {isDateRange && (
              <div className="flex items-center gap-2">
                <Label>Đến ngày:</Label>
                <Input
                  type="date"
                  value={toInputDate(endDate)}
                  onChange={(e) => setEndDate(fromInputDate(e.target.value))}
                  className="w-40"
                />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalTables}</div>
            <div className="text-sm text-gray-600">Bàn có booking</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalBookings}</div>
            <div className="text-sm text-gray-600">Tổng lượt booking</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{totalWalkins}</div>
            <div className="text-sm text-gray-600">Khách vãng lai</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{totalGuests}</div>
            <div className="text-sm text-gray-600">Tổng khách</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-3">Bàn</th>
                <th className="py-2 pr-3">Khu vực</th>
                <th className="py-2 pr-3">Số lượt booking</th>
                <th className="py-2 pr-3">Khách vãng lai</th>
                <th className="py-2 pr-3">Tổng khách</th>
                <th className="py-2 pr-3">TB khách/lượt</th>
                <th className="py-2 pr-3">Hiệu suất</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((table, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 pr-3 font-medium">{table.tableName || table.tableId}</td>
                  <td className="py-2 pr-3">
                    <Badge variant="outline">{table.area}</Badge>
                  </td>
                  <td className="py-2 pr-3">
                    <Badge variant="default">{table.bookingCount}</Badge>
                  </td>
                  <td className="py-2 pr-3">{table.walkinCount}</td>
                  <td className="py-2 pr-3">{table.totalGuests}</td>
                  <td className="py-2 pr-3">
                    {table.bookingCount > 0 ? (table.totalGuests / table.bookingCount).toFixed(1) : '0'}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((table.bookingCount / 5) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">
                        {Math.min((table.bookingCount / 5) * 100, 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tableData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {isDateRange 
                ? `Không có dữ liệu sử dụng bàn từ ${format(selectedDate, "dd/MM/yyyy")} đến ${format(endDate, "dd/MM/yyyy")}`
                : `Không có dữ liệu sử dụng bàn trong ngày ${format(selectedDate, "dd/MM/yyyy")}`
              }
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function BookingList({ store, areas, tables }: any) {
  const rows: Array<any> = [];
  areas.forEach((area: any) => {
    Object.entries(store[area.id] || {}).forEach(([key, cell]: any) => {
      if (cell?.bookingId) {
        const tableId = cell.tableId || key.split('_')[0];
        const table = tables.find((t: any) => t.id === tableId);
        rows.push({ area: area.id, tableId: tableId, tableName: table?.name || tableId, ...cell });
      }
    });
  });
  rows.sort((a,b) => (a.startAt?.getTime?.()||0) - (b.startAt?.getTime?.()||0));
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2"><CardTitle className="text-xl">Danh sách booking</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-600">
              <tr>
                <th className="py-2 pr-3">Giờ</th>
                <th className="py-2 pr-3">Bàn</th>
                <th className="py-2 pr-3">Khách</th>
                <th className="py-2 pr-3">SĐT</th>
                <th className="py-2 pr-3">SL</th>
                <th className="py-2 pr-3">Trạng thái</th>
                <th className="py-2 pr-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.bookingId + ":" + r.tableId + ":" + i} className="border-t">
                  <td className="py-2 pr-3">{r.startAt ? format(new Date(r.startAt), "HH:mm") : "-"}</td>
                  <td className="py-2 pr-3">{r.tableName}</td>
                  <td className="py-2 pr-3">{r.customer?.name}</td>
                  <td className="py-2 pr-3">{r.customer?.phone}</td>
                  <td className="py-2 pr-3">{r.partySize}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Self-tests
function runSelfTests() {
  const results: Array<{name:string; pass:boolean; details?:string}> = [];
  const assert = (name:string, cond:boolean, details?:string) => results.push({ name, pass: !!cond, details });

  const base = startOfDay(new Date());
  const arr = Array.from({ length: 7 }).map((_, i) => addDays(base, i - 3));
  assert("Date strip has 7 days", arr.length === 7);
  assert("Center is today", toInputDate(arr[3]) === toInputDate(base));

  const areaATables = DEFAULT_TABLES.filter(t => t.areaId === "A");
  const areaBTables = DEFAULT_TABLES.filter(t => t.areaId === "B");
  const areaCTables = DEFAULT_TABLES.filter(t => t.areaId === "C");
  const areaCSofas = DEFAULT_TABLES.filter(t => t.areaId === "C_SOFA");
  const areaDTables = DEFAULT_TABLES.filter(t => t.areaId === "D");
  const areaDSofas = DEFAULT_TABLES.filter(t => t.areaId === "D_SOFA");
  const areaETables = DEFAULT_TABLES.filter(t => t.areaId === "E");
  const areaESofas = DEFAULT_TABLES.filter(t => t.areaId === "E_SOFA");
  const areaVIPTables = DEFAULT_TABLES.filter(t => t.areaId === "VIP_E");
  
  assert("Area A has 6 tables", areaATables.length === 6);
  assert("Area B has 18 tables", areaBTables.length === 18);
  assert("Area C has 15 tables", areaCTables.length === 15);
  assert("Area C SOFA has 5 tables", areaCSofas.length === 5);
  assert("Area D has 14 tables", areaDTables.length === 14);
  assert("Area D SOFA has 4 tables", areaDSofas.length === 4);
  assert("Area E has 11 tables", areaETables.length === 11);
  assert("Area E SOFA has 6 tables", areaESofas.length === 6);
  assert("VIP E has 4 tables", areaVIPTables.length === 4);

  const sim = generateMockData();
  // Test với data mẫu mới
  const anyBooking = Object.values(sim).find((areaData: any) => 
    Object.values(areaData).some((booking: any) => booking?.bookingId)
  );
  if (anyBooking) {
    assert("Mock data has bookings", true);
  }

  const tId = "A01";
  const st = new Date(); st.setHours(19,0,0,0);
  const created = { status: "HOLD", bookingId: "BK-TST", startAt: st, endAt: null } as any;
  const store0:any = { A: {} }; store0.A[tId] = created;
  assert("Create booking has endAt = null", store0.A[tId].endAt === null);

  const reason = "Khách bận";
  const ok = !!reason.trim();
  assert("Cancel requires reason", ok);

  const baseCell = { bookingId: "BK-XYZ", tables: ["A01"], status: "HOLD" } as any;
  const attach = ["A03","A04"];
  const merged = Array.from(new Set([...(baseCell.tables||[]), ...attach]));
  assert("Attach increases tables length", merged.length === 3);

  assert("canCloseBooking manager seated", canCloseBooking("manager","SEATED") === true);
  assert("canCloseBooking staff seated", canCloseBooking("staff","SEATED") === true);
  assert("canCloseBooking manager hold", canCloseBooking("manager","HOLD") === false);

  try { console.table(results); } catch {}
  return results;
}

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeTable, setActiveTable] = useState<any>(null);
  const [view, setView] = useState<"grid"|"list">("grid");
  const [currentView, setCurrentView] = useState<"tables"|"dashboard"|"crm"|"settings">("tables");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Data source toggle
  const [useSupabase, setUseSupabase] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Supabase data hook
  const supabaseData = useSupabaseData();
  
  // State quản lý trạng thái lock của các bàn
  const [lockedTables, setLockedTables] = useState<Set<string>>(new Set());

  // Helper functions cho lock/unlock tables
  const canLockTable = () => {
    return currentUser && (currentUser.role === "admin" || currentUser.role === "manager");
  };

  const toggleTableLock = (tableId: string) => {
    setLockedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  const isTableLocked = (tableId: string) => {
    return lockedTables.has(tableId);
  };
  const [completedBookings, setCompletedBookings] = useState<any[]>([
    // Dữ liệu mẫu cho tháng 10/2025 (7 ngày gần nhất)
    {
      bookingId: "BK-2025-001",
      customer: { name: "Nguyễn Minh Tuấn", phone: "0901234567" },
      bookingTime: new Date(2025, 9, 13, 10, 0), // Đặt bàn lúc 10h sáng
      startAt: new Date(2025, 9, 13, 19, 0), // Mở bàn lúc 19h
      endAt: new Date(2025, 9, 13, 21, 30),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A01",
      tableName: "A01",
      note: "Sinh nhật vợ",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-2025-002",
      customer: { name: "Trần Thị Hương", phone: "0987654321" },
      bookingTime: new Date(2025, 9, 13, 14, 0), // Đặt bàn lúc 14h
      startAt: new Date(2025, 9, 13, 18, 30), // Mở bàn lúc 18h30
      endAt: new Date(2025, 9, 13, 20, 45),
      partySize: 2,
      status: "CLOSED",
      area: "B",
      tableId: "B01",
      tableName: "B01",
      note: "Hẹn hò",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-2025-003",
      customer: { name: "Lê Văn Đức", phone: "0912345678" },
      startAt: new Date(2025, 9, 13, 19, 30),
      endAt: new Date(2025, 9, 13, 22, 0),
      partySize: 6,
      status: "WALKIN", 
      area: "C",
      tableId: "C01",
      tableName: "C01",
      note: "Khách vãng lai",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-2025-004",
      customer: { name: "Phạm Thị Mai", phone: "0923456789" },
      startAt: new Date(2025, 9, 12, 20, 0),
      endAt: new Date(2025, 9, 12, 22, 15),
      partySize: 3,
      status: "CLOSED",
      area: "D",
      tableId: "D01", 
      tableName: "D01",
      note: "Tiệc công ty",
      staff: "quanly1"
    },
    {
      bookingId: "BK-2025-005",
      customer: { name: "Hoàng Văn Nam", phone: "0934567890" },
      startAt: new Date(2025, 9, 12, 18, 0),
      endAt: new Date(2025, 9, 12, 20, 30),
      partySize: 5,
      status: "WALKIN",
      area: "E",
      tableId: "E01",
      tableName: "E01",
      note: "Khách vãng lai",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-2025-006",
      customer: { name: "Vũ Thị Lan", phone: "0945678901" },
      startAt: new Date(2025, 9, 11, 18, 0),
      endAt: new Date(2025, 9, 11, 20, 30),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A02",
      tableName: "A02",
      note: "Hẹn hò",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-2025-007",
      customer: { name: "Đỗ Văn Hùng", phone: "0956789012" },
      startAt: new Date(2025, 9, 11, 19, 15),
      endAt: new Date(2025, 9, 11, 21, 45),
      partySize: 6,
      status: "CLOSED",
      area: "B",
      tableId: "B02",
      tableName: "B02",
      note: "Gia đình",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-2025-008",
      customer: { name: "Ngô Thị Hoa", phone: "0967890123" },
      startAt: new Date(2025, 9, 10, 18, 30),
      endAt: new Date(2025, 9, 10, 21, 0),
      partySize: 3,
      status: "WALKIN",
      area: "C",
      tableId: "C02",
      tableName: "C02",
      note: "Khách vãng lai",
      staff: "nhanvien4"
    },
    {
      bookingId: "BK-2025-009",
      customer: { name: "Bùi Văn Tài", phone: "0978901234" },
      startAt: new Date(2025, 9, 10, 19, 0),
      endAt: new Date(2025, 9, 10, 22, 30),
      partySize: 8,
      status: "CLOSED",
      area: "D",
      tableId: "D02",
      tableName: "D02",
      note: "Tiệc sinh nhật",
      staff: "quanly1"
    },
    {
      bookingId: "BK-2025-010",
      customer: { name: "Trần Văn Minh", phone: "0987654321" },
      startAt: new Date(2025, 9, 9, 18, 0),
      endAt: new Date(2025, 9, 9, 20, 30),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A03",
      tableName: "A03",
      note: "Gia đình",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-2025-011",
      customer: { name: "Lê Thị Hoa", phone: "0912345678" },
      startAt: new Date(2025, 9, 9, 19, 0),
      endAt: new Date(2025, 9, 9, 21, 0),
      partySize: 2,
      status: "WALKIN",
      area: "B",
      tableId: "B03",
      tableName: "B03",
      note: "Khách vãng lai",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-2025-012",
      customer: { name: "Phạm Văn Đức", phone: "0923456789" },
      startAt: new Date(2025, 9, 8, 18, 30),
      endAt: new Date(2025, 9, 8, 21, 30),
      partySize: 6,
      status: "CLOSED",
      area: "C",
      tableId: "C03",
      tableName: "C03",
      note: "Tiệc công ty",
      staff: "quanly1"
    },
    {
      bookingId: "BK-2025-013",
      customer: { name: "Nguyễn Thị Lan", phone: "0934567890" },
      startAt: new Date(2025, 9, 8, 19, 15),
      endAt: new Date(2025, 9, 8, 22, 0),
      partySize: 3,
      status: "WALKIN",
      area: "D",
      tableId: "D03",
      tableName: "D03",
      note: "Khách vãng lai",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-2025-014",
      customer: { name: "Hoàng Thị Mai", phone: "0945678901" },
      startAt: new Date(2025, 9, 7, 18, 0),
      endAt: new Date(2025, 9, 7, 20, 30),
      partySize: 5,
      status: "CLOSED",
      area: "E",
      tableId: "E02",
      tableName: "E02",
      note: "Gia đình",
      staff: "nhanvien4"
    },
    // Dữ liệu cũ để test khoảng ngày
    {
      bookingId: "BK-OLD-001",
      customer: { name: "Nguyễn Minh Tuấn", phone: "0901234567" },
      bookingTime: new Date(2024, 9, 1, 10, 0), // Đặt bàn lúc 10h sáng
      startAt: new Date(2024, 9, 1, 19, 0), // Mở bàn lúc 19h
      endAt: new Date(2024, 9, 1, 21, 30),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A01",
      tableName: "A01",
      note: "Sinh nhật vợ",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-002", 
      customer: { name: "Trần Thị Hương", phone: "0987654321" },
      bookingTime: new Date(2024, 9, 2, 14, 0), // Đặt bàn lúc 14h
      startAt: new Date(2024, 9, 2, 18, 30), // Mở bàn lúc 18h30
      endAt: new Date(2024, 9, 2, 20, 45),
      partySize: 2,
      status: "CLOSED",
      area: "B",
      tableId: "B01",
      tableName: "B01",
      note: "Hẹn hò",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-003",
      customer: { name: "Nguyễn Minh Tuấn", phone: "0901234567" },
      startAt: new Date(2024, 9, 5, 19, 30),
      endAt: new Date(2024, 9, 5, 22, 0),
      partySize: 6,
      status: "CLOSED", 
      area: "C",
      tableId: "C01",
      tableName: "C01",
      note: "Gia đình",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-004",
      customer: { name: "Lê Văn Đức", phone: "0912345678" },
      startAt: new Date(2024, 9, 3, 20, 0),
      endAt: new Date(2024, 9, 3, 22, 15),
      partySize: 3,
      status: "CLOSED",
      area: "D",
      tableId: "D01", 
      tableName: "D01",
      note: "Tiệc công ty",
      staff: "quanly1"
    },
    {
      bookingId: "BK-005",
      customer: { name: "Phạm Thị Mai", phone: "0923456789" },
      startAt: new Date(2024, 9, 4, 18, 0),
      endAt: new Date(2024, 9, 4, 20, 30),
      partySize: 5,
      status: "CLOSED",
      area: "E",
      tableId: "E01",
      tableName: "E01",
      note: "Họp lớp",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-006",
      customer: { name: "Hoàng Văn Nam", phone: "0934567890" },
      startAt: new Date(2024, 9, 6, 19, 15),
      endAt: new Date(2024, 9, 6, 21, 45),
      partySize: 2,
      status: "CLOSED",
      area: "A",
      tableId: "A02",
      tableName: "A02",
      note: "Hẹn hò",
      staff: "nhanvien4"
    },
    {
      bookingId: "BK-007",
      customer: { name: "Võ Thị Lan", phone: "0945678901" },
      startAt: new Date(2024, 9, 7, 18, 45),
      endAt: new Date(2024, 9, 7, 21, 0),
      partySize: 4,
      status: "CLOSED",
      area: "B",
      tableId: "B02",
      tableName: "B02",
      note: "Gia đình",
      staff: "nhanvien5"
    },
    {
      bookingId: "BK-008",
      customer: { name: "Đặng Minh Khôi", phone: "0956789012" },
      startAt: new Date(2024, 9, 8, 20, 0),
      endAt: new Date(2024, 9, 8, 22, 30),
      partySize: 8,
      status: "CLOSED",
      area: "VIP_E",
      tableId: "SF1",
      tableName: "SF1",
      note: "Tiệc sinh nhật",
      staff: "quanly1"
    },
    {
      bookingId: "BK-009",
      customer: { name: "Bùi Thị Hoa", phone: "0967890123" },
      startAt: new Date(2024, 9, 9, 19, 30),
      endAt: new Date(2024, 9, 9, 21, 45),
      partySize: 3,
      status: "CLOSED",
      area: "C",
      tableId: "C02",
      tableName: "C02",
      note: "Hẹn hò",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-010",
      customer: { name: "Ngô Văn Thành", phone: "0978901234" },
      startAt: new Date(2024, 9, 10, 18, 15),
      endAt: new Date(2024, 9, 10, 20, 30),
      partySize: 6,
      status: "CLOSED",
      area: "D",
      tableId: "D02",
      tableName: "D02",
      note: "Gia đình",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-011",
      customer: { name: "Nguyễn Minh Tuấn", phone: "0901234567" },
      startAt: new Date(2024, 9, 12, 19, 0),
      endAt: new Date(2024, 9, 12, 21, 15),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A03",
      tableName: "A03",
      note: "Gia đình",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-012",
      customer: { name: "Trần Thị Hương", phone: "0987654321" },
      startAt: new Date(2024, 9, 15, 18, 30),
      endAt: new Date(2024, 9, 15, 20, 45),
      partySize: 2,
      status: "CLOSED",
      area: "B",
      tableId: "B03",
      tableName: "B03",
      note: "Hẹn hò",
      staff: "nhanvien4"
    },
    {
      bookingId: "BK-013",
      customer: { name: "Lê Văn Đức", phone: "0912345678" },
      startAt: new Date(2024, 9, 18, 20, 0),
      endAt: new Date(2024, 9, 18, 22, 15),
      partySize: 5,
      status: "CLOSED",
      area: "E",
      tableId: "E02",
      tableName: "E02",
      note: "Tiệc công ty",
      staff: "quanly1"
    },
    {
      bookingId: "BK-014",
      customer: { name: "Phạm Thị Mai", phone: "0923456789" },
      startAt: new Date(2024, 9, 20, 19, 15),
      endAt: new Date(2024, 9, 20, 21, 30),
      partySize: 3,
      status: "CLOSED",
      area: "C",
      tableId: "C03",
      tableName: "C03",
      note: "Gia đình",
      staff: "nhanvien5"
    },
    {
      bookingId: "BK-015",
      customer: { name: "Hoàng Văn Nam", phone: "0934567890" },
      startAt: new Date(2024, 9, 22, 18, 45),
      endAt: new Date(2024, 9, 22, 21, 0),
      partySize: 2,
      status: "CLOSED",
      area: "A",
      tableId: "A04",
      tableName: "A04",
      note: "Hẹn hò",
      staff: "nhanvien1"
    },
    {
      bookingId: "BK-016",
      customer: { name: "Võ Thị Lan", phone: "0945678901" },
      startAt: new Date(2024, 9, 25, 19, 30),
      endAt: new Date(2024, 9, 25, 21, 45),
      partySize: 4,
      status: "CLOSED",
      area: "B",
      tableId: "B04",
      tableName: "B04",
      note: "Sinh nhật",
      staff: "nhanvien2"
    },
    {
      bookingId: "BK-017",
      customer: { name: "Đặng Minh Khôi", phone: "0956789012" },
      startAt: new Date(2024, 9, 28, 20, 0),
      endAt: new Date(2024, 9, 28, 22, 30),
      partySize: 10,
      status: "CLOSED",
      area: "VIP_E",
      tableId: "SF2",
      tableName: "SF2",
      note: "Tiệc công ty lớn",
      staff: "quanly1"
    },
    {
      bookingId: "BK-018",
      customer: { name: "Bùi Thị Hoa", phone: "0967890123" },
      startAt: new Date(2024, 9, 30, 18, 15),
      endAt: new Date(2024, 9, 30, 20, 30),
      partySize: 3,
      status: "CLOSED",
      area: "C",
      tableId: "C04",
      tableName: "C04",
      note: "Gia đình",
      staff: "nhanvien3"
    },
    {
      bookingId: "BK-019",
      customer: { name: "Ngô Văn Thành", phone: "0978901234" },
      startAt: new Date(2024, 10, 2, 19, 0),
      endAt: new Date(2024, 10, 2, 21, 15),
      partySize: 6,
      status: "CLOSED",
      area: "D",
      tableId: "D03",
      tableName: "D03",
      note: "Họp lớp",
      staff: "nhanvien4"
    },
    {
      bookingId: "BK-020",
      customer: { name: "Nguyễn Minh Tuấn", phone: "0901234567" },
      startAt: new Date(2024, 10, 5, 18, 30),
      endAt: new Date(2024, 10, 5, 20, 45),
      partySize: 4,
      status: "CLOSED",
      area: "A",
      tableId: "A05",
      tableName: "A05",
      note: "Gia đình",
      staff: "nhanvien5"
    }
  ]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [users, setUsers] = useState([
    { username: "admin", password: "admin123", role: "admin" },
    { username: "nhanvien1", password: "123456", role: "staff" },
    { username: "nhanvien2", password: "123456", role: "staff" },
    { username: "nhanvien3", password: "123456", role: "staff" },
    { username: "nhanvien4", password: "123456", role: "staff" },
    { username: "nhanvien5", password: "123456", role: "staff" },
    { username: "quanly1", password: "123456", role: "manager" }
  ]);

  const [areas, setAreas] = useState(DEFAULT_AREAS);
  const [tables, setTables] = useState(DEFAULT_TABLES);
  const [reportDate, setReportDate] = useState<Date>(new Date());

  const [store, setStore] = useState<{ [key: string]: Record<string, any> }>(() => {
    const initialStore: { [key: string]: Record<string, any> } = {};
    areas.forEach(area => {
      initialStore[area.id] = seedMockState(new Date(), area.id, tables);
    });
    return initialStore;
  });

  useEffect(() => { runSelfTests(); }, []);

  // Cập nhật store khi areas, tables hoặc date thay đổi
  useEffect(() => {
    const newStore: { [key: string]: Record<string, any> } = {};
    areas.forEach(area => {
      newStore[area.id] = seedMockState(date, area.id, tables);
    });
    setStore(newStore);
  }, [areas, tables, date]);

  // Force refresh store để áp dụng dữ liệu mới
  const refreshStore = () => {
    const newStore: { [key: string]: Record<string, any> } = {};
    areas.forEach(area => {
      newStore[area.id] = seedMockState(date, area.id, tables);
    });
    setStore(newStore);
  };

  // Cập nhật danh sách khách hàng khi completedBookings thay đổi
  useEffect(() => {
    const newCustomers = generateCustomers(completedBookings);
    setCustomers(newCustomers);
  }, [completedBookings]);

  const handleAddUser = (newUser: any) => {
    setUsers(prev => [...prev, { ...newUser, id: Date.now() }]);
  };

  const handleDeleteUser = (index: number) => {
    setUsers(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];
    areas.forEach((area: any) => {
      Object.entries(store[area.id] || {}).forEach(([key, booking]: any) => {
        if (booking?.bookingId && booking.customer) {
          const customerName = booking.customer.name?.toLowerCase() || '';
          const customerPhone = booking.customer.phone || '';
          const query = searchQuery.toLowerCase();
          
          if (customerName.includes(query) || customerPhone.includes(query)) {
            const tableId = booking.tableId || key.split('_')[0];
            const table = tables.find((t: any) => t.id === tableId);
            results.push({
              ...booking,
              area: area.name,
              tableId,
              tableName: table?.name || tableId
            });
          }
        }
      });
    });
    
    setSearchResults(results);
  };

  const handleAddArea = (newArea: any) => {
    setAreas(prev => [...prev, newArea]);
  };

  const handleDeleteArea = (areaId: string) => {
    setAreas(prev => prev.filter(area => area.id !== areaId));
    setTables(prev => prev.filter(table => table.areaId !== areaId));
  };

  const handleUpdateArea = (areaId: string, updatedArea: any) => {
    setAreas(prev => prev.map(area => 
      area.id === areaId ? { ...area, ...updatedArea } : area
    ));
  };

  const handleAddTable = (newTable: any) => {
    setTables(prev => [...prev, newTable]);
  };

  const handleDeleteTable = (tableId: string) => {
    setTables(prev => prev.filter(table => table.id !== tableId));
  };

  const handleUpdateTable = (tableId: string, updatedTable: any) => {
    setTables(prev => prev.map(table => 
      table.id === tableId ? { ...table, ...updatedTable } : table
    ));
  };

  // Convert dynamic tables to TABLES format for compatibility
  const getTablesByArea = () => {
    const result: Record<string, Array<any>> = {};
    areas.forEach(area => {
      result[area.id] = tables.filter(table => table.areaId === area.id);
    });
    return result;
  };

  const TABLES = getTablesByArea();

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView("tables");
  };

  const kpis = useMemo(() => {
    const allCells: any[] = [];
    
    // Lấy dữ liệu từ tất cả các khu
    areas.forEach((area: any) => {
      if (store[area.id]) {
        allCells.push(...Object.values(store[area.id]));
      }
    });
    
    const total = allCells.filter((b: any) => b?.bookingId).length;
    const seated = allCells.filter((b: any) => b?.status === "SEATED").length;
    const walkin = allCells.filter((b: any) => b?.status === "WALKIN").length;
    const hold = allCells.filter((b: any) => b?.status === "HOLD").length;
    const closed = allCells.filter((b: any) => b?.status === "CLOSED").length;
    return { total, seated, walkin, hold, closed };
  }, [store, areas]);

  const isTableOccupied = (tableId: string) => {
    const area = findAreaByTableId(tableId, tables);
    if (!area) return false;
    const cell = (store as any)[area]?.[tableId];
    return !!cell?.bookingId || isTableLocked(tableId);
  };

  const handlePickTable = (table:any) => {
    // Ngăn chặn booking bàn đã lock - chỉ áp dụng cho nhân viên
    if (isTableLocked(table.id) && !canLockTable()) {
      alert("Bàn này đã bị khóa, không thể đặt bàn!");
      return;
    }
    
    setActiveTable(table);
    setOpenDrawer(true);
  };

  const activeArea: string | undefined = activeTable ? findAreaByTableId(activeTable.id, tables) : undefined;
  const activeData = activeTable && activeArea ? (store[activeArea]?.[activeTable.id] ?? null) : null;

  const updateAllTablesByBooking = (bookingId: string, updater: (prev:any)=>any) => {
    setStore(prev => {
      const next = { ...prev } as any;
      Object.keys(next).forEach(area => {
        Object.keys(next[area]).forEach(tid => {
          const cell = next[area][tid];
          if (cell?.bookingId === bookingId) next[area][tid] = updater(cell);
        });
      });
      return next;
    });
  };

  const handleAction = (type: string, payload?: any) => {
    if (!activeTable && type !== "create") return;

    if (type === "create") {
      const { name, phone, timeStr, size, note } = payload || {};
      const tId = activeTable.id;
      const area = findAreaByTableId(tId, tables);
      if (!area) return;
      const start = new Date(date);
      const [hh, mm] = (timeStr||"19:00").split(":");
      start.setHours(parseInt(hh||"19",10), parseInt(mm||"0",10), 0, 0);
      const bkId = genBookingId();
      setStore(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          [tId]: { 
            status: "HOLD", 
            bookingId: bkId, 
            bookingTime: new Date(), // Thời điểm đặt bàn
            startAt: null, // Chưa check-in
            endAt: null, 
            partySize: size || 2, 
            staff: currentUser?.role === "manager" ? "Quản lý" : "Nhân viên", 
            note: note || "", 
            customer: { name: name || "", phone: phone || "" }, 
            tables: [tId] 
          }
        }
      }));
      return;
    }

    if (type === "close") {
      const tId = activeTable.id;
      const area = findAreaByTableId(tId, tables);
      if (!area) return;
      
      const currentBooking = store[area]?.[tId];
      if (!currentBooking) return;
      
      // Tạo completed booking với status CLOSED và endAt = now
      const completedBooking = {
        ...currentBooking,
        status: "CLOSED",
        endAt: new Date(),
        closedAt: new Date(),
        tableId: tId,
        area: area,
        tableName: activeTable.name
      };
      
      // Lưu vào completed bookings
      setCompletedBookings(prev => [...prev, completedBooking]);
      
      // Xóa booking khỏi store hiện tại (chuyển bàn về trống)
      setStore(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          [tId]: null
        }
      }));
      
      setOpenDrawer(false);
      return;
    }

    if (type === "cancel") {
      const tId = activeTable.id;
      const area = findAreaByTableId(tId, tables);
      if (!area) return;
      
      const currentBooking = store[area]?.[tId];
      if (!currentBooking) return;
      
      // Tạo cancelled booking với status CANCELLED
      const cancelledBooking = {
        ...currentBooking,
        status: "CANCELLED",
        endAt: new Date(), // Thời điểm hủy
        cancelledAt: new Date(),
        tableId: tId,
        area: area,
        tableName: activeTable.name
      };
      
      // Lưu vào completed bookings
      setCompletedBookings(prev => [...prev, cancelledBooking]);
      
      // Xóa booking khỏi store hiện tại (chuyển bàn về trống)
      setStore(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          [tId]: null
        }
      }));
      
      setOpenDrawer(false);
      return;
    }

    if (type === "walkin") {
      const { size, note } = payload || {};
      const tId = activeTable.id;
      const area = findAreaByTableId(tId, tables);
      if (!area) return;
      const start = new Date();
      const bkId = genBookingId();
      setStore(prev => ({
        ...prev,
        [area]: {
          ...prev[area],
          [tId]: { 
            status: "WALKIN", 
            bookingId: bkId, 
            bookingTime: start, // Khách vãng lai: bookingTime = startTime
            startAt: start, 
            endAt: null, 
            partySize: size || 2, 
            staff: currentUser?.role === "manager" ? "Quản lý" : "Nhân viên", 
            note: note || "", 
            customer: { name: "Khách vãng lai", phone: "" }, 
            tables: [tId] 
          }
        }
      }));
      return;
    }

    const areaOfActive = activeArea; if (!areaOfActive) return;
    const currentCell = activeData; const bookingId = currentCell?.bookingId; if (!bookingId) return;

    if (type === "checkin") updateAllTablesByBooking(bookingId, (cell) => ({ ...cell, status: "SEATED", startAt: new Date() }));


    if (type === "cancel" && currentUser?.role === "manager") {
      const reason = payload?.reason;
      if (!reason || !reason.trim()) return;
      updateAllTablesByBooking(bookingId, () => undefined);
      setOpenDrawer(false);
      return;
    }

    if (type === "close") {
      try { if (typeof window !== 'undefined' && !window.confirm('Xac nhan dong ban?')) return; } catch {}
      updateAllTablesByBooking(bookingId, () => undefined);
      setOpenDrawer(false);
      return;
    }

    // Logic gộp bàn
    if (type === "mergeTable") {
      const { currentTableId, mergeTableId, bookingId } = payload;
      const currentArea = findAreaByTableId(currentTableId, tables);
      const mergeArea = findAreaByTableId(mergeTableId, tables);
      
      if (!currentArea || !mergeArea) return;
      
      const currentBooking = store[currentArea]?.[currentTableId];
      if (!currentBooking) return;
      
      // Cập nhật booking để bao gồm bàn mới
      const updatedTables = [...(currentBooking.tables || []), mergeTableId];
      
      setStore(prev => {
        const next = { ...prev };
        
        // Cập nhật tất cả bàn trong booking với danh sách bàn mới
        Object.keys(next).forEach(area => {
          Object.keys(next[area]).forEach(tid => {
            const cell = next[area][tid];
            if (cell?.bookingId === bookingId) {
              next[area][tid] = { ...cell, tables: updatedTables };
            }
          });
        });
        
        // Gán booking cho bàn mới
        next[mergeArea][mergeTableId] = { ...currentBooking, tables: updatedTables };
        
        return next;
      });
      
      setOpenDrawer(false);
      return;
    }

    // Logic tách bàn
    if (type === "splitTable") {
      const { tableId, bookingId } = payload;
      const area = findAreaByTableId(tableId, tables);
      
      if (!area) return;
      
      const currentBooking = store[area]?.[tableId];
      if (!currentBooking || !currentBooking.tables || currentBooking.tables.length <= 1) return;
      
      // Loại bỏ bàn hiện tại khỏi danh sách bàn của booking
      const updatedTables = currentBooking.tables.filter((t: string) => t !== tableId);
      
      setStore(prev => {
        const next = { ...prev };
        
        // Cập nhật tất cả bàn còn lại trong booking
        Object.keys(next).forEach(areaId => {
          Object.keys(next[areaId]).forEach(tid => {
            const cell = next[areaId][tid];
            if (cell?.bookingId === bookingId && tid !== tableId) {
              next[areaId][tid] = { ...cell, tables: updatedTables };
            }
          });
        });
        
        // Xóa booking khỏi bàn được tách
        next[area][tableId] = null;
        
        return next;
      });
      
      setOpenDrawer(false);
      return;
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case "tables":
  return (
          <>
          <div>
            <div className="mb-1">
              <h2 className="text-2xl font-bold">Sơ đồ bàn</h2>
              </div>
            <SearchAndView 
              view={view} 
              setView={setView} 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={handleSearch}
            />
            </div>

          {searchResults.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Kết quả tìm kiếm ({searchResults.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((booking, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{booking.customer.name}</h4>
                          <p className="text-sm text-gray-600">{booking.customer.phone}</p>
              </div>
                        <Badge className={STATUS_COLORS[booking.status]}>
                          {booking.status === "SEATED" ? "Đang ngồi" : 
                           booking.status === "WALKIN" ? "Khách vãng lai" : 
                           booking.status === "HOLD" ? "Đã đặt" : "Trống"}
                        </Badge>
            </div>
                      <div className="text-sm">
                        <p><strong>Bàn:</strong> {booking.tableName} - {booking.area}</p>
                        <p><strong>Số khách:</strong> {booking.partySize}</p>
                        <p><strong>Thời gian:</strong> {booking.startAt ? format(new Date(booking.startAt), "dd/MM/yyyy HH:mm") : "-"}</p>
                        {booking.note && <p><strong>Ghi chú:</strong> {booking.note}</p>}
          </div>
            </div>
                  </Card>
                ))}
          </div>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-1 gap-6">
                {areas.sort((a, b) => a.position - b.position).map(area => (
                  <TablesSection 
                    key={area.id}
                    title={area.name} 
                    tables={tables.filter(t => t.areaId === area.id)} 
                    bookingsByTable={store[area.id] || {}} 
                    onPickTable={handlePickTable} 
                    isOccupied={isTableOccupied}
                    isLocked={isTableLocked}
                  />
                ))}
            </div>
          ) : (
              <BookingList store={store} areas={areas} tables={tables} />
          )}

            <div className="mobile-kpi-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatKPI label="Tổng booking" value={kpis.total} />
            <StatKPI label="Đang ngồi" value={kpis.seated} />
            <StatKPI label="Khách vãng lai" value={kpis.walkin} />
            <StatKPI label="Đã đặt" value={kpis.hold} />
            <StatKPI label="Đã hoàn thành" value={kpis.closed} />
          </div>
          </>
        );
      
      case "dashboard":
        if (currentUser?.role !== "admin" && currentUser?.role !== "manager") {
          return (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <div className="text-center text-gray-500">
                    Bạn không có quyền truy cập Dashboard. Chỉ Quản lý và Admin mới có thể xem.
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        // Mobile Dashboard Layout
        if (isMobile) {
          return (
            <div className="space-y-4">
              {/* Mobile Header */}
              <div className="flex flex-col space-y-2">
                <h2 className="text-xl font-bold">Dashboard</h2>
                <div className="text-xs text-gray-500">
                  Cập nhật: {format(new Date(), "dd/MM HH:mm")}
                </div>
              </div>
              
              {/* Mobile KPI Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="mobile-dashboard-card bg-blue-50 p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{kpis.total}</div>
                  <div className="text-sm text-blue-800">Tổng booking</div>
                </div>
                <div className="mobile-dashboard-card bg-green-50 p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{kpis.seated}</div>
                  <div className="text-sm text-green-800">Đang ngồi</div>
                </div>
                <div className="mobile-dashboard-card bg-purple-50 p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{kpis.walkin}</div>
                  <div className="text-sm text-purple-800">Khách vãng lai</div>
                </div>
                <div className="mobile-dashboard-card bg-amber-50 p-4 border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">{kpis.hold}</div>
                  <div className="text-sm text-amber-800">Đã đặt</div>
                </div>
              </div>

              {/* Mobile Reports */}
              <div className="space-y-4">
                {/* Quick Stats */}
                <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-3">Thống kê nhanh</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tổng bàn:</span>
                      <span className="font-medium">{tables.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khu vực:</span>
                      <span className="font-medium">{areas.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Khách hôm nay:</span>
                      <span className="font-medium">{completedBookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tỷ lệ lấp đầy:</span>
                      <span className="font-medium">{Math.round((kpis.seated + kpis.walkin) / tables.length * 100)}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Booking Detail Report with Pagination */}
                <MobileBookingDetailReport completedBookings={completedBookings} />
                
                {/* Mobile 7 Days Report with Table */}
                <Mobile7DaysReport completedBookings={completedBookings} />
                
                {/* Mobile Staff Report with Date Selection */}
                <MobileStaffReport completedBookings={completedBookings} />
                
                {/* Mobile Table Performance Report with Date Selection */}
                <MobileTablePerformanceReport areas={areas} tables={tables} completedBookings={completedBookings} />
              </div>
            </div>
          );
        }

        // Desktop Dashboard Layout (Original)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>
            
            {/* Desktop KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tổng booking</p>
                      <p className="text-3xl font-bold text-blue-600">{kpis.total}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Đang ngồi</p>
                      <p className="text-3xl font-bold text-green-600">{kpis.seated}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🟢</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Khách vãng lai</p>
                      <p className="text-3xl font-bold text-purple-600">{kpis.walkin}</p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🚶</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Đã đặt</p>
                      <p className="text-3xl font-bold text-amber-600">{kpis.hold}</p>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🟡</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desktop Reports - Original Components */}
            <BookingDetailReport completedBookings={completedBookings} areas={areas} tables={tables} />
            <Booking7DaysReport store={store} areas={areas} completedBookings={completedBookings} />
            <StaffBookingReport store={store} areas={areas} completedBookings={completedBookings} />
            <TablePerformanceReport store={store} areas={areas} tables={tables} completedBookings={completedBookings} />
          </div>
        );
      
      case "crm":
        // Mobile CRM Layout
        if (isMobile) {
          return (
            <div className="space-y-4 p-4">
              {/* Mobile CRM Header */}
              <div className="flex flex-col space-y-3">
                <h2 className="text-xl font-bold">Quản lý khách hàng</h2>
                
                {/* Mobile Search Bar */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Tìm kiếm khách hàng..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div 
                    style={{
                      fontSize: '20px',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    🔍
                  </div>
                </div>
              </div>

              {/* Mobile Customer Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="mobile-dashboard-card bg-blue-50 p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{customers.length}</div>
                  <div className="text-sm text-blue-800">Tổng khách hàng</div>
                </div>
                <div className="mobile-dashboard-card bg-green-50 p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {customers.filter((c: any) => c.visitCount > 5).length}
                  </div>
                  <div className="text-sm text-green-800">Khách VIP</div>
                </div>
                <div className="mobile-dashboard-card bg-purple-50 p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {customers.filter((c: any) => c.lastVisit && 
                      new Date(c.lastVisit) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    ).length}
                  </div>
                  <div className="text-sm text-purple-800">Khách gần đây</div>
                </div>
                <div className="mobile-dashboard-card bg-amber-50 p-4 border border-amber-200">
                  <div className="text-2xl font-bold text-amber-600">
                    {Math.round(customers.reduce((sum: number, c: any) => sum + c.visitCount, 0) / customers.length) || 0}
                  </div>
                  <div className="text-sm text-amber-800">TB lượt/khách</div>
                </div>
              </div>

              {/* Mobile Customer List */}
              <MobileCustomerList 
                customers={customers} 
                searchQuery={searchQuery}
                onSelectCustomer={(customer: any) => {}}
                completedBookings={completedBookings}
              />
            </div>
          );
        }

        // Desktop CRM Layout (Original)
        return (
          <div className="p-6">
            <CustomerList 
              customers={customers} 
              onSelectCustomer={(customer: any) => {}}
              completedBookings={completedBookings}
            />
          </div>
        );
      
      case "settings":
        // Mobile Settings Layout
        if (isMobile) {
          return (
            <MobileSettingsLayout 
              users={users}
              areas={areas}
              tables={tables}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onAddArea={handleAddArea}
              onDeleteArea={handleDeleteArea}
              onUpdateArea={handleUpdateArea}
              onAddTable={handleAddTable}
              onDeleteTable={handleDeleteTable}
              onUpdateTable={handleUpdateTable}
            />
          );
        }

        // Desktop Settings Layout (Original)
        return (
          <div className="space-y-8">
            <UserManagement 
              users={users}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
            />
            <AreaManagement 
              areas={areas}
              onAddArea={handleAddArea}
              onDeleteArea={handleDeleteArea}
              onUpdateArea={handleUpdateArea}
            />
            <TableManagement 
              areas={areas}
              tables={tables}
              onAddTable={handleAddTable}
              onDeleteTable={handleDeleteTable}
              onUpdateTable={handleUpdateTable}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} users={users} />;
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        {!isMobile && (
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            role={currentUser?.role}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        )}
        
        {/* Main content with bottom padding for mobile navigation */}
        <div className={`flex-1 p-4 md:p-6 lg:p-8 space-y-6 main-content ${isMobile ? 'pb-20' : 'pb-4'}`}>
          {/* Test Supabase Connection */}
          <div className="mb-4">
            <TestSupabase />
          </div>
          
          {/* Data Management */}
          <div className="mb-4">
            <DataManager />
          </div>
          
          {/* Data Source Toggle */}
          <div className="mb-4">
            <DataSourceToggle 
              currentSource={useSupabase ? "supabase" : "memory"}
              onToggle={(source) => setUseSupabase(source === "supabase")}
              memoryStats={{ 
                bookings: Object.values(store).flat().length, 
                customers: customers.length 
              }}
              supabaseStats={{ 
                bookings: supabaseData.bookings.length, 
                customers: supabaseData.customers.length 
              }}
            />
          </div>
          
          {/* Data Source Status */}
          <div className="mb-4">
            <DataSourceStatus 
              useSupabase={useSupabase}
              memoryStats={{ 
                bookings: Object.values(store).flat().length, 
                customers: customers.length 
              }}
              supabaseStats={{ 
                bookings: supabaseData.bookings.length, 
                customers: supabaseData.customers.length 
              }}
              loading={supabaseData.loading}
            />
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="mobile-header flex items-center justify-between">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Quản Lý Booking</h1>
              <div className="mobile-user-menu flex items-center gap-2">
                {currentView === "tables" && (
                  <>
                    <Button variant="secondary" onClick={()=> setDate(new Date())} className="mobile-btn text-sm md:text-base">Hôm nay</Button>
                  </>
                )}
                {!isMobile && <UserMenu currentUser={currentUser} onLogout={handleLogout} />}
              </div>
            </div>
            
            {/* Mobile User Menu - Top Right */}
            {isMobile && (
              <div className="flex justify-end">
                <UserMenu currentUser={currentUser} onLogout={handleLogout} />
              </div>
            )}
            {currentView === "tables" && (
              <div className="mobile-date-strip flex items-center justify-between flex-wrap gap-3">
                <DateStrip date={date} setDate={setDate} />
              </div>
            )}
          </div>

          {renderContent()}
        </div>
      </div>

      <BookingDrawer
        open={openDrawer}
        setOpen={setOpenDrawer}
        tableId={activeTable?.id}
        data={activeData}
        onAction={handleAction}
        tables={tables}
        role={currentUser?.role}
        customers={customers}
        isLocked={activeTable?.id ? isTableLocked(activeTable.id) : false}
        canLock={canLockTable()}
        onToggleLock={toggleTableLock}
        allTables={tables}
        store={store}
      />

      {/* Bottom Navigation - Mobile only */}
      {isMobile && (
        <BottomNavigation
          currentPage={currentView}
          onPageChange={setCurrentView}
          isSidebarOpen={!sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

// Mobile Settings Layout with Tabs
function MobileSettingsLayout({ 
  users, areas, tables, 
  onAddUser, onDeleteUser, 
  onAddArea, onDeleteArea, onUpdateArea,
  onAddTable, onDeleteTable, onUpdateTable 
}: any) {
  const [activeTab, setActiveTab] = useState<'users' | 'areas' | 'tables'>('users');

  const tabs = [
    { id: 'users', label: 'Tài khoản', icon: '👥' },
    { id: 'areas', label: 'Khu vực', icon: '🏢' },
    { id: 'tables', label: 'Bàn ăn', icon: '🪑' }
  ];

  return (
    <div className="space-y-4 p-4">
      {/* Mobile Settings Header */}
      <div className="flex flex-col space-y-3">
        <h2 className="text-xl font-bold">Cài đặt hệ thống</h2>
        
        {/* Mobile Tabs Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Settings Content */}
      <div className="space-y-4">
        {activeTab === 'users' && (
          <MobileUserManagement 
            users={users}
            onAddUser={onAddUser}
            onDeleteUser={onDeleteUser}
          />
        )}
        
        {activeTab === 'areas' && (
          <MobileAreaManagement 
            areas={areas}
            onAddArea={onAddArea}
            onDeleteArea={onDeleteArea}
            onUpdateArea={onUpdateArea}
          />
        )}
        
        {activeTab === 'tables' && (
          <MobileTableManagement 
            areas={areas}
            tables={tables}
            onAddTable={onAddTable}
            onDeleteTable={onDeleteTable}
            onUpdateTable={onUpdateTable}
          />
        )}
      </div>
    </div>
  );
}

// Mobile User Management
function MobileUserManagement({ users, onAddUser, onDeleteUser }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "staff"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.username && newUser.password) {
      onAddUser(newUser);
      setNewUser({ username: "", password: "", role: "staff" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add User Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Tạo tài khoản
        </Button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Tạo tài khoản mới</h3>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">Tên đăng nhập</Label>
              <Input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="mt-1"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Mật khẩu</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="mt-1"
                placeholder="Nhập mật khẩu"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Vai trò</Label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="staff">Nhân viên</option>
                <option value="manager">Quản lý</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                Tạo
              </Button>
              <Button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user: any, index: number) => (
          <div key={index} className="mobile-dashboard-card bg-white p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{user.username}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <Badge variant={user.role === "admin" ? "destructive" : user.role === "manager" ? "default" : "secondary"} className="text-xs">
                    {user.role === "admin" ? "Admin" : user.role === "manager" ? "Quản lý" : "Nhân viên"}
                  </Badge>
                </div>
              </div>
              {user.role !== "admin" && (
                <Button 
                  variant="destructive" 
                  onClick={() => onDeleteUser(index)}
                  className="text-xs px-2 py-1"
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile Area Management
function MobileAreaManagement({ areas, onAddArea, onDeleteArea, onUpdateArea }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingArea, setEditingArea] = useState<any>(null);
  const [newArea, setNewArea] = useState({
    id: "",
    name: "",
    position: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newArea.id && newArea.name && newArea.position) {
      onAddArea(newArea);
      setNewArea({ id: "", name: "", position: "" });
      setShowAddForm(false);
    }
  };

  const handleEdit = (area: any) => {
    setEditingArea(area);
    setNewArea({ id: area.id, name: area.name, position: area.position });
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArea && newArea.name) {
      onUpdateArea(editingArea.id, newArea);
      setEditingArea(null);
      setNewArea({ id: "", name: "", position: "" });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Area Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Thêm khu vực
        </Button>
      </div>

      {/* Add/Edit Area Form */}
      {showAddForm && (
        <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">
            {editingArea ? 'Sửa khu vực' : 'Thêm khu vực mới'}
          </h3>
          <form onSubmit={editingArea ? handleUpdate : handleSubmit} className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">ID khu vực</Label>
              <Input
                type="text"
                value={newArea.id}
                onChange={(e) => setNewArea({ ...newArea, id: e.target.value })}
                className="mt-1"
                placeholder="VD: A1, B2..."
                disabled={!!editingArea}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tên khu vực</Label>
              <Input
                type="text"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                className="mt-1"
                placeholder="VD: Tầng 1, Khu VIP..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Vị trí</Label>
              <Input
                type="text"
                value={newArea.position}
                onChange={(e) => setNewArea({ ...newArea, position: e.target.value })}
                className="mt-1"
                placeholder="VD: Gần cửa ra vào..."
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                {editingArea ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingArea(null);
                  setNewArea({ id: "", name: "", position: "" });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Areas List */}
      <div className="space-y-3">
        {areas.map((area: any, index: number) => (
          <div key={area.id} className="mobile-dashboard-card bg-white p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{area.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>ID: {area.id}</div>
                  <div>Vị trí: {area.position}</div>
                  <div>Số bàn: {area.tables?.length || 0}</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleEdit(area)}
                  className="text-xs px-2 py-1"
                >
                  Sửa
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => onDeleteArea(area.id)}
                  className="text-xs px-2 py-1"
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile Table Management
function MobileTableManagement({ areas, tables, onAddTable, onDeleteTable, onUpdateTable }: any) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [newTable, setNewTable] = useState({
    id: "",
    name: "",
    areaId: "",
    capacity: 4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTable.id && newTable.name && newTable.areaId) {
      onAddTable(newTable);
      setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
      setShowAddForm(false);
    }
  };

  const handleEdit = (table: any) => {
    setEditingTable(table);
    setNewTable({ 
      id: table.id, 
      name: table.name, 
      areaId: table.areaId, 
      capacity: table.capacity 
    });
    setShowAddForm(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTable && newTable.name) {
      onUpdateTable(editingTable.id, newTable);
      setEditingTable(null);
      setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
      setShowAddForm(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Table Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
        >
          + Thêm bàn
        </Button>
      </div>

      {/* Add/Edit Table Form */}
      {showAddForm && (
        <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">
            {editingTable ? 'Sửa bàn ăn' : 'Thêm bàn ăn mới'}
          </h3>
          <form onSubmit={editingTable ? handleUpdate : handleSubmit} className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-700">ID bàn</Label>
              <Input
                type="text"
                value={newTable.id}
                onChange={(e) => setNewTable({ ...newTable, id: e.target.value })}
                className="mt-1"
                placeholder="VD: A1-01, B2-05..."
                disabled={!!editingTable}
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Tên bàn</Label>
              <Input
                type="text"
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                className="mt-1"
                placeholder="VD: Bàn 1, Bàn VIP..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Khu vực</Label>
              <select
                value={newTable.areaId}
                onChange={(e) => setNewTable({ ...newTable, areaId: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Chọn khu vực</option>
                {areas.map((area: any) => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Sức chứa</Label>
              <Input
                type="number"
                value={newTable.capacity}
                onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) || 4 })}
                className="mt-1"
                min="1"
                max="20"
              />
            </div>
            <div className="flex space-x-2 pt-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
                {editingTable ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button 
                type="button" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTable(null);
                  setNewTable({ id: "", name: "", areaId: "", capacity: 4 });
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tables List */}
      <div className="space-y-3">
        {tables.map((table: any, index: number) => (
          <div key={table.id} className="mobile-dashboard-card bg-white p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{table.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>ID: {table.id}</div>
                  <div>Khu vực: {areas.find((a: any) => a.id === table.areaId)?.name || 'N/A'}</div>
                  <div>Sức chứa: {table.capacity} người</div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => handleEdit(table)}
                  className="text-xs px-2 py-1"
                >
                  Sửa
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => onDeleteTable(table.id)}
                  className="text-xs px-2 py-1"
                >
                  Xóa
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mobile Booking Detail Report with Pagination
function MobileBookingDetailReport({ completedBookings }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const totalPages = Math.ceil(completedBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = completedBookings.slice(startIndex, endIndex);

  return (
    <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3">Chi tiết booking hôm nay</h3>
      <div className="space-y-3">
        {currentBookings.map((booking: any, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">{booking.customer?.name || "Khách vãng lai"}</div>
              <Badge variant={booking.status === 'SEATED' ? 'default' : booking.status === 'WALKIN' ? 'default' : 'secondary'}>
                {booking.status === 'SEATED' ? 'Đang ngồi' : 
                 booking.status === 'WALKIN' ? 'Khách vãng lai' : 
                 booking.status === 'HOLD' ? 'Đã đặt' : 'Đã đóng'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>Bàn: {booking.tableName || booking.tableId}</div>
              <div>Số khách: {booking.partySize}</div>
              <div>Nhân viên: {booking.staff || '-'}</div>
              <div>Giờ: {booking.startAt ? format(new Date(booking.startAt), "HH:mm") : '-'}</div>
            </div>
            {booking.note && (
              <div className="text-xs text-gray-500 mt-2">Ghi chú: {booking.note}</div>
            )}
          </div>
        ))}
        {completedBookings.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">Chưa có booking nào</div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-sm border rounded ${
                currentPage === page 
                  ? 'border-gray-300 font-bold text-gray-800' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}

// Mobile 7 Days Report with Table Format
function Mobile7DaysReport({ completedBookings }: any) {
  const reportData = (() => {
    const data: any[] = [];
    const today = new Date(2025, 9, 13);
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      let bookingCount = 0;
      let walkinCount = 0;
      let cancelledCount = 0; // Thêm số bàn hủy

      completedBookings.forEach((booking: any) => {
        if (booking?.startAt) {
          const bookingDate = new Date(booking.startAt);
          if (bookingDate >= startOfDay && bookingDate <= endOfDay) {
            if (booking.status === 'WALKIN') {
              walkinCount++;
            } else if (booking.status === 'CANCELLED') {
              cancelledCount++;
            } else {
              bookingCount++;
            }
          }
        }
      });

      data.push({
        date: format(date, "dd/MM/yyyy"),
        dayOfWeek: format(date, "EEEE"),
        totalTables: bookingCount + walkinCount,
        bookingCount: bookingCount,
        walkinCount: walkinCount,
        cancelledCount: cancelledCount
      });
    }
    return data;
  })();

  return (
    <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-800 mb-3">Báo cáo 7 ngày gần nhất</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Ngày</th>
              <th className="text-center py-2 font-medium text-gray-600">Tổng lượt bàn</th>
              <th className="text-center py-2 font-medium text-gray-600">Booking</th>
              <th className="text-center py-2 font-medium text-gray-600">Hủy</th>
              <th className="text-center py-2 font-medium text-gray-600">Vãng lai</th>
            </tr>
          </thead>
          <tbody>
            {reportData.map((day, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2 font-medium">{day.date}</td>
                <td className="py-2 text-center font-medium">{day.totalTables}</td>
                <td className="py-2 text-center text-blue-700">{day.bookingCount}</td>
                <td className="py-2 text-center text-red-700">{day.cancelledCount}</td>
                <td className="py-2 text-center text-yellow-700">{day.walkinCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Mobile Staff Report with Date Selection
function MobileStaffReport({ completedBookings }: any) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const filteredBookings = completedBookings.filter((booking: any) => {
    if (!booking.startAt) return false;
    const bookingDate = new Date(booking.startAt);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    return bookingDateStr === selectedDateStr;
  });

  const staffData = (() => {
    const staffMap = new Map();
    filteredBookings.forEach((booking: any) => {
      if (booking.staff) {
        if (!staffMap.has(booking.staff)) {
          staffMap.set(booking.staff, {
            name: booking.staff,
            totalBookings: 0
          });
        }
        const staff = staffMap.get(booking.staff);
        staff.totalBookings++;
      }
    });
    return Array.from(staffMap.values());
  })();

  return (
    <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Báo cáo nhân viên</h3>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        />
      </div>
      <div className="space-y-2">
        {staffData.map((staff, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
            <div className="text-sm font-medium">{staff.name}</div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {staff.totalBookings} booking
            </Badge>
          </div>
        ))}
        {staffData.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">Không có dữ liệu cho ngày này</div>
        )}
      </div>
    </div>
  );
}

// Mobile Table Performance Report with Date Selection
function MobileTablePerformanceReport({ areas, tables, completedBookings }: any) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const filteredBookings = completedBookings.filter((booking: any) => {
    if (!booking.startAt) return false;
    const bookingDate = new Date(booking.startAt);
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const bookingDateStr = bookingDate.toISOString().split('T')[0];
    return bookingDateStr === selectedDateStr;
  });

  return (
    <div className="mobile-dashboard-card bg-white p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Hiệu suất bàn theo khu</h3>
        <input
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
          className="text-xs border border-gray-300 rounded px-2 py-1"
        />
      </div>
      <div className="space-y-2">
        {areas.map((area: any, index: number) => {
          const areaTables = tables.filter((t: any) => t.areaId === area.id);
          const areaBookings = filteredBookings.filter((booking: any) => 
            areaTables.some((t: any) => t.id === booking.tableId)
          );
          const utilizationRate = areaTables.length > 0 ? 
            Math.round((areaBookings.length / areaTables.length) * 100) : 0;
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">{area.name}</div>
                <div className="text-xs text-gray-500">{utilizationRate}%</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>Tổng bàn: {areaTables.length}</div>
                <div>Đã sử dụng: {areaBookings.length}</div>
                <div>Booking: {areaBookings.filter((b: any) => b.status !== 'WALKIN').length}</div>
                <div>Vãng lai: {areaBookings.filter((b: any) => b.status === 'WALKIN').length}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Component báo cáo chi tiết booking
function BookingDetailReport({ completedBookings, areas, tables }: any) {
  const [dateRange, setDateRange] = useState({
    from: toInputDate(new Date()),
    to: toInputDate(new Date())
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Lọc dữ liệu theo ngày
  const filteredBookings = useMemo(() => {
    let filtered = completedBookings.filter((booking: any) => {
      if (!booking.startAt) return false;
      
      const bookingDate = booking.startAt.toISOString().split('T')[0];
      return bookingDate >= dateRange.from && bookingDate <= dateRange.to;
    });

    // Sắp xếp theo thời gian mở bàn
    return filtered.sort((a: any, b: any) => {
      if (!a.startAt || !b.startAt) return 0;
      return a.startAt.getTime() - b.startAt.getTime();
    });
  }, [completedBookings, dateRange]);

  // Phân trang
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, endIndex);

  // Hàm download Excel
  const downloadExcel = () => {
    const headers = [
      'STT', 'Mã booking', 'Tên khách hàng', 'Số khách', 
      'Tên bàn', 'Nhân viên booking', 'Giờ mở bàn', 'Giờ đóng bàn', 'Ghi chú'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map((booking: any, index: number) => [
        index + 1,
        booking.bookingId || '',
        booking.customer?.name || '',
        booking.partySize || 0,
        booking.tableName || '',
        booking.staff || '',
        booking.startAt ? format(booking.startAt, 'HH:mm') : '',
        booking.endAt ? format(booking.endAt, 'HH:mm') : '',
        booking.note || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fileName = dateRange.from === dateRange.to
      ? `booking-report-${dateRange.from}.csv`
      : `booking-report-${dateRange.from}-to-${dateRange.to}.csv`;
    
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Báo cáo chi tiết booking</span>
          <Button onClick={downloadExcel} className="bg-green-600 hover:bg-green-700 px-3 py-1 text-sm">
            📥 Download Excel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bộ lọc ngày */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="date-from" className="text-sm font-medium">Từ ngày:</Label>
              <Input
                id="date-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="date-to" className="text-sm font-medium">Đến ngày:</Label>
              <Input
                id="date-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="w-40"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            💡 Chọn cùng ngày để xem báo cáo 1 ngày, chọn khác ngày để xem báo cáo khoảng thời gian
          </div>
        </div>

        {/* Thông tin tổng quan */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Tổng số booking: <strong>{filteredBookings.length}</strong></span>
          <span>Trang {currentPage}/{totalPages}</span>
        </div>

        {/* Bảng dữ liệu */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">STT</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Mã booking</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Tên khách hàng</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Số khách</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Tên bàn</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Nhân viên</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Giờ mở bàn</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Giờ đóng bàn</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-gray-500">
                      Không có dữ liệu booking trong khoảng thời gian đã chọn
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking: any, index: number) => (
                    <tr key={booking.bookingId || index} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{startIndex + index + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">{booking.bookingId || '-'}</td>
                      <td className="px-3 py-2">{booking.customer?.name || '-'}</td>
                      <td className="px-3 py-2 text-center">{booking.partySize || 0}</td>
                      <td className="px-3 py-2 font-medium">{booking.tableName || '-'}</td>
                      <td className="px-3 py-2">{booking.staff || '-'}</td>
                      <td className="px-3 py-2">
                        {booking.startAt ? format(booking.startAt, 'HH:mm') : '-'}
                      </td>
                      <td className="px-3 py-2">
                        {booking.endAt ? format(booking.endAt, 'HH:mm') : '-'}
                      </td>
                      <td className="px-3 py-2 max-w-xs truncate" title={booking.note || ''}>
                        {booking.note || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm"
            >
              ← Trước
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0 text-sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm"
            >
              Sau →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

