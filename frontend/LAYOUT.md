# レイアウト & ナビゲーションドキュメント

## 概要

Best Body Leaderboardのレイアウトとナビゲーションシステムは、レスポンシブデザインとグローバル認証状態管理を実装しています。

## コンポーネント構成

### 1. Layout Component (`components/Layout.tsx`)

アプリケーション全体の共通レイアウトを提供。

**主な機能:**
- ✅ レスポンシブヘッダー（デスクトップ/モバイル）
- ✅ スティッキーヘッダー（スクロール時も固定）
- ✅ アクティブリンクのハイライト
- ✅ モバイルメニュー（ハンバーガーメニュー）
- ✅ 認証状態に応じたナビゲーション切り替え
- ✅ ログイン済みユーザー名表示
- ✅ ログアウト機能
- ✅ フッター（3カラムレイアウト）

**ブレークポイント:**
- `lg` (1024px以上): デスクトップナビゲーション表示
- `lg未満`: モバイルメニュー表示

### 2. AuthContext (`contexts/AuthContext.tsx`)

グローバルな認証状態を管理するReact Context。

**提供される値:**
- `isLoggedIn`: ログイン状態（boolean）
- `isAdmin`: 管理者権限（boolean）
- `user`: ユーザー情報（UserData | null）
- `loading`: ロード中フラグ（boolean）
- `logout()`: ログアウト関数
- `refreshAuth()`: 認証状態を再取得

**使用例:**
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isLoggedIn, user, logout } = useAuth();

  if (isLoggedIn) {
    return <div>ようこそ、{user?.username}さん</div>;
  }

  return <div>ログインしてください</div>;
}
```

## ナビゲーション構成

### デスクトップナビゲーション

#### ログイン済み
- **ホーム** (ロゴリンク)
- **評価** → `/evaluate`
- **履歴** → `/history`
- **ランキング** → `/leaderboard`
- **管理** → `/admin` (管理者のみ)
- **ユーザー名** → `/profile`
- **ログアウトボタン**

#### 未ログイン
- **ホーム** (ロゴリンク)
- **ランキング** → `/leaderboard`
- **ログインボタン** → `/login`
- **新規登録ボタン** → `/register`

### モバイルナビゲーション

ハンバーガーメニューから展開。

#### ログイン済み
- 評価
- 履歴
- ランキング
- 管理（管理者のみ）
- --- (区切り線) ---
- プロフィール (ユーザー名)
- ログアウト（赤色）

#### 未ログイン
- ランキング
- ログインボタン
- 新規登録ボタン

## レスポンシブデザイン

### ヘッダー

```tsx
// ロゴサイズ
<Link className="text-xl md:text-2xl">  // モバイル: xl, デスクトップ: 2xl

// デスクトップナビゲーション（1024px以上で表示）
<div className="hidden lg:flex">

// モバイルメニューボタン（1024px未満で表示）
<button className="lg:hidden">
```

### フッター

```tsx
// 3カラムレイアウト（モバイルは1カラム）
<div className="grid grid-cols-1 md:grid-cols-3">
```

### コンテナ

```tsx
// 中央寄せ、左右パディング
<div className="container mx-auto px-4">
```

## アクティブリンクのスタイリング

現在のページに応じてナビゲーションリンクの色と太さを変更。

```tsx
const NavLink = ({ href, children }) => {
  const isActive = router.pathname === href;
  return (
    <Link
      className={`text-gray-700 hover:text-primary-600 ${
        isActive ? 'text-primary-600 font-semibold' : ''
      }`}
    >
      {children}
    </Link>
  );
};
```

## フッター構成

### 3カラムレイアウト

1. **アプリ情報**
   - アプリ名
   - 説明文

2. **リンク**
   - ホーム
   - リーダーボード
   - 評価（ログイン時のみ）

3. **技術情報**
   - 使用技術の表示

### コピーライト
- 最下部に中央寄せで表示

## 認証状態の自動更新

### ルート変更時の更新

LayoutコンポーネントとAuthContextの両方で、ルート変更時に認証状態を自動的に再チェック。

```tsx
useEffect(() => {
  router.events?.on('routeChangeComplete', checkAuth);
  return () => {
    router.events?.off('routeChangeComplete', checkAuth);
  };
}, [router]);
```

### モバイルメニューの自動クローズ

ルート変更開始時にモバイルメニューを自動的に閉じる。

```tsx
router.events?.on('routeChangeStart', handleRouteChange);
```

## アプリケーション統合

### _app.tsx

全ページでAuthProviderをラップ。

```tsx
<QueryClientProvider client={queryClient}>
  <AuthProvider>
    <Component {...pageProps} />
  </AuthProvider>
</QueryClientProvider>
```

### ページでの使用

#### 通常のページ（Layout付き）
```tsx
import Layout from '@/components/Layout';

export default function MyPage() {
  return (
    <Layout>
      <div>コンテンツ</div>
    </Layout>
  );
}
```

#### 保護されたページ
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>保護されたコンテンツ</div>
    </ProtectedRoute>
  );
}
```

## カスタマイズ

### 色の変更

`tailwind.config.js` で primary カラーをカスタマイズ:

```js
colors: {
  primary: {
    50: '#f0f9ff',
    // ... その他の色
    600: '#0284c7',  // メインカラー
  },
}
```

### ブレークポイントの変更

`lg` ブレークポイント（1024px）を変更したい場合:

```tsx
// Layout.tsx で lg を md や xl に変更
<div className="hidden lg:flex">  // lg を md に変更
<button className="lg:hidden">    // lg を md に変更
```

### メニュー項目の追加

ナビゲーションに新しいリンクを追加:

```tsx
// デスクトップナビゲーション
<NavLink href="/new-page">新しいページ</NavLink>

// モバイルナビゲーション
<MobileNavLink href="/new-page">新しいページ</MobileNavLink>
```

## アクセシビリティ

- ✅ セマンティックHTML（header, nav, main, footer）
- ✅ aria-label属性（メニューボタン）
- ✅ キーボードナビゲーション対応
- ✅ ホバー・フォーカス状態の視覚的フィードバック

## パフォーマンス最適化

- ✅ スティッキーヘッダー（`sticky top-0`）
- ✅ ルート変更時のイベントリスナー適切なクリーンアップ
- ✅ 条件付きレンダリング（認証状態に応じて）
- ✅ Tailwind CSSによるCSS最適化

## トラブルシューティング

### モバイルメニューが閉じない

ルート変更イベントが正しく設定されているか確認:

```tsx
router.events?.on('routeChangeStart', handleRouteChange);
```

### 認証状態が更新されない

AuthProviderが_app.tsxで正しくラップされているか確認。

### アクティブリンクのスタイルが適用されない

`router.pathname` が正しいパスと一致しているか確認:

```tsx
console.log('Current path:', router.pathname);
```

## 今後の拡張

以下の機能を追加予定:

- [ ] 通知機能（ヘッダーにベルアイコン）
- [ ] 検索機能（グローバル検索バー）
- [ ] ダークモード切り替え
- [ ] 多言語対応（i18n）
- [ ] パンくずリスト
