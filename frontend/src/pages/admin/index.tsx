import Head from 'next/head';
import ProtectedRoute from '@/components/ProtectedRoute';

function AdminPage() {
  return (
    <>
      <Head>
        <title>管理者ページ - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">管理者ページ</h1>
        <div className="card">
          <p className="text-gray-600">管理者機能は実装中です...</p>
          <p className="text-sm text-gray-500 mt-2">
            ベースライン画像の登録・管理機能を追加予定
          </p>
        </div>
      </div>
    </>
  );
}

export default function Admin() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminPage />
    </ProtectedRoute>
  );
}
