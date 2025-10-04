# Frontend - Next.js Application

Best Body Leaderboard のフロントエンドアプリケーション

## 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **Axios** - HTTP通信
- **React Query** - データフェッチング・キャッシング
- **React Hook Form** - フォーム管理
- **React Hot Toast** - トースト通知
- **js-cookie** - Cookie管理

## プロジェクト構造

```
frontend/
├── public/                 # 静的ファイル
├── src/
│   ├── components/        # 再利用可能なコンポーネント
│   │   └── Layout.tsx     # レイアウトコンポーネント
│   ├── pages/             # Next.jsページ
│   │   ├── _app.tsx       # アプリケーションルート
│   │   ├── _document.tsx  # ドキュメント設定
│   │   ├── index.tsx      # ホームページ
│   │   ├── login.tsx      # ログインページ（TODO）
│   │   ├── register.tsx   # 登録ページ（TODO）
│   │   ├── evaluate.tsx   # 評価ページ（TODO）
│   │   ├── history.tsx    # 履歴ページ（TODO）
│   │   ├── leaderboard.tsx # リーダーボードページ（TODO）
│   │   ├── profile.tsx    # プロフィールページ（TODO）
│   │   └── admin/         # 管理者ページ（TODO）
│   ├── lib/               # ユーティリティ・ライブラリ
│   │   ├── api.ts         # API通信レイヤー
│   │   └── auth.ts        # 認証ユーティリティ
│   ├── hooks/             # カスタムフック（TODO）
│   ├── contexts/          # Reactコンテキスト（TODO）
│   ├── types/             # 型定義（TODO）
│   └── styles/
│       └── globals.css    # グローバルスタイル
├── .env.local             # 環境変数
├── next.config.js         # Next.js設定
├── tailwind.config.js     # Tailwind CSS設定
└── tsconfig.json          # TypeScript設定
```

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

環境変数を編集:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

## API通信

### Axiosインスタンス (`src/lib/api.ts`)

- ベースURL自動設定
- JWTトークン自動付与
- 401エラー時の自動ログアウト
- エラーハンドリング

### 使用例

```typescript
import { authAPI, evaluationAPI, leaderboardAPI } from '@/lib/api';

// ログイン
const response = await authAPI.login({ username, password });

// 評価作成
const formData = new FormData();
formData.append('comparison_image', file);
const result = await evaluationAPI.create(formData);

// リーダーボード取得
const leaderboard = await leaderboardAPI.getLeaderboard(1, 20);
```

## 認証管理

### トークン管理 (`src/lib/auth.ts`)

- Cookieでトークン保存（7日間有効）
- LocalStorageでユーザー情報保存
- ログイン/ログアウト機能

### 使用例

```typescript
import { login, logout, isAuthenticated, getUserData } from '@/lib/auth';

// ログイン
login(token, userData);

// 認証状態チェック
if (isAuthenticated()) {
  // 認証済み
}

// ユーザー情報取得
const user = getUserData();

// ログアウト
logout();
```

## スタイリング

### Tailwind CSS

- ユーティリティクラスベース
- カスタムコンポーネントクラス定義済み
  - `.btn`, `.btn-primary`, `.btn-secondary` など
  - `.input`, `.card`, `.label` など

### カスタムクラス

```tsx
// ボタン
<button className="btn btn-primary">送信</button>

// 入力フィールド
<input className="input" />

// カード
<div className="card">...</div>
```

## ページ一覧

### 実装済み

- ✅ `/` - ホームページ
- ✅ レイアウトコンポーネント

### 未実装（TODO）

- [ ] `/login` - ログインページ
- [ ] `/register` - 新規登録ページ
- [ ] `/evaluate` - 評価ページ
- [ ] `/history` - 評価履歴ページ
- [ ] `/leaderboard` - リーダーボードページ
- [ ] `/profile` - プロフィールページ
- [ ] `/admin` - 管理者ページ

## ビルド・デプロイ

### 本番ビルド

```bash
npm run build
```

### 本番サーバー起動

```bash
npm start
```

### Lint

```bash
npm run lint
```

## 開発ガイドライン

1. **TypeScript使用**: 型安全性を確保
2. **コンポーネント分割**: 再利用可能なコンポーネントを作成
3. **React Query使用**: データフェッチングとキャッシング
4. **React Hook Form使用**: フォーム管理
5. **Tailwind CSS使用**: スタイリング
6. **エラーハンドリング**: try-catchとトースト通知

## 次のステップ

以下のページを実装する必要があります：

1. **認証ページ** - ログイン、登録
2. **評価ページ** - 画像アップロード、評価実行
3. **履歴ページ** - 評価履歴表示
4. **リーダーボードページ** - ランキング表示
5. **プロフィールページ** - ユーザー情報編集
6. **管理者ページ** - ベースライン画像管理
