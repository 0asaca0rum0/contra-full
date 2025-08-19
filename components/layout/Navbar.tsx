"use client";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/toast';
import { FiMenu, FiX, FiLogOut, FiHome, FiFolder, FiUsers, FiTruck, FiTool, FiFileText, FiArchive, FiShield } from 'react-icons/fi';
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

  const renderLinks = (compact = false) => (
    <ul className={`flex ${compact ? 'flex-col gap-1.5' : 'items-center gap-1.5'} text-[13px] font-medium`}> 
  {links.map(l => {
        const active = isActive(l.href);
        const Icon = l.Icon as any;
        return (
          <li key={l.href}>
            <Link
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-1.25 px-3 py-2 rounded-md transition-colors whitespace-nowrap border ${active
                ? 'bg-white/20 border-white/40 text-white'
                : 'border-transparent text-white/85 hover:text-white hover:bg-white/12'} `}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'opacity-80'}`} />
              <span>{l.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/30 shadow-lg shadow-emerald-900/10 backdrop-blur-xl bg-gradient-to-r from-[#2D7D46]/90 via-[#238C70]/85 to-[#2A9D8F]/90">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={menuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          onClick={() => setMenuOpen(o => !o)}
          className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors"
        >
          {menuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>
        <Link href="/projects" className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
          <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-300/90 to-emerald-600/90 text-slate-900 shadow ring-1 ring-white/40">
            <span className="text-[11px] font-black tracking-[1px]">CON</span>
          </span>
          <span className="hidden sm:inline text-white/90">كونترا</span>
        </Link>
        {/* Desktop nav */}
        <nav className="hidden md:flex flex-1 items-center">
          {renderLinks()}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {meLoading ? (
            <span className="text-[11px] px-2 py-1 rounded bg-white/10 text-white/70 animate-pulse">...جاري</span>
          ) : me ? (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-white text-xs border border-white/20 shadow-inner backdrop-blur-sm">
              <FaUserCircle className="opacity-90 drop-shadow" />
              <span className="font-medium truncate max-w-[100px]" title={me.username || me.id}>{me.username || me.id}</span>
              {me.role && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-white tracking-wide shadow">{me.role}</span>}
            </span>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded-lg bg-white/15 border border-white/25 text-white text-xs font-medium hover:bg-white/25 hover:border-white/40 shadow transition-colors">تسجيل الدخول</Link>
          )}
          {me && (
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 rounded-lg border-white/25 bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-100 hover:border-rose-300/60 transition-colors"
              disabled={loading}
            >
              <FiLogOut className="opacity-70" />
              {loading ? '...' : 'خروج'}
            </Button>
          )}
        </div>
      </div>
      {/* Mobile panel */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/20 bg-gradient-to-b from-[#2A9D8F]/95 via-[#238C70]/92 to-[#1f6a50]/95 backdrop-blur px-4 pb-5 pt-3 animate-in fade-in slide-in-from-top-2 shadow-lg">
          <nav className="mb-4">
            {renderLinks(true)}
          </nav>
          {!me && !meLoading && (
            <Link href="/login" onClick={()=>setMenuOpen(false)} className="block w-full text-center rounded-lg bg-white/15 border border-white/25 text-white py-2 text-sm font-medium hover:bg-white/25">تسجيل الدخول</Link>
          )}
        </div>
      )}
    </header>
  );
}
