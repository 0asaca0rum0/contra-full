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
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">اسم الصنف</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="border rounded px-2 py-1 text-sm w-52" placeholder="مثال: مسمار" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">الكمية الابتدائية</label>
        <input type="number" value={quantity} onChange={e=>setQuantity(e.target.value)} className="border rounded px-2 py-1 text-sm w-32" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-slate-600">صورة (اختياري)</label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="text-[12px]"
        />
        {file && (
          <span className="text-[11px] text-slate-500" title={file.name}>
            {file.name} ({Math.round(file.size / 1024)} كيلوبايت)
          </span>
        )}
        {uploading && <span className="text-[11px] text-emerald-600">جاري رفع الصورة...</span>}
      </div>
      <button disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm">
        {submitting ? '...' : 'إضافة'}
      </button>
      {lastError && <span className="text-[11px] text-rose-600">{lastError}</span>}
    </form>
  );
}
