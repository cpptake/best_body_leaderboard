import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ProtectedRoute from '@/components/ProtectedRoute';
import ImageUploader from '@/components/ImageUploader';
import EvaluationResult from '@/components/EvaluationResult';
import { baselineImageAPI, evaluationAPI } from '@/lib/api';

function EvaluatePage() {
  const router = useRouter();
  const [baselineImages, setBaselineImages] = useState<any[]>([]);
  const [selectedBaselineId, setSelectedBaselineId] = useState<string>('');
  const [comparisonFile, setComparisonFile] = useState<File | null>(null);
  const [comparisonPreview, setComparisonPreview] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);

  // ベースライン画像を取得
  useEffect(() => {
    const fetchBaselineImages = async () => {
      try {
        const response = await baselineImageAPI.getAll(true); // アクティブなもののみ
        setBaselineImages(response.baseline_images || []);

        // デフォルトで最初の画像を選択
        if (response.baseline_images?.length > 0) {
          setSelectedBaselineId(response.baseline_images[0].id);
        }
      } catch (error: any) {
        toast.error('ベースライン画像の取得に失敗しました');
      }
    };

    fetchBaselineImages();
  }, []);

  // 比較画像が選択されたとき
  const handleComparisonFileSelect = (file: File) => {
    setComparisonFile(file);

    // プレビュー用のURLを生成
    const reader = new FileReader();
    reader.onloadend = () => {
      setComparisonPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 評価を実行
  const handleEvaluate = async () => {
    if (!selectedBaselineId) {
      toast.error('ベースライン画像を選択してください');
      return;
    }

    if (!comparisonFile) {
      toast.error('比較対象の画像をアップロードしてください');
      return;
    }

    setIsLoading(true);
    setEvaluationResult(null);

    try {
      const formData = new FormData();
      formData.append('comparison_image', comparisonFile);
      formData.append('baseline_image_id', selectedBaselineId);

      if (customPrompt.trim()) {
        formData.append('custom_prompt', customPrompt);
      }

      const response = await evaluationAPI.create(formData);

      toast.success('評価が完了しました！');
      setEvaluationResult(response);

      // 少し待ってから結果までスクロール
      setTimeout(() => {
        document.getElementById('evaluation-result')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || '評価に失敗しました';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedBaseline = baselineImages.find(
    (img) => img.id === selectedBaselineId
  );

  return (
    <>
      <Head>
        <title>肉体評価 - Best Body Leaderboard</title>
      </Head>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">肉体評価</h1>
        <p className="text-gray-600 mb-8">
          ベースライン画像と比較して、あなたの肉体をAIが評価します
        </p>

        <div className="space-y-8">
          {/* ベースライン画像選択 */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. ベースライン画像を選択
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              評価の基準となる画像を選択してください
            </p>

            {baselineImages.length === 0 ? (
              <p className="text-gray-500">
                ベースライン画像がありません。管理者に連絡してください。
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {baselineImages.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => setSelectedBaselineId(image.id)}
                    className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                      selectedBaselineId === image.id
                        ? 'border-primary-500 ring-2 ring-primary-200'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <div className="aspect-video relative bg-gray-100 rounded-t-lg overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.description || 'ベースライン画像'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {image.description || 'ベースライン画像'}
                      </p>
                      {selectedBaselineId === image.id && (
                        <div className="mt-2 flex items-center text-primary-600 text-sm font-medium">
                          <svg
                            className="w-4 h-4 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          選択中
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 比較画像アップロード */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. あなたの画像をアップロード
            </h2>
            <ImageUploader
              onFileSelect={handleComparisonFileSelect}
              previewUrl={comparisonPreview}
              label="比較対象の画像"
              maxSize={10}
            />
          </div>

          {/* カスタムプロンプト（オプション） */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. カスタムプロンプト（オプション）
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              独自の評価基準を指定したい場合は入力してください（空欄の場合はデフォルトプロンプトを使用）
            </p>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例: 特に肩と背中を重点的に評価してください"
              rows={4}
              className="input"
            />
          </div>

          {/* 評価実行ボタン */}
          <div className="card bg-primary-50 border-2 border-primary-200">
            <button
              onClick={handleEvaluate}
              disabled={isLoading || !selectedBaselineId || !comparisonFile}
              className="w-full btn btn-primary py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  評価中... (30秒ほどかかります)
                </span>
              ) : (
                '評価を実行'
              )}
            </button>

            {isLoading && (
              <p className="text-center text-sm text-gray-600 mt-3">
                AIが画像を分析しています。しばらくお待ちください...
              </p>
            )}
          </div>

          {/* 評価結果 */}
          {evaluationResult && (
            <div id="evaluation-result" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                評価結果
              </h2>
              <EvaluationResult
                baselineImageUrl={selectedBaseline?.image_url || ''}
                comparisonImageUrl={comparisonPreview}
                scores={evaluationResult.scores}
                comments={evaluationResult.comments}
              />

              {/* アクションボタン */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => {
                    setEvaluationResult(null);
                    setComparisonFile(null);
                    setComparisonPreview('');
                    setCustomPrompt('');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-outline"
                >
                  新しい評価を実行
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="btn btn-primary"
                >
                  評価履歴を見る
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Evaluate() {
  return (
    <ProtectedRoute>
      <EvaluatePage />
    </ProtectedRoute>
  );
}
