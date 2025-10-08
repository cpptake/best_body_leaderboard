import { useState, useRef } from 'react';

/**
 * 画像アップロードコンポーネント
 * ドラッグ&ドロップとファイル選択に対応
 */
export default function ImageUploader({ label, onImageSelect, selectedImage }) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // ドラッグオーバー時の処理
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // ドラッグリーブ時の処理
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // ドロップ時の処理
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // ファイル選択時の処理
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  // ファイルのバリデーションと選択処理
  const handleFile = (file) => {
    // ファイル形式のチェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      alert('JPG、JPEG、PNGファイルのみアップロード可能です');
      return;
    }

    // ファイルサイズのチェック（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('ファイルサイズは10MB以下にしてください');
      return;
    }

    // 親コンポーネントに通知
    onImageSelect(file);
  };

  // クリックでファイル選択ダイアログを開く
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        {selectedImage ? (
          <div>
            <img
              src={URL.createObjectURL(selectedImage)}
              alt="プレビュー"
              className="max-h-64 mx-auto rounded"
            />
            <p className="mt-2 text-sm text-gray-600">{selectedImage.name}</p>
            <p className="text-xs text-gray-500">
              クリックまたはドラッグ&ドロップで変更
            </p>
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              クリックまたはドラッグ&ドロップで画像をアップロード
            </p>
            <p className="text-xs text-gray-500">
              JPG, JPEG, PNG (最大10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
