# ボディビルダー肉体評価アプリケーション

OpenAI Vision APIを使用して、ボディビルダーの肉体を多角的に評価するWebアプリケーション。

## 技術スタック

- **フロントエンド**: React / Next.js (TypeScript)
- **バックエンド**: Flask (Python)
- **リバースプロキシ**: Nginx
- **データベース**: PostgreSQL
- **画像ストレージ**: AWS S3
- **AI API**: OpenAI Vision API (GPT-4 Vision)
- **認証**: JWT (JSON Web Token)

## プロジェクト構造

```
/project-root
  /nginx              # Nginxの設定ファイル
  /frontend           # Next.jsアプリケーション
    /public
    /src
      /components     # UIコンポーネント
      /pages          # ページコンポーネント
      /api            # API呼び出しロジック
      /utils          # ユーティリティ関数
  /backend            # Flask API サーバー
    /routes           # APIエンドポイント (Blueprint)
    /controllers      # ビジネスロジック
    /models           # データモデル (SQLAlchemy)
    /services         # 外部サービス連携 (OpenAI, S3等)
    /middleware       # 認証・エラーハンドリング等
    /utils            # ユーティリティ関数
    app.py            # Flaskアプリケーションエントリーポイント
    requirements.txt  # Python依存パッケージ
  /database           # DB関連
    /migrations       # マイグレーションファイル
    /seeds            # 初期データ
    /schema.sql       # スキーマ定義
  /docs               # ドキュメント
  docker-compose.yml
  .env.example
  README.md
  claude.md
```

## セットアップ

### 前提条件

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- AWS アカウント (S3使用)
- OpenAI API キー

### 環境変数の設定

1. `.env.example` をコピーして `.env` を作成:
   ```bash
   cp .env.example .env
   ```

2. `.env` ファイルを編集し、必要な環境変数を設定:
   - `OPENAI_API_KEY`: OpenAI APIキー
   - `DATABASE_URL`: PostgreSQL接続URL
   - `AWS_S3_BUCKET`: S3バケット名
   - `AWS_ACCESS_KEY_ID`: AWS認証情報
   - `AWS_SECRET_ACCESS_KEY`: AWS認証情報
   - `SECRET_KEY`: Flaskセッション用シークレットキー
   - `JWT_SECRET_KEY`: JWT署名用シークレットキー

### バックエンドのセットアップ

```bash
cd backend

# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

# 依存パッケージのインストール
pip install -r requirements.txt

# データベースマイグレーション
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# 開発サーバーの起動
flask run
```

### フロントエンドのセットアップ

```bash
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

## 主要機能

### 1. 画像評価
- ベースライン画像と比較対象画像の2枚をアップロード
- OpenAI Vision APIによる5部位の評価（肩・胸・腕・背中・腹）
- 各部位を-10〜+10点で相対評価
- 総合得点（-50〜+50点）を算出

### 2. 評価履歴
- ユーザーごとの過去の評価結果を時系列で表示
- 部位別得点とコメントの確認
- 画像のサムネイル表示

### 3. リーダーボード
- 全ユーザーの最高得点をランキング表示
- フィルタリング機能（期間指定、ベースライン画像別）
- ページネーション対応

### 4. ユーザー管理
- ユーザー登録・ログイン・ログアウト
- プロフィール編集
- JWT認証

### 5. ベースライン画像管理（管理者機能）
- ベースライン画像の登録・変更（管理者のみ）
- 複数のベースライン画像管理
- アクティブなベースライン画像の切り替え

## API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### 画像評価
- `POST /api/evaluate` - 画像評価実行
- `GET /api/evaluations` - 評価履歴取得
- `GET /api/evaluations/:id` - 特定評価の詳細取得

### リーダーボード
- `GET /api/leaderboard` - ランキング取得

### ベースライン画像
- `GET /api/baseline-images` - ベースライン画像一覧
- `GET /api/baseline-images/active` - アクティブなベースライン画像
- `POST /api/baseline-images` - ベースライン画像登録（管理者のみ）
- `PUT /api/baseline-images/:id` - ベースライン画像更新（管理者のみ）

### ユーザー
- `GET /api/users/me` - プロフィール取得
- `PUT /api/users/me` - プロフィール更新

## セキュリティ

- パスワードは bcrypt でハッシュ化
- JWT トークンで API 認証
- 画像アップロード時のファイルサイズ・形式バリデーション
- CORS 設定
- SQL injection 対策（SQLAlchemy ORM使用）
- 管理者権限チェック

## テスト

```bash
# バックエンドのテスト
cd backend
pytest

# フロントエンドのテスト
cd frontend
npm test
```

## デプロイ

詳細は `docs/deployment.md` を参照してください。

## ライセンス

MIT

## 開発者

[Your Name]
