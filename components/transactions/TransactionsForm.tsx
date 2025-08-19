"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toast';

export default function TransactionsForm() {
  const { show } = useToast();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [date, setDate] = useState<string>('');
  const [supplierId, setSupplierId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [noUserCookie, setNoUserCookie] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function upload() {
    if (!file) return null;
    if (file.size > 10 * 1024 * 1024) { // 10MB
      show({ variant: 'warning', title: 'كبير جدًا', description: 'الحد الأقصى 10MB' });
      return null;
    }
    try {
      setUploading(true);
      const ext = file.name.split('.').pop() || 'bin';
      const planRes = await fetch('/api/receipts/presign', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ext }) });
      if (!planRes.ok) throw new Error('plan');
      const plan = await planRes.json();
      const { key, uploadUrl, formField } = plan;
      const form = new FormData();
      form.append(formField || 'file', file);
      const up = await fetch(uploadUrl, { method: 'POST', body: form });
      if (!up.ok) throw new Error('upload');
      setReceiptKey(key);
      return key;
    } catch (e) {
      show({ variant: 'destructive', title: 'خطأ', description: 'فشل رفع الإيصال' });
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || !description.trim() || !projectId) {
      show({ variant: 'warning', title: 'تنبيه', description: 'أدخل المبلغ والوصف والمشروع' });
      return;
    }
    setSubmitting(true);
    setLastError(null);
    try {
      let rk = receiptKey;
      if (file && !rk) rk = await upload() || undefined;
      const payload: any = { amount: n, description: description.trim(), projectId, supplierId: supplierId || undefined, date: date || undefined, receiptKey: rk };
      if (!userId) {
        // dev fallback if cookie not set yet
        payload.userId = prompt('أدخل معرف المستخدم (مؤقت)') || undefined;
      }
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const errJson = await res.json().catch(()=>null);
        const msg = errJson?.error || 'create_failed';
        setLastError(msg + (errJson?.hint ? ` (${errJson.hint})` : ''));
        throw new Error(msg);
      }
  show({ variant: 'success', title: 'تم', description: 'تمت إضافة المعاملة' });
  setAmount(''); setDescription(''); setProjectId(''); setSupplierId(''); setFile(null); setReceiptKey(null);
  router.refresh();
    } catch (e:any) {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر إضافة المعاملة' });
    } finally {
      setSubmitting(false);
    }
  }

  // fetch current user + projects once
  React.useEffect(() => {
    (async () => {
      try {
        // current user
        const me = await fetch('/api/auth/me', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(()=>null);
  if (me?.user?.id) setUserId(me.user.id); else setNoUserCookie(true);
      } catch {}
      try {
        setLoadingProjects(true);
        const res = await fetch('/api/projects', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data.projects) ? data.projects.map((p:any)=>({ id: p.id, name: p.name })) : [];
          setProjects(list);
          if (!projectId && list.length === 1) setProjectId(list[0].id);
        }
      } finally {
        setLoadingProjects(false);
      }
      // suppliers
      try {
        setLoadingSuppliers(true);
        const resSup = await fetch('/api/suppliers', { cache: 'no-store' });
        if (resSup.ok) {
          const data = await resSup.json();
          const list = Array.isArray(data.suppliers) ? data.suppliers.map((s:any)=>({ id: s.id, name: s.name })) : [];
          setSuppliers(list);
        }
      } finally {
        setLoadingSuppliers(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {noUserCookie && (
        <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[12px]">
          لم يتم العثور على جلسة مستخدم (سيتم طلب معرف مستخدم مؤقت). تأكد من تسجيل الدخول.
        </div>
      )}
      {lastError && (
        <div className="p-2 rounded bg-red-50 border border-red-200 text-red-700 text-[12px]">
          خطأ: {lastError}
        </div>
      )}
      <div className="grid md:grid-cols-6 gap-3">
        <div>
          <label className="text-xs mb-1 block">المبلغ</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs mb-1 block">الوصف</label>
          <input value={description} onChange={e=>setDescription(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="مثال: شراء معدات" />
        </div>
        <div>
          <label className="text-xs mb-1 block">المشروع</label>
          <select value={projectId} onChange={e=>setProjectId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-white">
            <option value="">{loadingProjects ? 'جارٍ التحميل...' : 'اختر مشروعاً'}</option>
            {projects.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block">المورد (اختياري)</label>
          <select value={supplierId} onChange={e=>setSupplierId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm bg-white">
            <option value="">{loadingSuppliers ? 'جارٍ التحميل...' : 'بدون'}</option>
            {suppliers.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block">التاريخ</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs mb-1 block">إيصال (اختياري)</label>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,application/pdf" onChange={e=>setFile(e.target.files?.[0] || null)} className="text-sm" />
          {file && <div className="text-[11px] text-slate-600 mt-1 truncate max-w-[180px]" title={file.name}>{file.name}</div>}
          {uploading && <div className="text-[11px] text-emerald-600 mt-1">جارٍ الرفع...</div>}
          {receiptKey && !uploading && <div className="text-[11px] text-emerald-700 mt-1">تم الرفع</div>}
        </div>
      </div>
      <div>
        <button disabled={submitting || uploading} onClick={submit} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm">
          {submitting ? '...' : 'إضافة معاملة'}
        </button>
      </div>
    </div>
  );
}
