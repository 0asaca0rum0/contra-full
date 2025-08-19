import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contra Dashboard',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Root layout already renders Navbar; just provide spacing wrapper
  return <div className="min-h-screen dashboard-root">{children}</div>;
}
