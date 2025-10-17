/**
 * 評価結果表示コンポーネント
 */
export default function EvaluationResult({ result }) {
  if (!result) return null;

  const { data } = result;

  // 部位の表示名とスコアのマッピング
  const bodyParts = [
    { key: 'shoulder', label: '肩', score: data.shoulder_score },
    { key: 'chest', label: '胸', score: data.chest_score },
    { key: 'arm', label: '腕', score: data.arm_score },
    { key: 'back', label: '背中', score: data.back_score },
    { key: 'abs', label: '腹', score: data.abs_score },
  ];

  // スコアに応じた色を取得
  const getScoreColor = (score) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 4) return 'bg-green-400';
    if (score >= 1) return 'bg-primary-400';
    if (score >= -3) return 'bg-gray-400';
    if (score >= -6) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // スコアのパーセンテージを計算（-10〜+10を0〜100%に変換）
  const getScorePercentage = (score) => {
    return ((score + 10) / 20) * 100;
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 総合スコア */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">総合評価</h2>
        <div className={`
          inline-block text-6xl font-bold px-8 py-4 rounded-lg
          ${data.total_score >= 20 ? 'bg-green-100 text-green-700' :
            data.total_score >= 10 ? 'bg-primary-100 text-primary-700' :
            data.total_score >= 0 ? 'bg-gray-100 text-gray-700' :
            data.total_score >= -10 ? 'bg-orange-100 text-orange-700' :
            'bg-red-100 text-red-700'}
        `}>
          {data.total_score > 0 ? '+' : ''}{data.total_score}
        </div>
        <p className="text-sm text-gray-600 mt-2">(-50 〜 +50点)</p>
      </div>

      {/* 画像の並列表示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">
            ベースライン画像
          </h3>
          <img
            src={data.baseline_image_url}
            alt="ベースライン"
            className="w-full rounded-lg shadow-md"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2 text-center">
            比較対象画像
          </h3>
          <img
            src={data.comparison_image_url}
            alt="比較対象"
            className="w-full rounded-lg shadow-md"
          />
        </div>
      </div>

      {/* 各部位の評価 */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">部位別評価</h3>

        {bodyParts.map(({ key, label, score }) => (
          <div key={key} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-700">{label}</span>
              <span className={`
                text-2xl font-bold px-4 py-1 rounded
                ${score >= 5 ? 'text-green-600' :
                  score >= 1 ? 'text-primary-600' :
                  score >= -4 ? 'text-gray-600' :
                  'text-red-600'}
              `}>
                {score > 0 ? '+' : ''}{score}
              </span>
            </div>

            {/* プログレスバー */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getScoreColor(score)}`}
                style={{ width: `${getScorePercentage(score)}%` }}
              />
            </div>

            {/* コメント */}
            <p className="text-sm text-gray-600 mt-2">
              {data.comments[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
