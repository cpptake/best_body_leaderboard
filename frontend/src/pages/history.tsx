import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import EvaluationCard from '@/components/EvaluationCard';
import Pagination from '@/components/Pagination';
import { evaluationAPI } from '@/lib/api';

function HistoryPage() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const perPage = 10;

  // 評価履歴を取得
  useEffect(() => {
    const fetchEvaluations = async () => {
      setIsLoading(true);
      try {
        const response = await evaluationAPI.getAll(currentPage, perPage);
        setEvaluations(response.evaluations || []);
        setTotal(response.total || 0);
        setTotalPages(response.pages || 1);
      } catch (error: any) {
        toast.error('評価履歴の取得に失敗しました');
        setEvaluations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Head>
        <title>評価履歴 - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">評価履歴</h1>
            <p className="text-gray-600 mt-2">
              これまでの評価結果を確認できます
            </p>
          </div>
          <Link href="/evaluate" className="btn btn-primary">
            新しい評価
          </Link>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* 評価履歴一覧 */}
        {!isLoading && evaluations.length === 0 && (
          <div className="card text-center py-12">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              評価履歴がありません
            </h3>
            <p className="text-gray-600 mb-6">
              まだ評価を実行していません。最初の評価を実行しましょう！
            </p>
            <Link href="/evaluate" className="btn btn-primary">
              評価を開始
            </Link>
          </div>
        )}

        {!isLoading && evaluations.length > 0 && (
          <>
            {/* 件数表示 */}
            <div className="mb-4 text-sm text-gray-600">
              全 {total} 件中 {(currentPage - 1) * perPage + 1} -{' '}
              {Math.min(currentPage * perPage, total)} 件を表示
            </div>

            {/* 評価カード一覧 */}
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <EvaluationCard key={evaluation.id} evaluation={evaluation} />
              ))}
            </div>

            {/* ページネーション */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </>
  );
}

export default function History() {
  return (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  );
}
