import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

interface EvaluationCardProps {
  evaluation: {
    id: string;
    scores: {
      total: number;
    };
    evaluated_at: string;
    comparison_image?: {
      image_url: string;
    };
    baseline_image?: {
      description?: string;
    };
  };
  showDetail?: boolean;
}

export default function EvaluationCard({
  evaluation,
  showDetail = true,
}: EvaluationCardProps) {
  const totalScore = evaluation.scores?.total || 0;

  // スコアの色を決定
  const getScoreColor = (score: number) => {
    if (score > 20) return 'text-green-600 bg-green-50';
    if (score > 0) return 'text-blue-600 bg-blue-50';
    if (score === 0) return 'text-gray-600 bg-gray-50';
    if (score > -20) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  // 評価レベルのテキスト
  const getScoreLevel = (score: number) => {
    if (score > 30) return '優秀';
    if (score > 15) return '良好';
    if (score > 0) return '標準以上';
    if (score === 0) return '標準';
    if (score > -15) return '標準以下';
    return '要改善';
  };

  // 日時のフォーマット
  const formattedDate = evaluation.evaluated_at
    ? format(new Date(evaluation.evaluated_at), 'yyyy年MM月dd日 HH:mm', {
        locale: ja,
      })
    : '日時不明';

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col md:flex-row gap-4">
        {/* サムネイル画像 */}
        <div className="w-full md:w-48 h-48 relative bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {evaluation.comparison_image?.image_url ? (
            <Image
              src={evaluation.comparison_image.image_url}
              alt="比較画像"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg
                className="w-16 h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 評価情報 */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* ベースライン情報 */}
            {evaluation.baseline_image?.description && (
              <p className="text-sm text-gray-500 mb-2">
                基準: {evaluation.baseline_image.description}
              </p>
            )}

            {/* 評価日時 */}
            <p className="text-sm text-gray-600 mb-3">
              <svg
                className="inline w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </p>

            {/* 総合スコア */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                総合スコア:
              </span>
              <div
                className={`px-4 py-2 rounded-lg font-bold text-2xl ${getScoreColor(
                  totalScore
                )}`}
              >
                {totalScore > 0 ? '+' : ''}
                {totalScore}
              </div>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${getScoreColor(
                  totalScore
                )}`}
              >
                {getScoreLevel(totalScore)}
              </span>
            </div>
          </div>

          {/* 詳細ボタン */}
          {showDetail && (
            <div className="mt-4">
              <Link
                href={`/history/${evaluation.id}`}
                className="btn btn-primary inline-flex items-center"
              >
                詳細を見る
                <svg
                  className="ml-2 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
