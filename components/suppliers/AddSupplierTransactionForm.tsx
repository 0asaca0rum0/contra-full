"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { FaPlus, FaCheck } from 'react-icons/fa6';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddSupplierTransactionForm({ supplierId }: { supplierId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    type: 'debt', // 'debt' (bill) or 'pay' (payment)
    amount: '',
    description: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen && projects.length === 0) {
      fetch('/api/projects?limit=100')
        .then(res => res.json())
        .then(data => setProjects(data.projects || []))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let amountVal = parseFloat(formData.amount);
      if (isNaN(amountVal) || amountVal <= 0) throw new Error('المبلغ غير صحيح');
      
      // If 'pay', send negative amount
      if (formData.type === 'pay') amountVal = -amountVal;

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountVal,
          description: formData.description,
          projectId: formData.projectId || null,
          date: formData.date,
          supplierId
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'فشل إضافة المعاملة');
      }

      show({ variant: 'success', title: 'تمت الإضافة', description: 'تم تسجيل المعاملة بنجاح' });
      setFormData({ type: 'debt', amount: '', description: '', projectId: '', date: new Date().toISOString().split('T')[0] });
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      show({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-0">
      {!isOpen ? (
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl shadow-lg shadow-emerald-600/20"
        >
          <FaPlus className="w-4 h-4" />
          إضافة معاملة جديدة
        </Button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-emerald-800">تسجيل معاملة جديدة</h3>
            <button onClick={() => setIsOpen(false)} className="text-xs text-slate-500 hover:text-rose-600">إلغاء</button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">نوع المعاملة</label>
              <div className="flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'debt'})}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${formData.type === 'debt' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  فاتورة (علينا)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, type: 'pay'})}
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${formData.type === 'pay' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  دفع (سداد)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">المبلغ</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">الوصف</label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="وصف المعاملة"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">المشروع (اختياري)</label>
              <select
                value={formData.projectId}
                onChange={e => setFormData({...formData, projectId: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white"
              >
                <option value="">بدون مشروع</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">التاريخ</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-5 flex justify-end pt-2">
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
              >
                {loading ? 'جارٍ الحفظ...' : 'حفظ المعاملة'}
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
