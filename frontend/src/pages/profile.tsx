import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import Modal from '@/components/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { evaluationAPI, userAPI } from '@/lib/api';
import { logout } from '@/lib/auth';

interface UserStats {
  total_evaluations: number;
  highest_score: number;
  average_score: number;
  rank: number;
}

function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // パスワード変更モーダル
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // アカウント削除モーダル
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 統計情報を取得
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoadingStats(true);

        // 評価履歴を取得（最新5件）
        const historyResponse = await evaluationAPI.getAll(1, 5);
        setRecentEvaluations(historyResponse.evaluations || []);

        // 統計情報を計算
        const allEvaluations = historyResponse.evaluations || [];
        const totalEvaluations = historyResponse.total || 0;
        const scores = allEvaluations.map((e: any) => e.scores?.total || 0);
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const averageScore =
          scores.length > 0
            ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
            : 0;

        setStats({
          total_evaluations: totalEvaluations,
          highest_score: highestScore,
          average_score: averageScore,
          rank: 0, // TODO: バックエンドから取得
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  // パスワード変更
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('パスワードは6文字以上で入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('新しいパスワードが一致しません');
      return;
    }

    setIsChangingPassword(true);
    try {
      await userAPI.updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success('パスワードを変更しました');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'パスワード変更に失敗しました');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== user?.username) {
      toast.error('ユーザー名が一致しません');
      return;
    }

    try {
      await userAPI.deleteAccount();
      toast.success('アカウントを削除しました');
      logout();
    } catch (error: any) {
      toast.error('アカウント削除に失敗しました');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>プロフィール - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">プロフィール</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: ユーザー情報 */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-12 h-12 text-primary-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.username}
                </h2>
                {user.is_admin && (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    管理者
                  </span>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">登録日</span>
                  <span className="font-medium text-gray-900">
                    {format(new Date(user.created_at), 'yyyy年MM月dd日', {
                      locale: ja,
                    })}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">ユーザーID</span>
                  <span className="font-mono text-xs text-gray-500">
                    {user.id}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="w-full btn btn-outline text-sm"
                >
                  パスワード変更
                </button>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full btn bg-red-50 text-red-700 hover:bg-red-100 text-sm"
                >
                  アカウント削除
                </button>
              </div>
            </div>
          </div>

          {/* 右側: 統計情報と最近の評価 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 統計情報 */}
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                統計情報
              </h3>

              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {stats?.total_evaluations || 0}
                    </div>
                    <div className="text-sm text-gray-600">評価回数</div>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      {stats?.highest_score || 0 > 0 ? '+' : ''}
                      {stats?.highest_score || 0}
                    </div>
                    <div className="text-sm text-gray-600">最高スコア</div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-1">
                      {stats?.average_score || 0 > 0 ? '+' : ''}
                      {stats?.average_score || 0}
                    </div>
                    <div className="text-sm text-gray-600">平均スコア</div>
                  </div>
                </div>
              )}
            </div>

            {/* 最近の評価 */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  最近の評価
                </h3>
                <Link href="/history" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  すべて見る
                </Link>
              </div>

              {isLoadingStats ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : recentEvaluations.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-600 mb-4">まだ評価がありません</p>
                  <Link href="/evaluate" className="btn btn-primary">
                    最初の評価を実行
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentEvaluations.map((evaluation) => (
                    <Link
                      key={evaluation.id}
                      href={`/history/${evaluation.id}`}
                      className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="text-sm text-gray-500 mb-1">
                            {format(
                              new Date(evaluation.evaluated_at),
                              'yyyy年MM月dd日 HH:mm',
                              { locale: ja }
                            )}
                          </div>
                          <div className="font-medium text-gray-900">
                            {evaluation.baseline_image?.description || 'ベースライン画像'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              evaluation.scores?.total > 20
                                ? 'text-green-600'
                                : evaluation.scores?.total > 0
                                ? 'text-blue-600'
                                : 'text-gray-600'
                            }`}
                          >
                            {evaluation.scores?.total > 0 ? '+' : ''}
                            {evaluation.scores?.total || 0}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* パスワード変更モーダル */}
        <Modal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          title="パスワード変更"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="current-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                現在のパスワード
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                新しいパスワード（6文字以上）
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                新しいパスワード（確認）
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="btn btn-outline"
                disabled={isChangingPassword}
              >
                キャンセル
              </button>
              <button
                onClick={handleChangePassword}
                className="btn btn-primary"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? '変更中...' : '変更する'}
              </button>
            </div>
          </div>
        </Modal>

        {/* アカウント削除モーダル */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="アカウント削除"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">
                <strong>警告:</strong> この操作は取り消せません。すべての評価履歴とデータが削除されます。
              </p>
            </div>

            <div>
              <label
                htmlFor="delete-confirm"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                確認のため、ユーザー名「<strong>{user.username}</strong>」を入力してください
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={user.username}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-outline"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-danger"
                disabled={deleteConfirmText !== user.username}
              >
                削除する
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}

export default function Profile() {
  return (
    <ProtectedRoute>
      <ProfilePage />
    </ProtectedRoute>
  );
}
