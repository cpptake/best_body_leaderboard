interface RankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function RankBadge({ rank, size = 'md' }: RankBadgeProps) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
          text: 'text-yellow-900',
          icon: '🥇',
          label: '金メダル',
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-gray-300 to-gray-500',
          text: 'text-gray-900',
          icon: '🥈',
          label: '銀メダル',
        };
      case 3:
        return {
          bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
          text: 'text-orange-900',
          icon: '🥉',
          label: '銅メダル',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          icon: '',
          label: `${rank}位`,
        };
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8 text-sm';
      case 'md':
        return 'w-12 h-12 text-base';
      case 'lg':
        return 'w-16 h-16 text-xl';
    }
  };

  const style = getRankStyle();

  return (
    <div
      className={`${style.bg} ${getSizeClass()} rounded-full flex items-center justify-center font-bold ${
        style.text
      } shadow-md`}
      title={style.label}
    >
      {rank <= 3 ? (
        <span className="text-2xl">{style.icon}</span>
      ) : (
        <span>{rank}</span>
      )}
    </div>
  );
}
