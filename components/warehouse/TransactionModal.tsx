"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectOption {
  id: string;
  name: string;
  managers: { id: string; name: string }[];
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  currentQuantity: number;
  initialType: 'IN' | 'OUT';
  projects: ProjectOption[];
}

export default function TransactionModal({
  isOpen, onClose, itemId, itemName, currentQuantity, initialType, projects
}: TransactionModalProps) {
  const router = useRouter();
  const [type, setType] = useState<'IN' | 'OUT'>(initialType);
  const [quantity, setQuantity] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pmId, setPmId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectManagers = useMemo(() => {
    return projects.find((p) => p.id === projectId)?.managers ?? [];
  }, [projects, projectId]);

  if (!isOpen) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setError('الكمية يجب أن تكون أكبر من صفر');
      return;
    }
    if (type === 'OUT' && qty > currentQuantity) {
      setError('الكمية المطلوبة غير متوفرة في المخزون');
      return;
    }
    if (!projectId) {
      setError('يجب اختيار المشروع');
      return;
    }
    if (!pmId) {
      setError('يجب اختيار المسؤول');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/warehouse/transactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          itemId,
          projectId,
          userId: pmId, // We use userId field for the Responsible PM
          quantity: qty,
          type
        })
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'حدث خطأ أثناء تنفيذ المعاملة');
        return;
      }

      router.refresh();
      onClose();
      // Reset form (optional, or keep generic for next usage if component persists)
      setQuantity('');
      setProjectId('');
      setPmId('');
    } catch (err) {
      setError('خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">تسجيل حركة مخزنية</h3>
              <p className="text-sm text-slate-500 mt-1">
                الصنف: <span className="font-semibold text-slate-700">{itemName}</span>
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            {/* Type Selection */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'IN' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                إضافة (توريد/إرجاع)
              </button>
              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${type === 'OUT' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                صرف (سحب)
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">المشروع</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">اختر المشروع</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">المسؤول (المستلم/المسلم)</label>
                <select
                  value={pmId}
                  onChange={e => setPmId(e.target.value)}
                  disabled={!projectId || projectManagers.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">{projectManagers.length === 0 ? (projectId ? 'لا يوجد مدراء' : 'اختر المشروع أولاً') : 'اختر المسؤول'}</option>
                  {projectManagers.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">الكمية (المتوفر: {currentQuantity})</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {error}
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg text-white font-semibold shadow-sm hover:shadow hover:-translate-y-0.5 transition-all text-sm ${type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                {loading ? 'جاري التنفيذ...' : (type === 'IN' ? 'تأكيد الإضافة' : 'تأكيد الصرف')}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-sm"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
