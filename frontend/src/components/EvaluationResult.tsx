import Image from 'next/image';
import ScoreBar from './ScoreBar';

interface EvaluationResultProps {
  baselineImageUrl: string;
  comparisonImageUrl: string;
  scores: {
    shoulder: number;
    chest: number;
    arm: number;
    back: number;
    abs: number;
    total: number;
  };
  comments?: {
    shoulder?: string;
    chest?: string;
    arm?: string;
    back?: string;
    abs?: string;
  };
}

export default function EvaluationResult({
  baselineImageUrl,
  comparisonImageUrl,
  scores,
  comments = {},
}: EvaluationResultProps) {
  const bodyParts = [
    { key: 'shoulder', label: '肩（三角筋）', score: scores.shoulder },
    { key: 'chest', label: '胸（大胸筋）', score: scores.chest },
    { key: 'arm', label: '腕（上腕筋）', score: scores.arm },
    { key: 'back', label: '背中（広背筋）', score: scores.back },
    { key: 'abs', label: '腹（腹直筋）', score: scores.abs },
  ];

  return (
    <div className="space-y-8">
      {/* 総合スコア */}
      <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">総合スコア</h3>
          <div className={`text-6xl font-bold ${
            scores.total > 0 ? 'text-green-600' : scores.total < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {scores.total > 0 ? '+' : ''}{scores.total}
          </div>
          <p className="text-sm text-gray-600 mt-2">（範囲: -50 〜 +50）</p>
        </div>
      </div>

      {/* 画像比較 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">
            ベースライン画像（基準）
          </h4>
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={baselineImageUrl}
              alt="ベースライン画像"
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="card">
          <h4 className="text-sm font-semibold text-gray-600 mb-3 text-center">
            比較対象画像
          </h4>
          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={comparisonImageUrl}
              alt="比較対象画像"
              fill
              className="object-contain"
            />
          </div>
        </div>
      </div>

      {/* 部位別スコア */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-6">部位別評価</h3>
        <div className="space-y-6">
          {bodyParts.map((part) => (
            <div key={part.key}>
              <ScoreBar
                label={part.label}
                score={part.score}
                maxScore={10}
                minScore={-10}
              />
              {comments[part.key as keyof typeof comments] && (
                <p className="text-sm text-gray-600 mt-2 pl-1">
                  {comments[part.key as keyof typeof comments]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 評価の見方 */}
      <div className="card bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">評価の見方</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>大きく優れる (+6〜+10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>優れる (+1〜+5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span>同等 (0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>劣る (-1〜-5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>大きく劣る (-6〜-10)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
