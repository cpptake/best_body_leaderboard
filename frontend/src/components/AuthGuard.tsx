import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated, isAdmin } from '@/lib/auth';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * 認証ガードコンポーネント
 * 未認証ユーザーをログインページにリダイレクト
 * requireAdmin=trueの場合、管理者権限も確認
 */
export default function AuthGuard({ children, requireAdmin = false }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 認証チェック
    const checkAuth = () => {
      const authenticated = isAuthenticated();

      if (!authenticated) {
        // 未認証の場合、ログインページにリダイレクト
        router.push('/login');
        return;
      }

      // 管理者権限が必要な場合
      if (requireAdmin && !isAdmin()) {
        // 管理者でない場合、ホームにリダイレクト
        router.push('/');
        return;
      }

      // 認証OK
      setIsAuthorized(true);
    };

    checkAuth();
  }, [router, requireAdmin]);

  // 認証チェック中はローディング表示
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
