import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { isAuthenticated, isAdmin, logout, getUserData } from '@/lib/auth';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const loggedIn = isAuthenticated();
      setIsLoggedIn(loggedIn);

      if (loggedIn) {
        setIsUserAdmin(isAdmin());
        const user = getUserData();
        setUsername(user?.username || '');
      }
    };

    checkAuth();

    // ルート変更時に認証状態を再チェック
    router.events?.on('routeChangeComplete', checkAuth);

    return () => {
      router.events?.off('routeChangeComplete', checkAuth);
    };
  }, [router]);

  // ルート変更時にモバイルメニューを閉じる
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileMenuOpen(false);
    };

    router.events?.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events?.off('routeChangeStart', handleRouteChange);
    };
  }, [router]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const NavLink = ({ href, children }: { href: string; children: ReactNode }) => {
    const isActive = router.pathname === href;
    return (
      <Link
        href={href}
        className={`text-gray-700 hover:text-primary-600 transition-colors ${
          isActive ? 'text-primary-600 font-semibold' : ''
        }`}
      >
        {children}
      </Link>
    );
  };

  const MobileNavLink = ({ href, children }: { href: string; children: ReactNode }) => {
    const isActive = router.pathname === href;
    return (
      <Link
        href={href}
        className={`block px-4 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
          isActive ? 'bg-primary-50 text-primary-600 font-semibold' : ''
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* ロゴ */}
            <Link href="/" className="text-xl md:text-2xl font-bold text-primary-600">
              Best Body Leaderboard
            </Link>

            {/* デスクトップナビゲーション */}
            <div className="hidden lg:flex items-center gap-6">
              {isLoggedIn ? (
                <>
                  <NavLink href="/evaluate">評価</NavLink>
                  <NavLink href="/history">履歴</NavLink>
                  <NavLink href="/leaderboard">ランキング</NavLink>
                  {isUserAdmin && <NavLink href="/admin">管理</NavLink>}
                  <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300">
                    <NavLink href="/profile">{username}</NavLink>
                    <button
                      onClick={handleLogout}
                      className="btn btn-outline text-sm"
                    >
                      ログアウト
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <NavLink href="/leaderboard">ランキング</NavLink>
                  <Link href="/login" className="btn btn-outline text-sm">
                    ログイン
                  </Link>
                  <Link href="/register" className="btn btn-primary text-sm">
                    新規登録
                  </Link>
                </>
              )}
            </div>

            {/* モバイルメニューボタン */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="メニュー"
            >
              {isMobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* モバイルメニュー */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 border-t border-gray-200">
              <div className="py-2">
                {isLoggedIn ? (
                  <>
                    <MobileNavLink href="/evaluate">評価</MobileNavLink>
                    <MobileNavLink href="/history">履歴</MobileNavLink>
                    <MobileNavLink href="/leaderboard">ランキング</MobileNavLink>
                    {isUserAdmin && (
                      <MobileNavLink href="/admin">管理</MobileNavLink>
                    )}
                    <div className="border-t border-gray-200 my-2"></div>
                    <MobileNavLink href="/profile">
                      プロフィール ({username})
                    </MobileNavLink>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <MobileNavLink href="/leaderboard">ランキング</MobileNavLink>
                    <div className="px-4 py-3 space-y-2">
                      <Link
                        href="/login"
                        className="block btn btn-outline text-sm text-center"
                      >
                        ログイン
                      </Link>
                      <Link
                        href="/register"
                        className="block btn btn-primary text-sm text-center"
                      >
                        新規登録
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 bg-gray-50">{children}</main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* アプリ情報 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                Best Body Leaderboard
              </h3>
              <p className="text-sm text-gray-600">
                AI搭載ボディビルダー肉体評価システム
              </p>
            </div>

            {/* リンク */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">リンク</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-primary-600">
                    ホーム
                  </Link>
                </li>
                <li>
                  <Link
                    href="/leaderboard"
                    className="text-gray-600 hover:text-primary-600"
                  >
                    リーダーボード
                  </Link>
                </li>
                {isLoggedIn && (
                  <li>
                    <Link
                      href="/evaluate"
                      className="text-gray-600 hover:text-primary-600"
                    >
                      評価
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* その他 */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">技術</h3>
              <p className="text-sm text-gray-600">
                OpenAI Vision API / Next.js / Flask
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              &copy; 2024 Best Body Leaderboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
