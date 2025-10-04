import { ReactNode } from 'react';
import AuthGuard from './AuthGuard';
import Layout from './Layout';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  useLayout?: boolean;
}

/**
 * 保護されたルート用のラッパーコンポーネント
 * AuthGuardとLayoutを組み合わせて使用
 */
export default function ProtectedRoute({
  children,
  requireAdmin = false,
  useLayout = true,
}: ProtectedRouteProps) {
  if (useLayout) {
    return (
      <AuthGuard requireAdmin={requireAdmin}>
        <Layout>{children}</Layout>
      </AuthGuard>
    );
  }

  return <AuthGuard requireAdmin={requireAdmin}>{children}</AuthGuard>;
}
