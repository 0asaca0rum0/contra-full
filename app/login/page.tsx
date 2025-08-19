import LoginForm from '@/components/auth/LoginForm';

export const metadata = { title: 'Login' };

export default function Page() {
  return (
  <div className="min-h-[60vh] grid place-items-center p-4">
      <LoginForm />
    </div>
  );
}
