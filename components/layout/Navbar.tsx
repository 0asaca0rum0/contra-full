"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiFolder,
  FiUsers,
  FiTruck,
  FiTool,
  FiFileText,
  FiArchive,
  FiShield,
} from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';

type Me = { id: string; username?: string; role?: string; permissions?: string[] } | null;

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<Me>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchMe = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setMe(data.user || null);
    } catch {
      setMe(null);
    } finally { setMeLoading(false); }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const logout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.replace('/login');
    } catch {
      show({ variant: 'destructive', title: 'خطأ', description: 'تعذر تسجيل الخروج' });
    } finally { setLoading(false); }
  };

  const links = [
    { href: '/dashboard', label: 'الرئيسية', Icon: FiHome },
    { href: '/projects', label: 'المشاريع', Icon: FiFolder },
    { href: '/pm', label: 'مديرو المشاريع', Icon: FiUsers },
    { href: '/suppliers', label: 'الموردون', Icon: FiTruck },
    { href: '/tools', label: 'الأدوات', Icon: FiTool },
    { href: '/receipts', label: 'الإيصالات', Icon: FiFileText },
    { href: '/warehouse', label: 'المخزن', Icon: FiArchive },
    { href: '/permissions', label: 'الصلاحيات', Icon: FiShield },
  ];

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  const renderLinks = (stacked = false) => (
    <ul
      className={`flex ${stacked ? 'flex-col gap-2' : 'items-center gap-2'} text-sm font-semibold tracking-tight`}
    >
      {links.map((link) => {
        const active = isActive(link.href);
        const Icon = link.Icon as any;
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`group relative flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-200 ${
                active
                  ? 'bg-white text-emerald-900 shadow-lg shadow-emerald-900/10'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-xl border transition ${
                  active
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-white/15 bg-white/5 text-white/70 group-hover:border-white/40'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span>{link.label}</span>
              {active && (
                <span className="absolute inset-x-2 -bottom-1 h-1 rounded-full bg-emerald-400/80" aria-hidden />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/25 bg-[#0d1f1d]/85 shadow-lg shadow-emerald-900/15 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-100 transition hover:bg-emerald-500/20 md:hidden"
            >
              {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <Link href="/dashboard" className="flex items-center gap-3 text-white">
              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/90 to-emerald-600/90 text-slate-900 shadow ring-1 ring-white/40">
                <span className="text-[10px] font-black tracking-[0.35em]">CON</span>
              </span>
              <span className="hidden flex-col leading-tight sm:flex">
                <span className="text-sm font-semibold text-white/90">كونترا</span>
                <span className="text-[11px] text-emerald-100/80">لوحة إدارة المشاريع</span>
              </span>
            </Link>
          </div>
          <nav className="hidden flex-1 justify-center md:flex">
            {renderLinks()}
          </nav>
          <div className="flex items-center gap-3">
            {meLoading ? (
              <span className="rounded-2xl border border-white/10 px-3 py-1.5 text-[11px] text-emerald-100/80">جارٍ التحميل…</span>
            ) : me ? (
              <span className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
                <FaUserCircle className="h-4 w-4 opacity-90" />
                <span className="max-w-[120px] truncate font-semibold" title={me.username || me.id}>
                  {me.username || me.id}
                </span>
                {me.role && (
                  <span className="rounded-lg bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                    {me.role}
                  </span>
                )}
              </span>
            ) : (
              <Link
                href="/login"
                className="rounded-2xl border border-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                تسجيل الدخول
              </Link>
            )}
            {me && (
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-400/60"
                disabled={loading}
              >
                <FiLogOut className="h-4 w-4 opacity-80" />
                {loading ? '...' : 'خروج'}
              </Button>
            )}
          </div>
        </div>
        <nav className="flex md:hidden">
          {!menuOpen ? null : (
            <div className="w-full rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-inner">
              <div className="mb-3 text-[12px] font-semibold text-emerald-100/80">روابط سريعة</div>
              {renderLinks(true)}
              {!me && !meLoading && (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="mt-4 block w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
