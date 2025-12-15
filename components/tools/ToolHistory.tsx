"use client";
import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ToolHistoryItem {
  id: string;
  fromLocation: string;
  toLocation: string;
  responsiblePmName: string;
  movedAt: string;
}

export default function ToolHistory({ toolId }: { toolId: string }) {
  const [history, setHistory] = useState<ToolHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!toolId) return;
    setLoading(true);
    fetch(`/api/tools/${toolId}/history`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setHistory(data.data.history);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [toolId]);

  if (loading) return <div className="p-4 text-center text-xs text-slate-400">جاري تحميل السجل...</div>;
  if (history.length === 0) return <div className="p-4 text-center text-xs text-slate-400">لا يوجد سجل تنقلات لهذه الأداة</div>;

  return (
    <div className="relative border-r border-slate-200 mr-4 my-2 space-y-6 pr-4">
      {history.map((item) => (
        <div key={item.id} className="relative">
          <div className="absolute top-1 -right-[21px] h-3 w-3 rounded-full border-2 border-white bg-slate-300 ring-1 ring-slate-100" />
          <time className="mb-1 block text-xs font-normal leading-none text-slate-400">
            {format(new Date(item.movedAt), 'd MMMM yyyy - HH:mm', { locale: ar })}
          </time>
          <h3 className="text-sm font-semibold text-slate-900">
            تم النقل إلى <span className="text-emerald-700">{item.toLocation || 'صندوق العدة'}</span>
          </h3>
          <p className="mb-2 text-xs font-normal text-slate-500">
            من: {item.fromLocation || 'غير محدد'} | المسؤول: {item.responsiblePmName || 'غير معروف'}
          </p>
        </div>
      ))}
    </div>
  );
}
