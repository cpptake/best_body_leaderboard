interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  minScore?: number;
}

export default function ScoreBar({
  label,
  score,
  maxScore = 10,
  minScore = -10,
}: ScoreBarProps) {
  // スコアを0-100%の範囲に変換
  const range = maxScore - minScore;
  const percentage = ((score - minScore) / range) * 100;

  // スコアに応じた色を決定
  const getColor = () => {
    if (score > 5) return 'bg-green-500';
    if (score > 0) return 'bg-blue-500';
    if (score === 0) return 'bg-gray-400';
    if (score > -5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // スコア表示のフォーマット
  const formatScore = (value: number) => {
    return value > 0 ? `+${value}` : `${value}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-lg font-bold ${
          score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'
        }`}>
          {formatScore(score)}
        </span>
      </div>

      <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        {/* 中央線（0点の位置） */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 z-10" />

        {/* スコアバー */}
        <div
          className={`absolute top-0 bottom-0 transition-all duration-500 ${getColor()}`}
          style={{
            left: score >= 0 ? '50%' : `${percentage}%`,
            width: score >= 0 ? `${percentage - 50}%` : `${50 - percentage}%`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{minScore}</span>
        <span>0</span>
        <span>+{maxScore}</span>
      </div>
    </div>
  );
}
