# BestBody LeaderBoard

VLM（Vision Language Model）を審判として体型をスコアリングし、リーダーボードで競い合うWebアプリケーションです。

## 機能

- ユーザー名と体型画像をアップロードして評価
- OpenAI Vision APIで肩・胸・腕・背中・腹筋の5部位を100点満点で評価
- リーダーボードで全ユーザーの最高得点をランキング表示
- AWS S3で画像を管理

## システム構成

```
Nginx (Port 80) → Frontend (Next.js) + Backend (Flask)
                   ↓                    ↓
                PostgreSQL            AWS S3 + OpenAI API
```

## 技術スタック

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Flask 3.0, SQLAlchemy, PostgreSQL 15
- **AI**: OpenAI Vision API
- **Storage**: AWS S3
- **Infrastructure**: Docker, Docker Compose, Nginx

## 本番環境デプロイ手順

### 1. 環境準備

```bash
# Dockerインストール
sudo apt update && sudo apt install -y docker.io docker-compose-v2

# リポジトリクローン
git clone <repository-url> best_body_leaderboard
cd best_body_leaderboard
```

### 2. AWS S3設定

```bash
# バケット作成
aws s3 mb s3://bestbody-leaderboard --region ap-northeast-1

# ベースライン画像アップロード
aws s3 cp /path/to/baseline.jpg s3://bestbody-leaderboard/baseline/baseline.jpg
```

### 3. 環境変数設定

```bash
# .envファイル作成
cp .env.example .env
nano .env
```

**必須の環境変数**:
```bash
OPENAI_API_KEY=sk-proj-xxxxx...
AWS_ACCESS_KEY_ID=AKIAxxxxx...
AWS_SECRET_ACCESS_KEY=xxxxx...
AWS_S3_BUCKET=bestbody-leaderboard
AWS_REGION=ap-northeast-1
```

**本番環境で変更すべき設定**:

1. `docker-compose.yml`:
   - `FLASK_ENV=production`に変更
   - PostgreSQLパスワード変更（`POSTGRES_PASSWORD`）
   - `CORS_ORIGINS`を本番ドメインに変更

2. `frontend/.env.local`:
   - `NEXT_PUBLIC_API_URL=http://your-domain-or-ip`に変更

### 4. 起動

```bash
docker-compose up -d
```

アクセス: `http://your-server-ip/home`

## 開発環境セットアップ

```bash
# 環境変数設定
cp .env.example .env
nano .env  # OpenAI APIキー、AWS認証情報を設定

# 起動
docker-compose up --build

# アクセス
# http://localhost/home (評価画面)
# http://localhost/leaderboard (リーダーボード)
```

## フォルダ構造

```
best_body_leaderboard/
├── backend/              # Flask API
│   ├── models/           # DB モデル
│   ├── services/         # OpenAI 連携
│   ├── utils/            # 画像処理・S3操作
│   ├── app.py
│   └── config.py
├── frontend/             # Next.js UI
│   └── src/
│       ├── components/
│       ├── pages/
│       └── lib/
├── nginx/
│   └── nginx.conf
└── docker-compose.yml
```

## 環境変数一覧

### 必須（ルート .env）

| 変数 | 説明 | 例 |
|------|------|-----|
| `OPENAI_API_KEY` | OpenAI APIキー | `sk-proj-...` |
| `AWS_ACCESS_KEY_ID` | AWS アクセスキー | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS シークレットキー | - |
| `AWS_S3_BUCKET` | S3バケット名 | `bestbody-leaderboard` |

### 本番環境で変更推奨

| ファイル | 変数 | 変更内容 |
|---------|------|---------|
| `docker-compose.yml` | `FLASK_ENV` | `production` |
| `docker-compose.yml` | `POSTGRES_PASSWORD` | 強力なパスワード |
| `docker-compose.yml` | `CORS_ORIGINS` | 本番ドメイン |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL` | 本番URL |

## APIエンドポイント

- `GET /health` - ヘルスチェック
- `GET /api/baseline-image` - ベースライン画像取得
- `POST /api/evaluate` - 画像評価（username, comparison_image）
- `GET /api/leaderboard?page=1&per_page=20` - リーダーボード取得
- `GET /api/leaderboard/user/<username>` - ユーザー履歴

## トラブルシューティング

```bash
# ログ確認
docker-compose logs -f backend

# コンテナ再起動
docker-compose restart

# データベースリセット
docker-compose down -v && docker-compose up -d

# コンテナに接続
docker-compose exec backend bash
docker-compose exec db psql -U bodybuilder -d bodybuilder_db
```

よくある問題:
- **OpenAI APIエラー**: APIキー確認、クレジット残高確認
- **S3エラー**: AWS認証情報確認、バケット名・リージョン確認
- **DB接続エラー**: `docker-compose ps db`で起動確認
