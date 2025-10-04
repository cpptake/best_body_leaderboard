import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import LeaderboardTable from '@/components/LeaderboardTable';
import Pagination from '@/components/Pagination';
import { leaderboardAPI, baselineImageAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

type TimePeriod = 'today' | 'week' | 'month' | 'all';

interface BaselineImage {
  id: string;
  description: string;
}

// リーダーボードは認証不要で公開
export default function Leaderboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // フィルター状態
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [baselineImageId, setBaselineImageId] = useState<string>('');
  const [baselineImages, setBaselineImages] = useState<BaselineImage[]>([]);

  const perPage = 20;

  // ベースライン画像一覧を取得
  useEffect(() => {
    const fetchBaselineImages = async () => {
      try {
        const response = await baselineImageAPI.getAll();
        setBaselineImages(response.baseline_images || []);
      } catch (error: any) {
        console.error('Failed to fetch baseline images:', error);
      }
    };

    fetchBaselineImages();
  }, []);

  // リーダーボードデータを取得
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const response = await leaderboardAPI.get(
          currentPage,
          perPage,
          timePeriod,
          baselineImageId || undefined
        );
        setEntries(response.leaderboard || []);
        setTotal(response.total || 0);
        setTotalPages(response.pages || 1);
      } catch (error: any) {
        toast.error('リーダーボードの取得に失敗しました');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentPage, timePeriod, baselineImageId]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTimePeriodChange = (period: TimePeriod) => {
    setTimePeriod(period);
    setCurrentPage(1); // フィルター変更時は1ページ目に戻る
  };

  const handleBaselineImageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setBaselineImageId(e.target.value);
    setCurrentPage(1); // フィルター変更時は1ページ目に戻る
  };

  const timePeriodLabels: Record<TimePeriod, string> = {
    today: '今日',
    week: '今週',
    month: '今月',
    all: '全期間',
  };

  return (
    <Layout>
      <Head>
        <title>リーダーボード - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            リーダーボード
          </h1>
          <p className="text-gray-600">
            最高スコアで競い合いましょう！
          </p>
        </div>

        {/* フィルター */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 期間フィルター */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                期間
              </label>
              <div className="flex flex-wrap gap-2">
                {(['today', 'week', 'month', 'all'] as TimePeriod[]).map(
                  (period) => (
                    <button
                      key={period}
                      onClick={() => handleTimePeriodChange(period)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        timePeriod === period
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {timePeriodLabels[period]}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* ベースライン画像フィルター */}
            <div className="flex-1">
              <label
                htmlFor="baseline-filter"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                基準画像
              </label>
              <select
                id="baseline-filter"
                value={baselineImageId}
                onChange={handleBaselineImageChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">全ての基準画像</option>
                {baselineImages.map((image) => (
                  <option key={image.id} value={image.id}>
                    {image.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* リーダーボード */}
        {!isLoading && (
          <>
            {/* 件数表示 */}
            {entries.length > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                全 {total} 件中 {(currentPage - 1) * perPage + 1} -{' '}
                {Math.min(currentPage * perPage, total)} 件を表示
              </div>
            )}

            {/* テーブル */}
            <LeaderboardTable
              entries={entries}
              currentUserId={user?.id}
            />

            {/* ページネーション */}
            {entries.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
