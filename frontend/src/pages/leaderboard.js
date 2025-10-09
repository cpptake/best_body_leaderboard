import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import LeaderboardTable from '../components/LeaderboardTable';
import { getLeaderboard } from '../lib/api';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // リーダーボードを取得
  const fetchLeaderboard = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getLeaderboard(page, 20);

      if (result.success) {
        setLeaderboard(result.data.leaderboard);
        setPagination(result.data.pagination);
        setCurrentPage(page);
      } else {
        setError(result.error || 'リーダーボードの取得に失敗しました');
      }
    } catch (err) {
      setError(err.message || '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード
  useEffect(() => {
    fetchLeaderboard(1);
  }, []);

  // ページ変更
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      fetchLeaderboard(newPage);
    }
  };

  return (
    <>
      <Head>
        <title>リーダーボード - ボディビルダー画像比較評価</title>
        <meta name="description" content="ボディビルダー画像比較評価のリーダーボード" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🏆 リーダーボード
            </h1>
            <p className="text-gray-600 mb-4">
              各ユーザーの最高得点ランキング
            </p>
            <Link href="/">
              <span className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer">
                ← メインページに戻る
              </span>
            </Link>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">❌ {error}</p>
            </div>
          )}

          {/* ローディング表示 */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">読み込み中...</p>
            </div>
          )}

          {/* リーダーボード表示 */}
          {!isLoading && !error && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <LeaderboardTable leaderboard={leaderboard} />

              {/* ページネーション */}
              {pagination && pagination.total_pages > 1 && (
                <div className="mt-6 flex justify-center items-center space-x-2">
                  {/* 前へボタン */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      currentPage === 1
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    ← 前へ
                  </button>

                  {/* ページ番号表示 */}
                  <span className="text-gray-700 px-4">
                    {currentPage} / {pagination.total_pages}
                  </span>

                  {/* 次へボタン */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.total_pages}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      currentPage === pagination.total_pages
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    次へ →
                  </button>
                </div>
              )}

              {/* 総件数表示 */}
              {pagination && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  全 {pagination.total_count} 件
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
