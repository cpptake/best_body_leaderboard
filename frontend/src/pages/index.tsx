import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import RankBadge from '@/components/RankBadge';
import { useAuth } from '@/contexts/AuthContext';
import { leaderboardAPI } from '@/lib/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  highest_score: number;
}

export default function Home() {
  const { isLoggedIn } = useAuth();
  const [topFive, setTopFive] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  // トップ5を取得
  useEffect(() => {
    const fetchTopFive = async () => {
      try {
        const response = await leaderboardAPI.get(1, 5, 'all', undefined);
        setTopFive(response.leaderboard || []);
      } catch (error) {
        console.error('Failed to fetch top 5:', error);
      } finally {
        setIsLoadingLeaderboard(false);
      }
    };

    fetchTopFive();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Best Body Leaderboard - AI肉体評価システム</title>
        <meta
          name="description"
          content="OpenAI Vision APIを使用した、ボディビルダー肉体評価アプリケーション。AIがあなたの肉体を多角的に分析し、ランキングで競い合おう！"
        />
      </Head>

      {/* ヒーローセクション */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Best Body Leaderboard
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              AIがあなたの肉体を評価。世界中のユーザーと競い合おう！
            </p>
            <p className="text-lg mb-10 text-primary-50">
              OpenAI Vision APIを活用した、次世代のボディビルダー評価システム
            </p>

            {!isLoggedIn ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-10 py-4 font-semibold"
                >
                  無料で始める
                </Link>
                <Link
                  href="/login"
                  className="btn bg-primary-700 text-white border-2 border-white hover:bg-primary-600 text-lg px-10 py-4"
                >
                  ログイン
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/evaluate"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-10 py-4 font-semibold"
                >
                  今すぐ評価する
                </Link>
                <Link
                  href="/leaderboard"
                  className="btn bg-primary-700 text-white border-2 border-white hover:bg-primary-600 text-lg px-10 py-4"
                >
                  ランキングを見る
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 特徴セクション */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              主な機能
            </h2>
            <p className="text-xl text-gray-600">
              AIによる精密な評価システムで、あなたの肉体を多角的に分析
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* AI評価 */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                AI精密評価
              </h3>
              <p className="text-gray-600 mb-4">
                OpenAI Vision APIが5つの部位を分析し、詳細なフィードバックを提供
              </p>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  肩・胸・腕・背中・腹筋を個別評価
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ベースライン画像との相対評価
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  詳細なAI評価コメント付き
                </li>
              </ul>
            </div>

            {/* リーダーボード */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                競争的ランキング
              </h3>
              <p className="text-gray-600 mb-4">
                全ユーザーとスコアで競い合い、トップを目指そう
              </p>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  リアルタイムランキング更新
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  期間・基準画像でフィルタリング
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  トップ3は特別なメダル表示
                </li>
              </ul>
            </div>

            {/* 評価履歴 */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-8 h-8 text-blue-600"
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
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                評価履歴の追跡
              </h3>
              <p className="text-gray-600 mb-4">
                過去の評価結果を一覧表示し、進捗を確認
              </p>
              <ul className="text-sm text-gray-600 text-left space-y-2">
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  時系列で評価を確認
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  部位別スコアの詳細表示
                </li>
                <li className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  画像とコメント付き
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* リーダーボードプレビュー */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                現在のトップ5
              </h2>
              <p className="text-xl text-gray-600">
                最高スコアを獲得したユーザーたち
              </p>
            </div>

            {isLoadingLeaderboard ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : topFive.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  まだランキングがありません。最初のエントリーになろう！
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl overflow-hidden">
                  {topFive.map((entry, index) => {
                    const isTopThree = entry.rank <= 3;
                    return (
                      <div
                        key={entry.username}
                        className={`flex items-center justify-between p-6 ${
                          index !== topFive.length - 1
                            ? 'border-b border-gray-200'
                            : ''
                        } ${
                          isTopThree ? 'bg-yellow-50' : 'bg-white'
                        } hover:bg-primary-50 transition-colors`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <RankBadge rank={entry.rank} size="lg" />
                          <span
                            className={`font-semibold ${
                              isTopThree
                                ? 'text-xl text-gray-900'
                                : 'text-lg text-gray-800'
                            }`}
                          >
                            {entry.username}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            スコア
                          </div>
                          <div
                            className={`font-bold ${
                              entry.highest_score > 20
                                ? 'text-green-600 text-2xl'
                                : entry.highest_score > 0
                                ? 'text-blue-600 text-xl'
                                : 'text-gray-600 text-xl'
                            }`}
                          >
                            {entry.highest_score > 0 ? '+' : ''}
                            {entry.highest_score}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center mt-8">
                  <Link href="/leaderboard" className="btn btn-primary text-lg">
                    全ランキングを見る
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CTAセクション */}
      <div className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              今すぐ始めよう
            </h2>
            <p className="text-xl mb-10 text-primary-100">
              無料で登録して、AIがあなたの肉体を評価します
            </p>

            {!isLoggedIn ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-10 py-4 font-semibold"
                >
                  無料で始める
                </Link>
                <Link
                  href="/leaderboard"
                  className="btn bg-primary-700 text-white border-2 border-white hover:bg-primary-600 text-lg px-10 py-4"
                >
                  ランキングを見る
                </Link>
              </div>
            ) : (
              <Link
                href="/evaluate"
                className="btn bg-white text-primary-700 hover:bg-primary-50 text-lg px-10 py-4 font-semibold inline-flex items-center gap-2"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                今すぐ評価する
              </Link>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
