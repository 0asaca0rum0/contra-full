"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

export default function AddWarehouseItemForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  const uploadImage = async (selectedFile: File): Promise<string | null> => {
    if (!selectedFile) return null;
    if (selectedFile.size > 5 * 1024 * 1024) {
      show({ variant: 'warning', title: 'ملف كبير', description: 'الحد الأقصى لحجم الصورة هو 5MB' });
      return null;
    }
    setUploading(true);
    try {
      const ext = selectedFile.name.split('.').pop() || 'bin';
      const planRes = await fetch('/api/warehouse/items/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ext }),
      });
      if (!planRes.ok) {
        show({ variant: 'destructive', title: 'خطأ في التحضير', description: 'تعذر تحضير رفع الصورة' });
        return null;
      }
      const plan = await planRes.json();
      const formData = new FormData();
      formData.append(plan.formField || 'file', selectedFile);
      const uploadRes = await fetch(plan.uploadUrl, { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        show({ variant: 'destructive', title: 'خطأ في الرفع', description: 'تعذر رفع الصورة' });
        return null;
      }
      return typeof plan.publicUrl === 'string' ? plan.publicUrl : null;
    } finally {
      setUploading(false);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setLastError(null);
    try {
      let imageUrl: string | null = null;
      if (file) {
        imageUrl = await uploadImage(file);
        if (file && !imageUrl) {
          setSubmitting(false);
          return;
        }
      }
      const payload: Record<string, unknown> = {
        name: name.trim(),
        quantity: Number(quantity) || 0,
      };
      if (imageUrl) payload.imageUrl = imageUrl;
      const res = await fetch('/api/warehouse/items', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setName('');
        setQuantity('0');
        setFile(null);
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        const message = err?.error || 'تعذر إضافة الصنف';
        setLastError(message);
        show({ variant: 'destructive', title: 'خطأ', description: message });
      }
    } catch (error) {
      setLastError('حدث خطأ غير متوقع');
      show({ variant: 'destructive', title: 'خطأ', description: 'حدث خطأ غير متوقع أثناء حفظ الصنف' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300 hover:border-emerald-400/50 hover:bg-emerald-50/30 transition-all group focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500">
      <div className="flex-1 w-full relative">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">اسم الصنف</label>
        <div className="relative">
          <input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded-lg border border-slate-200 pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all placeholder:text-slate-300 bg-white font-medium text-slate-700" placeholder="مثال: مسمار" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
        </div>
      </div>
      
      <div className="w-32">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">الكمية</label>
        <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-0 transition-all bg-white font-medium text-slate-700 font-mono text-center" />
      </div>

      <div className="flex-1 w-full relative min-w-[200px]">
        <label className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1.5 block">صورة (اختياري)</label>
        <div className="relative">
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer border border-slate-200 rounded-lg bg-white"
            />
        </div>
         {(file || uploading) && (
            <div className="absolute top-full left-0 right-0 mt-1 flex justify-between text-[10px]">
               {file && <span className="text-slate-500 truncate max-w-[150px]">{file.name}</span>}
               {uploading && <span className="text-emerald-600 font-medium">جاري الرفع...</span>}
            </div>
         )}
      </div>

      <button disabled={submitting} className="h-[42px] px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-sm font-bold flex items-center justify-center gap-2 min-w-[100px] disabled:opacity-70 disabled:hover:shadow-sm disabled:hover:translate-y-0 text-nowrap">
        {submitting ? (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        ) : (
          <>إضافة</>
        )}
      </button>
      
      {lastError && <div className="absolute -bottom-6 right-0 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">{lastError}</div>}
    </form>
  );
}
