"use client";
import React, { useEffect, useState } from 'react';
import { FaPlus, FaTrash, FaSave, FaTimes, FaSync } from 'react-icons/fa';

interface Supplier { id: string; name: string; balance: number; }

async function api(method: string, path: string, body?: any) {
  const res = await fetch(path, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  let json: any = null; try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(json?.error || json?.message || 'REQUEST_FAILED');
  return json;
}

export default function SupplierManager() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('0');
  const [editing, setEditing] = useState<Record<string, { name: string; balance: string }>>({});

  async function load() {
    setLoading(true); setError(null);
    try {
      const data = await api('GET', '/api/suppliers');
      setSuppliers(data.suppliers || []);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createSupplier() {
    if (!newName.trim()) return;
    try {
      const payload = { name: newName.trim(), balance: Number(newBalance) || 0 };
      const data = await api('POST', '/api/suppliers', payload);
      setSuppliers(s => [data.supplier, ...s]);
      setNewName(''); setNewBalance('0'); setCreating(false);
    } catch (e: any) { alert('فشل الإنشاء: ' + e.message); }
  }

  function startEdit(s: Supplier) {
    setEditing(ed => ({ ...ed, [s.id]: { name: s.name, balance: String(s.balance) } }));
  }
  function cancelEdit(id: string) {
    setEditing(ed => { const c = { ...ed }; delete c[id]; return c; });
  }
  async function saveEdit(id: string) {
    const draft = editing[id]; if (!draft) return;
    try {
      const payload = { name: draft.name.trim(), balance: Number(draft.balance) };
      const data = await api('PUT', `/api/suppliers/${id}`, payload);
      setSuppliers(s => s.map(x => x.id === id ? data.supplier : x));
      cancelEdit(id);
    } catch (e: any) { alert('فشل التحديث: ' + e.message); }
  }
  async function remove(id: string) {
    if (!confirm('حذف المورد؟')) return;
    try {
      await api('DELETE', `/api/suppliers/${id}`);
      setSuppliers(s => s.filter(x => x.id !== id));
    } catch (e: any) { alert('فشل الحذف: ' + e.message); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-semibold text-slate-700">إدارة الموردين</h3>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-slate-50 flex items-center gap-1 text-slate-600"><FaSync className="text-[10px]" /> تحديث</button>
          {!creating && <button onClick={() => setCreating(true)} className="px-3 py-1.5 text-xs rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1 text-emerald-700"><FaPlus /> مورد</button>}
        </div>
      </div>

      {creating && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-4">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="اسم المورد" className="px-3 py-1.5 text-sm rounded border border-slate-300 flex-1 min-w-[160px]" />
            <input value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="الرصيد" className="px-3 py-1.5 text-sm rounded border border-slate-300 w-32" />
          </div>
          <div className="flex gap-2">
            <button onClick={createSupplier} className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"><FaSave /> حفظ</button>
            <button onClick={() => { setCreating(false); setNewName(''); }} className="px-3 py-1.5 text-xs rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center gap-1"><FaTimes /> إلغاء</button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-rose-600">فشل التحميل: {error}</div>}
      {loading && <div className="text-sm text-slate-500">جاري التحميل...</div>}

      <div className="overflow-auto max-h-[480px] rounded border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-[11px] text-slate-500">
            <tr className="text-right">
              <th className="font-medium p-2">الاسم</th>
              <th className="font-medium p-2">الرصيد</th>
              <th className="font-medium p-2">تحكم</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && !loading && (
              <tr><td colSpan={3} className="text-center p-6 text-slate-400 text-[13px]">لا يوجد</td></tr>
            )}
            {suppliers.map(s => {
              const ed = editing[s.id];
              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-2 align-middle">
                    {ed ? (
                      <input value={ed.name} onChange={e => setEditing(o => ({ ...o, [s.id]: { ...o[s.id], name: e.target.value } }))} className="px-2 py-1 text-xs rounded border border-slate-300 w-full" />
                    ) : (
                      <span className="font-medium text-slate-700">{s.name}</span>
                    )}
                  </td>
                  <td className="p-2 align-middle w-32">
                    {ed ? (
                      <input value={ed.balance} onChange={e => setEditing(o => ({ ...o, [s.id]: { ...o[s.id], balance: e.target.value } }))} className="px-2 py-1 text-xs rounded border border-slate-300 w-full" />
                    ) : (
                      <span className={`font-mono text-[13px] ${s.balance >= 0 ? 'text-slate-600' : 'text-rose-600'}`}>{s.balance}</span>
                    )}
                  </td>
                  <td className="p-2 align-middle w-[160px]">
                    {ed ? (
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => saveEdit(s.id)} className="px-2 py-1 text-[11px] rounded bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1"><FaSave /></button>
                        <button onClick={() => cancelEdit(s.id)} className="px-2 py-1 text-[11px] rounded bg-slate-300 text-slate-700 hover:bg-slate-400 flex items-center gap-1"><FaTimes /></button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => startEdit(s)} className="px-2 py-1 text-[11px] rounded bg-slate-200 text-slate-700 hover:bg-slate-300">تعديل</button>
                        <button onClick={() => remove(s.id)} className="px-2 py-1 text-[11px] rounded bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1"><FaTrash /></button>
                        <a href={`/suppliers/${s.id}`} className="px-2 py-1 text-[11px] rounded bg-emerald-200 text-emerald-700 hover:bg-emerald-300">عرض</a>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
