import { redirect } from 'next/navigation';

export const metadata = { title: 'اللوحة الرئيسية' };

export default function Page() {
  // Unify admin with dashboard: redirect
  redirect('/dashboard');
}
