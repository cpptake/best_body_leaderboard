# 認証システムドキュメント

## 概要

Best Body Leaderboard の認証システムは JWT (JSON Web Token) を使用しています。

## 実装済みページ

### 1. ログインページ (`/login`)

**機能:**
- ユーザー名とパスワードでログイン
- フォームバリデーション（react-hook-form）
- エラーメッセージ表示
- ログイン成功時に `/evaluate` にリダイレクト
- 新規登録ページへのリンク

**使用方法:**
```typescript
// ログイン処理
const response = await authAPI.login({ username, password });
authLogin(response.access_token, response.user);
router.push('/evaluate');
```

### 2. 新規登録ページ (`/register`)

**機能:**
- ユーザー名とパスワードで登録
- パスワード確認入力
- フォームバリデーション
  - ユーザー名: 3〜20文字、英数字とアンダースコアのみ
  - パスワード: 6文字以上
  - パスワード確認: 一致確認
- 登録成功時に自動ログイン
- ログインページへのリンク

**使用方法:**
```typescript
// 登録処理
const response = await authAPI.register({ username, password });
authLogin(response.access_token, response.user);
router.push('/evaluate');
```

## 認証コンポーネント

### AuthGuard

未認証ユーザーをログインページにリダイレクトするコンポーネント。

**Props:**
- `children`: React要素
- `requireAdmin`: 管理者権限が必要か（デフォルト: false）

**使用例:**
```tsx
<AuthGuard>
  <YourComponent />
</AuthGuard>

// 管理者専用
<AuthGuard requireAdmin={true}>
  <AdminComponent />
</AuthGuard>
```

### ProtectedRoute

AuthGuard と Layout を組み合わせた便利なラッパーコンポーネント。

**Props:**
- `children`: React要素
- `requireAdmin`: 管理者権限が必要か（デフォルト: false）
- `useLayout`: Layoutを使用するか（デフォルト: true）

**使用例:**
```tsx
// 通常の保護されたページ
export default function MyPage() {
  return (
    <ProtectedRoute>
      <PageContent />
    </ProtectedRoute>
  );
}

// 管理者専用ページ
export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminContent />
    </ProtectedRoute>
  );
}
```

## 認証ユーティリティ (`lib/auth.ts`)

### トークン管理

```typescript
// トークン保存（Cookieに7日間保存）
setAuthToken(token);

// トークン取得
const token = getAuthToken();

// トークン削除
clearAuthToken();
```

### ユーザーデータ管理

```typescript
// ユーザーデータ保存（LocalStorage）
setUserData(user);

// ユーザーデータ取得
const user = getUserData();

// ユーザーデータ削除
clearUserData();
```

### 認証状態チェック

```typescript
// 認証済みかチェック
if (isAuthenticated()) {
  // 認証済み
}

// 管理者かチェック
if (isAdmin()) {
  // 管理者
}
```

### ログイン・ログアウト

```typescript
// ログイン
login(token, userData);

// ログアウト（トークン削除 + ログインページにリダイレクト）
logout();
```

## セキュリティ

### Cookie設定

- `expires`: 7日間
- `sameSite`: 'strict'
- `secure`: 本番環境でのみtrue（HTTPS必須）

### API通信

- Axiosインターセプターで自動的にJWTトークンを付与
- 401エラー時に自動ログアウト

```typescript
// リクエストインターセプター
config.headers.Authorization = `Bearer ${token}`;

// レスポンスインターセプター
if (error.response?.status === 401) {
  clearAuthToken();
  window.location.href = '/login';
}
```

## 保護されたページ一覧

| ページ | パス | 認証 | 管理者権限 |
|--------|------|------|-----------|
| ホーム | `/` | 不要 | - |
| ログイン | `/login` | 不要 | - |
| 新規登録 | `/register` | 不要 | - |
| リーダーボード | `/leaderboard` | 不要 | - |
| 評価 | `/evaluate` | ✅ 必要 | - |
| 履歴 | `/history` | ✅ 必要 | - |
| プロフィール | `/profile` | ✅ 必要 | - |
| 管理者 | `/admin` | ✅ 必要 | ✅ 必要 |

## フロー図

### ログインフロー

```
1. ユーザーがログインページにアクセス
   ↓
2. ユーザー名とパスワードを入力
   ↓
3. authAPI.login() でAPIにリクエスト
   ↓
4. 成功時: トークンとユーザー情報を保存
   ↓
5. /evaluate にリダイレクト
```

### 新規登録フロー

```
1. ユーザーが登録ページにアクセス
   ↓
2. ユーザー名、パスワード、確認用パスワードを入力
   ↓
3. authAPI.register() でAPIにリクエスト
   ↓
4. 成功時: トークンとユーザー情報を保存（自動ログイン）
   ↓
5. /evaluate にリダイレクト
```

### 認証チェックフロー

```
1. 保護されたページにアクセス
   ↓
2. AuthGuardが認証状態をチェック
   ↓
3a. 認証済み → ページを表示
3b. 未認証 → /login にリダイレクト
```

### ログアウトフロー

```
1. ヘッダーのログアウトボタンをクリック
   ↓
2. logout() を実行
   ↓
3. トークンとユーザー情報を削除
   ↓
4. /login にリダイレクト
```

## テスト用アカウント

バックエンドの `init_db.py` で作成される管理者アカウント:

- **ユーザー名**: `admin`
- **パスワード**: `admin123`
- **権限**: 管理者

## トラブルシューティング

### ログインできない

1. バックエンドが起動しているか確認
2. 環境変数 `NEXT_PUBLIC_API_URL` が正しいか確認
3. ブラウザのコンソールでエラーを確認

### リダイレクトループが発生

1. Cookieが正しく保存されているか確認
2. ブラウザのCookieをクリアして再度ログイン

### 401エラーが頻発

1. トークンの有効期限（24時間）を確認
2. バックエンドのJWT設定を確認
