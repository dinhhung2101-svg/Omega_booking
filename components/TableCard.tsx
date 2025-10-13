import React from 'react';

const STATUS_COLORS: Record<string, string> = { 
  EMPTY: "bg-gray-400", 
  HOLD: "bg-amber-400", 
  SEATED: "bg-emerald-500", 
  WALKIN: "bg-emerald-500",
  CLOSED: "bg-gray-600",
  CANCELLED: "bg-red-500"
};

export function TableCard({ table, data, onClick, isOccupied, isLocked }: any) {
  const status = data?.status || "EMPTY";
  const color = isLocked ? "bg-black" : STATUS_COLORS[status];
  const label = table.name; // Hiển thị toàn bộ tên bàn
  
  return (
    <button 
      onClick={()=> onClick(table)} 
      className={`mobile-table-card w-24 h-24 min-w-24 min-h-24 max-w-24 max-h-24 md:w-24 md:h-24 rounded-xl p-1 text-left ${color} text-white shadow border border-black/10 transition flex flex-col justify-center items-center overflow-hidden`}
      style={isLocked ? { backgroundColor: '#000000' } : {}}
    >
      <div className="text-xs md:text-sm font-bold text-center leading-tight">#{label}</div>
      <div className="text-xs opacity-90 text-center mt-1 leading-tight">
        {isLocked ? "ĐÃ KHOÁ" : (
          data?.bookingId ? (
            status === "SEATED" ? 
              `Đang ngồi - ${data.staff || "Khách vãng lai"}` :
            status === "WALKIN" ? 
              "Đang ngồi - Khách vãng lai" :
              `Đã đặt - ${data.staff || "Nhân viên"}`
          ) : "Trống"
        )}
      </div>
      {data?.tables && data.tables.length > 1 && (
        <div className="text-xs opacity-75 text-center mt-0.5">
          Gộp {data.tables.length} bàn
        </div>
      )}
      {data?.bookingId && !isLocked && (
        <div className="mt-1 text-xs text-center leading-tight">
          <div className="font-medium truncate w-full">{data.customer?.name}</div>
          <div className="opacity-90">{data.partySize} người</div>
        </div>
      )}
    </button>
  );
}
