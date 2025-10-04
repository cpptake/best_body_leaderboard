import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import AdminGuard from '@/components/AdminGuard';
import BaselineImageCard from '@/components/BaselineImageCard';
import Modal, { ConfirmModal } from '@/components/Modal';
import ImageUploader from '@/components/ImageUploader';
import { baselineImageAPI } from '@/lib/api';

interface BaselineImage {
  id: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

function BaselineManagementPage() {
  const router = useRouter();
  const [baselineImages, setBaselineImages] = useState<BaselineImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // アップロードモーダル
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 編集モーダル
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<BaselineImage | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 削除確認モーダル
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // ベースライン画像一覧を取得
  const fetchBaselineImages = async () => {
    setIsLoading(true);
    try {
      const response = await baselineImageAPI.getAll();
      setBaselineImages(response.baseline_images || []);
    } catch (error: any) {
      toast.error('ベースライン画像の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselineImages();
  }, []);

  // アクティブ状態を切り替え
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await baselineImageAPI.update(id, { is_active: isActive });
      toast.success(
        isActive ? 'アクティブにしました' : '非アクティブにしました'
      );
      fetchBaselineImages();
    } catch (error: any) {
      toast.error('ステータスの更新に失敗しました');
    }
  };

  // 編集モーダルを開く
  const handleOpenEditModal = (image: BaselineImage) => {
    setEditingImage(image);
    setEditDescription(image.description);
    setIsEditModalOpen(true);
  };

  // 編集を保存
  const handleSaveEdit = async () => {
    if (!editingImage || !editDescription.trim()) {
      toast.error('説明文を入力してください');
      return;
    }

    setIsUpdating(true);
    try {
      await baselineImageAPI.update(editingImage.id, {
        description: editDescription,
      });
      toast.success('更新しました');
      setIsEditModalOpen(false);
      setEditingImage(null);
      setEditDescription('');
      fetchBaselineImages();
    } catch (error: any) {
      toast.error('更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  // 削除確認モーダルを開く
  const handleOpenDeleteModal = (id: string) => {
    setDeletingImageId(id);
    setIsDeleteModalOpen(true);
  };

  // 削除を実行
  const handleConfirmDelete = async () => {
    if (!deletingImageId) return;

    try {
      await baselineImageAPI.delete(deletingImageId);
      toast.success('削除しました');
      setIsDeleteModalOpen(false);
      setDeletingImageId(null);
      fetchBaselineImages();
    } catch (error: any) {
      toast.error('削除に失敗しました');
    }
  };

  // アップロードモーダルを開く
  const handleOpenUploadModal = () => {
    setUploadFile(null);
    setUploadDescription('');
    setIsUploadModalOpen(true);
  };

  // アップロードを実行
  const handleUpload = async () => {
    if (!uploadFile || !uploadDescription.trim()) {
      toast.error('画像と説明文を入力してください');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('description', uploadDescription);

      await baselineImageAPI.create(formData);
      toast.success('アップロードしました');
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      fetchBaselineImages();
    } catch (error: any) {
      toast.error('アップロードに失敗しました');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>ベースライン画像管理 - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ベースライン画像管理
            </h1>
            <p className="text-gray-600">
              評価の基準となる画像を管理します
            </p>
          </div>
          <button
            onClick={handleOpenUploadModal}
            className="btn btn-primary"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規追加
          </button>
        </div>

        {/* ローディング */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* ベースライン画像一覧 */}
        {!isLoading && baselineImages.length === 0 && (
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
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              ベースライン画像がありません
            </h3>
            <p className="text-gray-600 mb-6">
              最初のベースライン画像をアップロードしましょう
            </p>
            <button
              onClick={handleOpenUploadModal}
              className="btn btn-primary"
            >
              画像をアップロード
            </button>
          </div>
        )}

        {!isLoading && baselineImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {baselineImages.map((image) => (
              <BaselineImageCard
                key={image.id}
                image={image}
                onToggleActive={handleToggleActive}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))}
          </div>
        )}

        {/* アップロードモーダル */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="新規ベースライン画像"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像を選択
              </label>
              <ImageUploader
                onImageSelect={(file) => setUploadFile(file)}
                onImageRemove={() => setUploadFile(null)}
              />
            </div>

            <div>
              <label
                htmlFor="upload-description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明文
              </label>
              <input
                id="upload-description"
                type="text"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                placeholder="例: クリス・バムステッド 2023"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="btn btn-outline"
                disabled={isUploading}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpload}
                className="btn btn-primary"
                disabled={isUploading || !uploadFile || !uploadDescription.trim()}
              >
                {isUploading ? 'アップロード中...' : 'アップロード'}
              </button>
            </div>
          </div>
        </Modal>

        {/* 編集モーダル */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="ベースライン画像を編集"
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                説明文
              </label>
              <input
                id="edit-description"
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="btn btn-outline"
                disabled={isUpdating}
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveEdit}
                className="btn btn-primary"
                disabled={isUpdating || !editDescription.trim()}
              >
                {isUpdating ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </Modal>

        {/* 削除確認モーダル */}
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="ベースライン画像を削除"
          message="このベースライン画像を削除してもよろしいですか？この操作は取り消せません。"
          confirmText="削除"
        />
      </div>
    </Layout>
  );
}

export default function BaselineManagement() {
  return (
    <AdminGuard>
      <BaselineManagementPage />
    </AdminGuard>
  );
}
