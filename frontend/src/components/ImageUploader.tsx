import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl?: string;
  label?: string;
  maxSize?: number; // MB
  allowedTypes?: string[];
}

export default function ImageUploader({
  onFileSelect,
  previewUrl,
  label = '画像をアップロード',
  maxSize = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'],
}: ImageUploaderProps) {
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError('');

      // ファイルが拒否された場合
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError(`ファイルサイズは${maxSize}MB以下にしてください`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('JPG, PNGファイルのみアップロード可能です');
        } else {
          setError('ファイルのアップロードに失敗しました');
        }
        return;
      }

      // 受け入れられたファイル
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];

        // 追加のバリデーション
        if (!allowedTypes.includes(file.type)) {
          setError('JPG, PNGファイルのみアップロード可能です');
          return;
        }

        if (file.size > maxSize * 1024 * 1024) {
          setError(`ファイルサイズは${maxSize}MB以下にしてください`);
          return;
        }

        onFileSelect(file);
      }
    },
    [onFileSelect, maxSize, allowedTypes]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: maxSize * 1024 * 1024,
    multiple: false,
  });

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={previewUrl}
                alt="プレビュー"
                fill
                className="object-contain"
              />
            </div>
            <p className="text-sm text-gray-600">
              クリックまたはドラッグ&ドロップで画像を変更
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
            <div className="text-gray-600">
              {isDragActive ? (
                <p className="font-medium text-primary-600">
                  ここにドロップしてください
                </p>
              ) : (
                <>
                  <p className="font-medium">
                    クリックして画像を選択、またはドラッグ&ドロップ
                  </p>
                  <p className="text-sm mt-1">
                    JPG, PNG（最大{maxSize}MB）
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="error-message mt-2">{error}</p>}
    </div>
  );
}
