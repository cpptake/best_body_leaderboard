import React from 'react';

export default function LeaderboardTable({ leaderboard }) {
  // トップ3の背景色を設定
  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return {
          icon: '🥇',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
        };
      case 2:
        return {
          icon: '🥈',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
        };
      case 3:
        return {
          icon: '🥉',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-300',
        };
      default:
        return {
          icon: '',
          bgColor: 'bg-white',
          textColor: 'text-gray-900',
          borderColor: 'border-gray-200',
        };
    }
  };

  // スコアの色を取得
  const getScoreColor = (score) => {
    if (score >= 40) return 'text-green-600 font-bold';
    if (score >= 20) return 'text-primary-600 font-semibold';
    if (score >= 0) return 'text-gray-600';
    return 'text-red-600';
  };

  // 日時のフォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        まだ評価データがありません
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
              順位
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
              画像
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
              ユーザー名
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
              最高得点
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
              評価日時
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry) => {
            const rankBadge = getRankBadge(entry.rank);
            const scoreColor = getScoreColor(entry.best_score);

            return (
              <tr
                key={`${entry.rank}-${entry.username}`}
                className={`${rankBadge.bgColor} ${rankBadge.borderColor} border-b hover:bg-opacity-80 transition-colors`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {rankBadge.icon && (
                      <span className="text-2xl mr-2">{rankBadge.icon}</span>
                    )}
                    <span className={`text-lg font-semibold ${rankBadge.textColor}`}>
                      {entry.rank}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {entry.image_url ? (
                    <img
                      src={entry.image_url}
                      alt={`${entry.username}の画像`}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg border-2 border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">画像なし</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-900 font-medium">{entry.username}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xl ${scoreColor}`}>
                    {entry.best_score > 0 ? '+' : ''}{entry.best_score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {formatDate(entry.evaluated_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
