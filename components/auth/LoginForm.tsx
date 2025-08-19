"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaUser } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useToast } from '@/components/ui/toast';

export default function LoginForm() {
  const router = useRouter();
  const { show } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const userRef = useRef<HTMLInputElement | null>(null);
  const passRef = useRef<HTMLInputElement | null>(null);

  useEffect(()=>{ userRef.current?.focus(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'فشل تسجيل الدخول');
  const role = data.user?.role as string | undefined;
  if (role === 'ADMIN' || role === 'MOD') router.push('/admin');
  else if (role === 'PM') router.push('/pm');
  else router.push('/projects');
  show({ variant: 'success', title: 'تم تسجيل الدخول', description: 'جارٍ التحويل...' });
    } catch (e: any) {
  setError(e.message);
  show({ variant: 'destructive', title: 'خطأ', description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      <div className="w-full max-w-sm mx-auto ui-glass rounded-2xl border border-emerald-200/60 shadow-sm p-6 backdrop-saturate-150">
        <div className="mb-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg ring-1 ring-white/40">
            <FaUser className="w-8 h-8" />
          </div>
          <h1 className="mt-4 text-xl font-extrabold text-emerald-800 tracking-tight">تسجيل الدخول</h1>
          <p className="text-[12px] text-emerald-700/70 mt-1">أدخل بيانات الحساب للمتابعة</p>
        </div>
        <form onSubmit={submit} className="space-y-5" autoComplete="off" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-[13px] font-semibold text-emerald-800 tracking-wide">اسم المستخدم</label>
            <div className="relative">
              <input
                id="username"
                ref={userRef}
                dir="rtl"
                value={username}
                onChange={e=>setUsername(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/70 outline-none px-3 py-2 text-sm placeholder:text-emerald-400/60 transition"
                placeholder="اسم المستخدم"
                required
                autoComplete="username"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-semibold text-emerald-800 tracking-wide">كلمة المرور</label>
            <div className="relative">
              <input
                id="password"
                ref={passRef}
                dir="rtl"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e=>setPassword(e.target.value)}
                className="w-full rounded-xl border border-emerald-200 bg-white/80 focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200/70 outline-none px-3 py-2 text-sm placeholder:text-emerald-400/60 pr-10 transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={()=>setShowPass(s=>!s)}
                tabIndex={-1}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-emerald-600 hover:text-emerald-700 p-1 rounded-md hover:bg-emerald-50 focus:outline-none"
                aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPass ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-[12px] rounded-lg bg-rose-50/90 border border-rose-200 px-3 py-2 text-rose-700">
              <span className="font-semibold">خطأ:</span>
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
          )}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 shadow-md shadow-emerald-500/25 text-sm font-semibold h-11"
            >
              {loading ? 'جارٍ تسجيل الدخول…' : 'دخول'}
            </Button>
            <p className="text-[11px] text-emerald-700/60 text-center">
              بدخولك، أنت توافق ضمنيًا على سياسات الاستخدام.
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
