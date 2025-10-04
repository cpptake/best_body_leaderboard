import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getUserData, isAuthenticated } from '@/lib/auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      if (!isAuthenticated()) {
        router.push('/login');
        return;
      }

      const user = getUserData();
      if (!user || !user.is_admin) {
        router.push('/');
        return;
      }

      setIsChecking(false);
    };

    checkAdmin();
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">確認中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
