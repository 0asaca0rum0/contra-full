"use client";
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface HistoryItem {
  id: string;
  quantity: number;
  createdAt: string;
  itemName: string;
  projectName: string;
  userName: string;
}

export default function WarehouseHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/warehouse/history?limit=20')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data.history);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-xs text-slate-400 py-4">جاري تحميل السجل...</div>;
  if (history.length === 0) return <div className="text-center text-xs text-slate-400 py-4">لا توجد حركات سابقة</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-right">
        <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-100">
          <tr>
            <th className="px-4 py-3 font-medium">التاريخ</th>
            <th className="px-4 py-3 font-medium">الصنف</th>
            <th className="px-4 py-3 font-medium">النوع</th>
            <th className="px-4 py-3 font-medium">الكمية</th>
            <th className="px-4 py-3 font-medium">المشروع</th>
            <th className="px-4 py-3 font-medium">المسؤول</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: ar })}
              </td>
              <td className="px-4 py-3 font-medium text-slate-800">{item.itemName}</td>
              <td className="px-4 py-3">
                {item.quantity > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                    إضافة/إرجاع
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                    صرف
                  </span>
                )}
              </td>
              <td className="px-4 py-3 font-mono dir-ltr text-right">
                {Math.abs(item.quantity)}
              </td>
              <td className="px-4 py-3 text-slate-600">{item.projectName}</td>
              <td className="px-4 py-3 text-slate-600">{item.userName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
