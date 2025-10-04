import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import EvaluationResult from '@/components/EvaluationResult';
import { evaluationAPI } from '@/lib/api';

function EvaluationDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchEvaluation = async () => {
      setIsLoading(true);
      try {
        const response = await evaluationAPI.getById(id as string);
        setEvaluation(response);
      } catch (error: any) {
        toast.error('評価詳細の取得に失敗しました');
        router.push('/history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluation();
  }, [id, router]);

  const handleDelete = async () => {
    if (!evaluation || !confirm('この評価を削除してもよろしいですか？')) {
      return;
    }

    try {
      await evaluationAPI.delete(evaluation.id);
      toast.success('評価を削除しました');
      router.push('/history');
    } catch (error: any) {
      toast.error('評価の削除に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!evaluation) {
    return null;
  }

  const formattedDate = evaluation.evaluated_at
    ? format(new Date(evaluation.evaluated_at), 'yyyy年MM月dd日 HH:mm', {
        locale: ja,
      })
    : '日時不明';

  return (
    <>
      <Head>
        <title>評価詳細 - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/history"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">評価詳細</h1>
              <p className="text-gray-600 mt-1">{formattedDate}</p>
            </div>
          </div>

          {/* ベースライン情報 */}
          {evaluation.baseline_image?.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">基準画像: </span>
                {evaluation.baseline_image.description}
              </p>
            </div>
          )}
        </div>

        {/* 評価結果 */}
        <EvaluationResult
          baselineImageUrl={
            evaluation.baseline_image?.image_url ||
            evaluation.baseline_image_id ||
            ''
          }
          comparisonImageUrl={
            evaluation.comparison_image?.image_url ||
            evaluation.comparison_image_id ||
            ''
          }
          scores={evaluation.scores}
          comments={
            typeof evaluation.evaluation_comment === 'string'
              ? JSON.parse(evaluation.evaluation_comment || '{}')
              : evaluation.evaluation_comment || {}
          }
        />

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-4 mt-8">
          <Link href="/history" className="btn btn-outline">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            履歴一覧に戻る
          </Link>

          <Link href="/evaluate" className="btn btn-primary">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新しい評価
          </Link>

          <button onClick={handleDelete} className="btn btn-danger ml-auto">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            この評価を削除
          </button>
        </div>
      </div>
    </>
  );
}

export default function EvaluationDetail() {
  return (
    <ProtectedRoute>
      <EvaluationDetailPage />
    </ProtectedRoute>
  );
}
