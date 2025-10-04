# Backend API

Flask-based REST API for the Best Body Leaderboard application.

## ディレクトリ構造

```
backend/
  ├── app.py              # アプリケーションエントリーポイント
  ├── config.py           # 設定ファイル
  ├── init_db.py          # データベース初期化スクリプト
  ├── requirements.txt    # Python依存パッケージ
  ├── models/             # データモデル（SQLAlchemy）
  │   ├── __init__.py
  │   ├── user.py
  │   ├── baseline_image.py
  │   ├── comparison_image.py
  │   └── evaluation.py
  ├── routes/             # APIエンドポイント（Blueprint）
  │   ├── __init__.py
  │   ├── auth.py         # 認証関連
  │   ├── evaluate.py     # 評価関連
  │   ├── leaderboard.py  # リーダーボード
  │   ├── baseline_images.py  # ベースライン画像管理
  │   └── users.py        # ユーザー管理
  ├── middleware/         # ミドルウェア
  │   ├── __init__.py
  │   ├── auth.py         # JWT認証
  │   └── error_handler.py  # エラーハンドリング
  ├── services/           # 外部サービス連携（TODO）
  ├── controllers/        # ビジネスロジック（TODO）
  └── utils/              # ユーティリティ関数（TODO）
```

## セットアップ

### 1. 仮想環境の作成

```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows
```

### 2. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

プロジェクトルートの `.env` ファイルを作成し、必要な環境変数を設定:

```bash
cp ../.env.example ../.env
# .env ファイルを編集
```

### 4. データベースの初期化

```bash
# 方法A: init_db.pyスクリプトを使用（推奨）
python init_db.py

# 方法B: Flask-Migrateを使用
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

### 5. 開発サーバーの起動

```bash
flask run
# または
python app.py
```

APIは `http://localhost:5000` で起動します。

## API エンドポイント

### 認証 (`/api/auth`)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/auth/register` | ユーザー登録 | - |
| POST | `/api/auth/login` | ログイン | - |
| GET | `/api/auth/me` | 現在のユーザー情報 | JWT |
| POST | `/api/auth/logout` | ログアウト | JWT |

### 評価 (`/api`)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| POST | `/api/evaluate` | 画像評価を実行 | JWT |
| GET | `/api/evaluations` | 評価履歴を取得 | JWT |
| GET | `/api/evaluations/:id` | 特定の評価詳細 | JWT |
| DELETE | `/api/evaluations/:id` | 評価を削除 | JWT |

### リーダーボード (`/api`)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/leaderboard` | ランキングを取得 | - |
| GET | `/api/leaderboard/user/:id` | ユーザーの順位を取得 | - |

### ベースライン画像 (`/api/baseline-images`)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/baseline-images` | ベースライン画像一覧 | - |
| GET | `/api/baseline-images/active` | アクティブなベースライン画像 | - |
| GET | `/api/baseline-images/:id` | 特定のベースライン画像 | - |
| POST | `/api/baseline-images` | ベースライン画像を登録 | JWT + Admin |
| PUT | `/api/baseline-images/:id` | ベースライン画像を更新 | JWT + Admin |
| DELETE | `/api/baseline-images/:id` | ベースライン画像を削除 | JWT + Admin |

### ユーザー (`/api/users`)

| メソッド | エンドポイント | 説明 | 認証 |
|---------|---------------|------|------|
| GET | `/api/users/me` | 自分のプロフィール | JWT |
| PUT | `/api/users/me` | プロフィール更新 | JWT |
| DELETE | `/api/users/me` | アカウント削除 | JWT |
| GET | `/api/users/:id` | ユーザーの公開情報 | - |

## JWT認証

### アクセストークンの取得

```bash
# ログイン
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# レスポンス
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {...}
}
```

### 認証が必要なエンドポイントへのリクエスト

```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc..."
```

## 管理者権限

- デフォルトの管理者アカウント: `username: admin, password: admin123`
- 管理者のみがベースライン画像の登録・更新・削除が可能
- `@admin_required` デコレーターで保護されたエンドポイント

## 開発

### テストの実行

```bash
pytest
```

### マイグレーションの作成

```bash
# モデルを変更した後
flask db migrate -m "説明文"
flask db upgrade
```

### コーディング規約

- PEP 8に準拠
- エラーハンドリングを必ず実装
- パスワードは必ずハッシュ化
- SQL injection対策（SQLAlchemy ORM使用）

## TODO

以下の機能は未実装です：

- [ ] 画像アップロード処理（S3連携）
- [ ] OpenAI Vision API連携
- [ ] 評価実行の完全な実装
- [ ] ファイルバリデーション
- [ ] 画像リサイズ処理
- [ ] ユニットテスト
- [ ] API統合テスト
