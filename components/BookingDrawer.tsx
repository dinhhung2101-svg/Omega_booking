import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';

const canCloseBooking = (role: "staff"|"manager", status: string) => status === "SEATED";

function CustomerCard({ customer }: any) {
  if (!customer) return null;
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="p-0 pb-2"><CardTitle className="text-base flex items-center gap-2">Khách hàng</CardTitle></CardHeader>
      <CardContent className="p-0 space-y-2 text-sm">
        <div>Tên: {customer.name}</div>
        <div>Điện thoại: {customer.phone}</div>
        <div>Lần đến: {customer.visits ?? 0} • Lần gần nhất: {customer.lastVisit ?? "-"}</div>
      </CardContent>
    </Card>
  );
}

function CustomerSearch({ customers, onSelect, onClose, show }: any) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = customers.filter((c: any) => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.phone?.includes(query)
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, customers]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tìm khách hàng</h3>
        <Input
          placeholder="Nhập tên hoặc số điện thoại..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-4"
        />
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {results.map((customer, index) => (
            <div
              key={index}
              className="p-3 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => {
                onSelect(customer);
                onClose();
              }}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-gray-600">{customer.phone}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1 mobile-btn">Đóng</Button>
        </div>
      </div>
    </div>
  );
}

export function BookingDrawer({ open, setOpen, tableId, data, onAction, role, tables, customers, isLocked, canLock, onToggleLock, allTables, store }: any) {
  const table = tables?.find((t: any) => t.id === tableId);
  const tableName = table?.name || tableId;
  const title = data?.bookingId ? `Booking #${data.bookingId}` : `Bàn ${tableName} - Trống`;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [timeStr, setTimeStr] = useState("19:00");
  const [size, setSize] = useState(2);
  const [note, setNote] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showMergeTable, setShowMergeTable] = useState(false);
  const [selectedMergeTable, setSelectedMergeTable] = useState("");
  const [mergeTableSearch, setMergeTableSearch] = useState("");


  useEffect(() => {
    if (data?.customer) {
      setName(data.customer.name || "");
      setPhone(data.customer.phone || "");
    }
    if (data?.partySize) setSize(data.partySize);
    if (data?.note) setNote(data.note);
  }, [data]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the input or dropdown items
      if (showCustomerDropdown && 
          !target.closest('.customer-dropdown') && 
          !target.closest('input[placeholder="Nhập tên khách hàng"]')) {
        setShowCustomerDropdown(false);
      }
    };

    if (showCustomerDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const handleCustomerSelect = (customer: any) => {
    setName(customer.name);
    setPhone(customer.phone);
  };

  // Lấy danh sách bàn trống để gộp
  const getEmptyTables = () => {
    if (!allTables || !store) {
      return [];
    }
    
    const emptyTables = allTables.filter((t: any) => {
      // Sử dụng areaId từ table object
      const area = t.areaId;
      
      if (!area || !store[area]) {
        return false;
      }
      
      // Kiểm tra bàn có trống không
      const tableData = store[area][t.id];
      const isEmpty = !tableData || tableData.status === "EMPTY";
      return isEmpty;
    });
    
    // Lọc theo search query
    const filteredTables = emptyTables.filter((t: any) => {
      if (!mergeTableSearch.trim()) return true;
      const searchTerm = mergeTableSearch.toLowerCase();
      return t.name.toLowerCase().includes(searchTerm) || 
             t.id.toLowerCase().includes(searchTerm);
    });
    
    return filteredTables;
  };


  const handleMergeTable = () => {
    if (selectedMergeTable) {
      onAction("mergeTable", { 
        currentTableId: tableId, 
        mergeTableId: selectedMergeTable,
        bookingId: data.bookingId 
      });
      setShowMergeTable(false);
      setSelectedMergeTable("");
    }
  };

  const handleSplitTable = () => {
    onAction("splitTable", { 
      tableId: tableId,
      bookingId: data.bookingId 
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent 
        side="right" 
        className="h-full custom-drawer-width"
        style={{
          width: window.innerWidth < 768 ? '66.67%' : window.innerWidth < 1024 ? '440px' : '500px',
          maxWidth: window.innerWidth < 768 ? '66.67%' : 'none'
        }}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">{title}</SheetTitle>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="p-2 text-lg"
            >
              ✕
            </Button>
          </div>
          <SheetDescription>
            {data?.bookingId ? (
              <div className="flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1">
                  Giờ: {
                    data.status === "SEATED" || data.status === "WALKIN" 
                      ? (data.startAt ? format(data.startAt, "HH:mm") : "Đã đến")
                      : (data.bookingTime ? format(data.bookingTime, "HH:mm") : "Chưa đặt")
                  } - {
                    data.status === "CLOSED" && data.endAt 
                      ? format(data.endAt, "HH:mm") 
                      : "-"
                  }
                </span>
                <span className="inline-flex items-center gap-1">Số khách: {data.partySize}</span>
                <Badge variant="outline">
                  {data.status === "SEATED" ? 
                    `Đang ngồi - ${data.staff || "Khách vãng lai"}` :
                  data.status === "WALKIN" ? 
                    "Đang ngồi - Khách vãng lai" :
                    `Đã đặt - ${data.staff || "Nhân viên"}`
                  }
                </Badge>
              </div>
            ) : (
              <div className="text-sm opacity-70">
                {isLocked ? "Bàn này đã bị khóa. Chỉ quản lý mới có thể mở khóa." : "Chọn bàn để tạo booking hoặc phục vụ khách vãng lai."}
              </div>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="p-4">
          <div className="mt-6 space-y-6">
          {data?.bookingId ? (
            <div className="space-y-4">
              <CustomerCard customer={data.customer} />
              <div className="space-y-4">
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {data.status !== "SEATED" && data.status !== "WALKIN" && <Button onClick={()=> onAction("checkin") } className="mobile-btn">Khách đã đến</Button>}
                  {(canCloseBooking("staff", data.status) || data.status === "WALKIN") && <Button onClick={()=> onAction("close") } className="mobile-btn">ĐÓNG BÀN</Button>}
                  {data.status === "HOLD" && canLock && (
                    <Button 
                      variant="destructive" 
                      onClick={() => onAction("cancel")}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      HUỶ BÀN
                    </Button>
                  )}
                </div>
                
                {/* GỘP BÀN Section - Dropdown inline */}
        {data?.bookingId && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowMergeTable(!showMergeTable)}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 mobile-btn"
              >
                {showMergeTable ? "Ẩn danh sách" : "GỘP BÀN"}
              </Button>
              {data?.tables && data.tables.length > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleSplitTable}
                  className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 mobile-btn"
                >
                  TÁCH BÀN
                </Button>
              )}
            </div>
            
            {/* Dropdown danh sách bàn trống */}
            {showMergeTable && (
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-sm font-medium">Chọn bàn để gộp:</div>
                  <Input
                    placeholder="Tìm bàn..."
                    value={mergeTableSearch}
                    onChange={(e) => setMergeTableSearch(e.target.value)}
                    className="flex-1 text-sm"
                  />
                </div>
                
                {/* Nút xác nhận và hủy ở trên */}
                {selectedMergeTable && (
                  <div className="flex gap-2 mb-3">
                    <Button 
                      onClick={handleMergeTable} 
                      className="flex-1 text-sm py-1 mobile-btn"
                    >
                      XÁC NHẬN GỘP
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedMergeTable("")} 
                      className="flex-1 text-sm py-1 mobile-btn"
                    >
                      HỦY
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {getEmptyTables().map((table: any) => (
                    <div
                      key={table.id}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        selectedMergeTable === table.id 
                          ? "bg-blue-100 border-blue-300" 
                          : "hover:bg-gray-100 border-gray-200"
                      }`}
                      onClick={() => setSelectedMergeTable(table.id)}
                    >
                      <div className="font-medium text-sm">Bàn {table.name}</div>
                      <div className="text-xs text-gray-600">Khu {table.areaId} • {table.capacity} chỗ</div>
                    </div>
                  ))}
                  {getEmptyTables().length === 0 && (
                    <div className="p-2 text-gray-500 text-sm text-center">
                      {mergeTableSearch.trim() ? "Không tìm thấy bàn phù hợp" : "Không có bàn trống nào để gộp"}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Tên khách hàng</Label>
                <div className="relative">
                  <Input 
                    value={name} 
                    onChange={(e) => {
                      setName(e.target.value);
                      setShowCustomerDropdown(e.target.value.length > 0);
                    }} 
                    placeholder="Nhập tên khách hàng" 
                    className="mobile-search" 
                  />
                  {showCustomerDropdown && (
                    <div className="customer-dropdown absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                      {customers
                        .filter((customer: any) => 
                          customer.name.toLowerCase().includes(name.toLowerCase()) || 
                          customer.phone?.includes(name)
                        )
                        .slice(0, 5)
                        .map((customer: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Customer selected:', customer);
                              setName(customer.name);
                              setPhone(customer.phone);
                              setShowCustomerDropdown(false);
                            }}
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
              </div>
              <div>
                <Label>Số điện thoại</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại" className="mobile-search" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Giờ đặt bàn</Label>
                  <Input value={timeStr} onChange={(e) => setTimeStr(e.target.value)} placeholder="HH:MM" className="mobile-search" />
                </div>
                <div>
                  <Label>Số người</Label>
                  <Input type="number" value={size} onChange={(e) => setSize(Number(e.target.value))} min="1" className="mobile-search" />
                </div>
              </div>
              <div>
                <Label>Ghi chú</Label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú đặc biệt" className="mobile-search" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={() => onAction("create", name, phone, size, note)} className="mobile-btn flex-1">Tạo booking</Button>
                <Button variant="outline" onClick={() => onAction("walkin", size, note)} className="mobile-btn flex-1">Khách vãng lai</Button>
              </div>
            </div>
          )}
          </div>
        </div>

      </SheetContent>

      <CustomerSearch 
        customers={customers}
        onSelect={handleCustomerSelect}
        onClose={() => setShowCustomerSearch(false)}
        show={showCustomerSearch}
      />

      {/* Modal chọn bàn gộp */}
    </Sheet>
  );
}
