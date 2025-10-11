import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import ImageUploader from '../components/ImageUploader';
import EvaluationResult from '../components/EvaluationResult';
import UsernameInput from '../components/UsernameInput';
import { evaluateImages } from '../lib/api';

export default function Home() {
  const [username, setUsername] = useState('');
  const [comparisonImage, setComparisonImage] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 評価を実行
  const handleEvaluate = async () => {
    // バリデーション
    if (!username || username.trim() === '') {
      alert('ユーザー名を入力してください');
      return;
    }

    if (!comparisonImage) {
      alert('画像を選択してください');
      return;
    }

    setIsLoading(true);
    setError(null);
    setEvaluationResult(null);

    try {
      // APIを呼び出し（ユーザー名を含む）
      const result = await evaluateImages(comparisonImage, username);

      if (result.success) {
        setEvaluationResult(result);
      } else {
        setError(result.error || '評価に失敗しました');
      }
    } catch (err) {
      setError(err.message || '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // リセット
  const handleReset = () => {
    setUsername('');
    setComparisonImage(null);
    setEvaluationResult(null);
    setError(null);
  };

  return (
    <>
      <Head>
        <title>ボディビルダー画像比較評価</title>
        <meta name="description" content="OpenAI Vision APIを使用したボディビルダー画像の比較評価アプリ" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* ヘッダー */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              💪 ボディビルダー画像比較評価
            </h1>
            <p className="text-gray-600">
              OpenAI Vision APIを使用して2枚の画像を比較評価します
            </p>
            <div className="mt-4">
              <Link href="/leaderboard">
                <span className="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors cursor-pointer">
                  🏆 リーダーボードを見る
                </span>
              </Link>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">❌ {error}</p>
            </div>
          )}

          {/* 評価結果がない場合: 画像アップロードエリア */}
          {!evaluationResult && (
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
              {/* ユーザー名入力 */}
              <UsernameInput
                username={username}
                onUsernameChange={setUsername}
              />

              {/* 2カラムレイアウト: ベースライン画像（左）とアップロード（右）*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* 左側: ベースライン画像 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 text-center">
                    ベースライン画像
                  </h3>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src="/baseline/baseline.jpg"
                      alt="ベースライン画像"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>

                {/* 右側: アップロード */}
                <div className="space-y-4">
                  <ImageUploader
                    label="あなたの画像をアップロード"
                    onImageSelect={setComparisonImage}
                    selectedImage={comparisonImage}
                  />
                </div>
              </div>

              {/* 評価ボタン */}
              <div className="text-center">
                <button
                  onClick={handleEvaluate}
                  disabled={!username || !comparisonImage || isLoading}
                  className={`
                    px-8 py-4 rounded-lg font-semibold text-white text-lg
                    transition-all duration-200
                    ${!username || !comparisonImage || isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 active:scale-95'}
                  `}
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      評価中...
                    </span>
                  ) : (
                    '評価を実行'
                  )}
                </button>

                {isLoading && (
                  <p className="text-sm text-gray-600 mt-4">
                    OpenAI APIで画像を分析中です。しばらくお待ちください...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 評価結果表示 */}
          {evaluationResult && (
            <div>
              <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
                <EvaluationResult result={evaluationResult} />
              </div>

              {/* リセットボタン */}
              <div className="text-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                >
                  新しい評価を開始
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
