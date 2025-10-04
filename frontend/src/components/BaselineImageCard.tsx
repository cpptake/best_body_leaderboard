import Image from 'next/image';

interface BaselineImage {
  id: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface BaselineImageCardProps {
  image: BaselineImage;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: (image: BaselineImage) => void;
  onDelete: (id: string) => void;
}

export default function BaselineImageCard({
  image,
  onToggleActive,
  onEdit,
  onDelete,
}: BaselineImageCardProps) {
  return (
    <div className="card overflow-hidden">
      {/* 画像 */}
      <div className="relative w-full h-64 bg-gray-100">
        <Image
          src={image.image_url}
          alt={image.description}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* アクティブ状態バッジ */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              image.is_active
                ? 'bg-green-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {image.is_active ? 'アクティブ' : '非アクティブ'}
          </span>
        </div>
      </div>

      {/* 情報 */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {image.description}
        </h3>
        <p className="text-sm text-gray-500 mb-4">ID: {image.id}</p>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-2">
          {/* アクティブ切替 */}
          <button
            onClick={() => onToggleActive(image.id, !image.is_active)}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              image.is_active
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {image.is_active ? '非アクティブ化' : 'アクティブ化'}
          </button>

          {/* 編集 */}
          <button
            onClick={() => onEdit(image)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            編集
          </button>

          {/* 削除 */}
          <button
            onClick={() => onDelete(image.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
          >
            <svg
              className="w-4 h-4 inline mr-1"
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
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
