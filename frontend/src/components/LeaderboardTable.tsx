import RankBadge from './RankBadge';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  highest_score: number;
  evaluation_id?: string;
  evaluated_at?: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

export default function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          まだランキングがありません
        </h3>
        <p className="text-gray-600">
          評価を実行してランキングに参加しましょう！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* デスクトップ: テーブル表示 */}
      <div className="hidden md:block">
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  順位
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー名
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  最高スコア
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {entries.map((entry) => {
                const isCurrentUser = entry.user_id === currentUserId;
                const isTopThree = entry.rank <= 3;

                return (
                  <tr
                    key={entry.user_id}
                    className={`transition-colors ${
                      isCurrentUser
                        ? 'bg-primary-50 hover:bg-primary-100'
                        : isTopThree
                        ? 'bg-yellow-50 hover:bg-yellow-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <RankBadge rank={entry.rank} size="md" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isCurrentUser
                              ? 'text-primary-900'
                              : isTopThree
                              ? 'text-gray-900 text-lg'
                              : 'text-gray-900'
                          }`}
                        >
                          {entry.username}
                        </span>
                        {isCurrentUser && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded-full">
                            あなた
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full font-bold ${
                          entry.highest_score > 20
                            ? 'bg-green-100 text-green-800'
                            : entry.highest_score > 0
                            ? 'bg-blue-100 text-blue-800'
                            : entry.highest_score === 0
                            ? 'bg-gray-100 text-gray-800'
                            : entry.highest_score > -20
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entry.highest_score > 0 ? '+' : ''}
                        {entry.highest_score}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* モバイル: カード表示 */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => {
          const isCurrentUser = entry.user_id === currentUserId;
          const isTopThree = entry.rank <= 3;

          return (
            <div
              key={entry.user_id}
              className={`card ${
                isCurrentUser
                  ? 'border-2 border-primary-500 bg-primary-50'
                  : isTopThree
                  ? 'border-2 border-yellow-400 bg-yellow-50'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <RankBadge rank={entry.rank} size="lg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium ${
                          isTopThree ? 'text-lg' : 'text-base'
                        }`}
                      >
                        {entry.username}
                      </span>
                      {isCurrentUser && (
                        <span className="px-2 py-1 text-xs font-medium bg-primary-600 text-white rounded-full">
                          あなた
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      スコア:{' '}
                      <span
                        className={`font-bold ${
                          entry.highest_score > 20
                            ? 'text-green-600'
                            : entry.highest_score > 0
                            ? 'text-blue-600'
                            : entry.highest_score === 0
                            ? 'text-gray-600'
                            : entry.highest_score > -20
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }`}
                      >
                        {entry.highest_score > 0 ? '+' : ''}
                        {entry.highest_score}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
