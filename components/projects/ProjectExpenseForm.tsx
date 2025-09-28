"use client";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ProjectExpenseForm({ projectId, pmUsers }: { projectId: string; pmUsers: Array<{ id: string; username: string }> }) {
  const { show } = useToast();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [userId, setUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function uploadReceiptIfAny() : Promise<string | undefined> {
    if (!file) return undefined;
    try {
      setUploading(true);
      // 1. get plan (presign substitute)
      const ext = file.name.split('.').pop() || 'bin';
      const planRes = await fetch('/api/receipts/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ext }) });
      if (!planRes.ok) throw new Error('plan failed');
      const plan = await planRes.json();
      const { uploadUrl, key, formField } = plan;
      // 2. multipart upload
      const form = new FormData();
      form.append(formField || 'file', file);
      const upRes = await fetch(uploadUrl, { method: 'POST', body: form });
      if (!upRes.ok) throw new Error('upload failed');
      setReceiptKey(key);
      return key;
    } catch (e) {
      show({ variant: 'destructive', title: 'خطأ', description: 'فشل رفع الإيصال' });
      return undefined;
    } finally {
      setUploading(false);
    }
  }

  const onSubmit = async () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || !description.trim() || !userId) {
      const msg = 'يرجى إدخال المبلغ والوصف واختيار المستخدم';
      setErrorMsg(msg);
      show({ variant: 'warning', title: 'تنبيه', description: msg });
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      let rk: string | undefined;
      if (file && !receiptKey) {
        rk = await uploadReceiptIfAny();
      } else if (receiptKey) {
        rk = receiptKey;
      }
      console.log('[ProjectExpenseForm] submitting expense', {
        projectId,
        hasFile: Boolean(file),
        providedReceiptKey: Boolean(receiptKey),
        finalReceiptKey: rk ?? null,
      });
      const res = await fetch(`/api/projects/${projectId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: n, description: description.trim(), userId, receiptKey: rk }),
      });
      if (!res.ok) throw new Error();
  show({ variant: 'success', title: 'تمت الإضافة', description: 'تم تسجيل المصروف' });
      setAmount('');
      setDescription('');
      setUserId('');
      setFile(null);
      setReceiptKey(null);
  router.refresh();
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر تسجيل المصروف' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid sm:grid-cols-4 gap-2">
      {errorMsg && (
        <div className="sm:col-span-4 -mt-1 mb-1">
          <p className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200/70 rounded-md px-2 py-1 inline-block">
            {errorMsg}
          </p>
        </div>
      )}
      <div className="sm:col-span-1">
        <label className="text-sm block mb-1">المبلغ</label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm block mb-1">الوصف</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: شراء مواد" />
      </div>
      <div className="sm:col-span-1">
        <label className="text-sm block mb-1">المستخدم</label>
        <select
          className="w-full h-10 rounded-[12px] border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md px-3 text-sm"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">— اختر —</option>
          {pmUsers.map((u) => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="text-sm block mb-1">إيصال (اختياري)</label>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} className="text-sm" />
          {file && <span className="text-xs text-slate-600 truncate max-w-[140px]" title={file.name}>{file.name}</span>}
          {uploading && <span className="text-xs text-emerald-600">جارٍ الرفع...</span>}
          {receiptKey && !uploading && <span className="text-xs text-emerald-700">تم الرفع</span>}
        </div>
      </div>
      <div className="sm:col-span-4">
        <Button disabled={submitting || uploading} onClick={onSubmit}>{submitting ? '...' : 'إضافة مصروف'}</Button>
      </div>
    </div>
  );
}
