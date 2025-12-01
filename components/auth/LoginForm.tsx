"use client";
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { FaUser, FaLock } from 'react-icons/fa6';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginForm() {
  const router = useRouter();
  const { show } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const userRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { userRef.current?.focus(); }, []);

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
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }} 
      animate={{ opacity: 1, scale: 1, y: 0 }} 
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[400px]"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl backdrop-saturate-150 ring-1 ring-black/5">
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-slate-400/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-slate-400/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-500/20 ring-4 ring-white/50">
              <FaUser className="h-9 w-9" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">مرحبًا بعودتك</h1>
            <p className="mt-2 text-sm font-medium text-slate-500">سجل الدخول للمتابعة إلى لوحة التحكم</p>
          </div>

          <form onSubmit={submit} className="space-y-5" autoComplete="off" noValidate>
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500">اسم المستخدم</label>
              <div className="group relative transition-all focus-within:scale-[1.01]">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <FaUser className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  ref={userRef}
                  dir="rtl"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3.5 pr-11 pl-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all shadow-sm"
                  placeholder="ادخل اسم المستخدم"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">كلمة المرور</label>
              <div className="group relative transition-all focus-within:scale-[1.01]">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 group-focus-within:text-slate-800 transition-colors">
                  <FaLock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  dir="rtl"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 py-3.5 pr-11 pl-11 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-500/10 transition-all shadow-sm"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none"
                >
                  {showPass ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-600"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden rounded-xl bg-slate-900 py-6 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:scale-[1.02] hover:bg-slate-800 hover:shadow-slate-900/30 disabled:opacity-70 disabled:hover:scale-100"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>جارٍ التحقق...</span>
                </div>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>
        </div>
      </div>
      
      <p className="mt-8 text-center text-xs font-medium text-slate-500/80">
        جميع الحقوق محفوظة &copy; {new Date().getFullYear()}
      </p>
    </motion.div>
  );
}
