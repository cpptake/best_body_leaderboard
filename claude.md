# ボディビルダー肉体評価アプリケーション

## プロジェクト概要
OpenAI Vision APIを使用して、ボディビルダーの肉体を多角的に評価するWebアプリケーション。
ベースライン画像（基準）と比較対象画像の2枚を入力し、5つの部位（肩・胸・腕・背中・腹）について相対評価を行い、総合得点でランキング化する。

## 技術スタック
- **フロントエンド**: React / Next.js
- **バックエンド**: Flask (Python)
- **リバースプロキシ**: Nginx
- **データベース**: PostgreSQL
- **画像ストレージ**: AWS S3
- **AI API**: OpenAI Vision API (GPT-4 Vision)
- **認証**: JWT (JSON Web Token)
- **デプロイ**: AWS EC2
- **コンテナ**: Docker / Docker Compose (推奨)

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

## データベース設計

### テーブル構成

#### 1. users
ユーザー情報を管理（簡易版）
```sql
- id (PRIMARY KEY, UUID)
- username (VARCHAR, UNIQUE, NOT NULL)
- password_hash (VARCHAR, NOT NULL)
- is_admin (BOOLEAN, DEFAULT false) # 管理者フラグ
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. baseline_images
ベースライン画像（評価基準となる画像）- 管理者のみが登録・変更可能
```sql
- id (PRIMARY KEY, UUID)
- image_url (VARCHAR, NOT NULL) # S3のURL
- s3_key (VARCHAR, NOT NULL) # S3オブジェクトキー
- description (TEXT)
- is_active (BOOLEAN, DEFAULT true)
- created_by (UUID, FOREIGN KEY -> users.id) # 管理者ユーザー
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. comparison_images
比較対象画像（ユーザーがアップロードする画像）
```sql
- id (PRIMARY KEY, UUID)
- user_id (UUID, FOREIGN KEY -> users.id)
- image_url (VARCHAR, NOT NULL) # S3のURL
- s3_key (VARCHAR, NOT NULL) # S3オブジェクトキー
- uploaded_at (TIMESTAMP)
```

#### 4. evaluations
評価結果を保存
```sql
- id (PRIMARY KEY, UUID)
- user_id (UUID, FOREIGN KEY -> users.id)
- baseline_image_id (UUID, FOREIGN KEY -> baseline_images.id)
- comparison_image_id (UUID, FOREIGN KEY -> comparison_images.id)
- shoulder_score (INTEGER, -10 to 10)
- chest_score (INTEGER, -10 to 10)
- arm_score (INTEGER, -10 to 10)
- back_score (INTEGER, -10 to 10)
- abs_score (INTEGER, -10 to 10)
- total_score (INTEGER, -50 to 50)
- evaluation_comment (TEXT)
- evaluated_at (TIMESTAMP)
```

### インデックス
- users.username
- evaluations.user_id, evaluations.total_score (リーダーボード用)
- evaluations.evaluated_at (履歴表示用)

## 主要機能

### 1. 画像アップロード & OpenAI Vision APIによる評価
- ベースライン画像と比較対象画像の2枚をアップロード
- OpenAI Vision APIに両画像を送信
- 5つの部位（肩・胸・腕・背中・腹）をそれぞれ-10〜+10点で評価
- 各部位の評価理由をテキストで取得
- 合計得点（-50〜+50点）を算出して保存

### 2. 評価履歴表示
- ユーザーごとの過去の評価結果を時系列で表示
- 各評価の詳細（部位別得点、コメント）を確認可能
- 画像のサムネイル表示

### 3. リーダーボード（得点表）
- 全ユーザーの最高得点をランキング表示
- フィルタリング機能（期間指定、ベースライン画像別など）
- ページネーション対応

### 4. ユーザー管理
- ユーザー登録・ログイン・ログアウト
- プロフィール編集
- 認証・認可（JWT推奨）

### 5. ベースライン画像設定・変更（管理者機能）
- 管理者のみがベースライン画像を登録・変更可能
- 複数のベースライン画像を管理可能
- アクティブなベースライン画像の切り替え
- 管理者ダッシュボードで操作

## API設計

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### 画像評価
- `POST /api/evaluate` - 画像評価実行
- `GET /api/evaluations` - 評価履歴取得
- `GET /api/evaluations/:id` - 特定評価の詳細取得

### リーダーボード
- `GET /api/leaderboard` - ランキング取得（クエリパラメータでフィルタ）

### ベースライン画像
- `GET /api/baseline-images` - ベースライン画像一覧
- `GET /api/baseline-images/active` - 現在アクティブなベースライン画像
- `POST /api/baseline-images` - ベースライン画像登録（管理者のみ）
- `PUT /api/baseline-images/:id` - ベースライン画像更新（管理者のみ）

### ユーザー
- `GET /api/users/me` - 自分のプロフィール取得
- `PUT /api/users/me` - プロフィール更新

## OpenAI Vision API連携

### プロンプト設計
```
あなたはボディビルダーの肉体評価の専門家です。
2枚の画像を比較し、以下の5つの部位について評価してください：

1. 肩（三角筋の発達度）
2. 胸（大胸筋の発達度）
3. 腕（上腕二頭筋・三頭筋の発達度）
4. 背中（広背筋・僧帽筋の発達度）
5. 腹（腹直筋の明瞭さ）

1枚目の画像をベースライン（基準：0点）とし、2枚目の画像の各部位を相対的に評価してください。
各部位を-100点（大きく劣る）から+100点（大きく優れる）のスケールで採点し、JSON形式で返してください。
```

### レスポンス形式
```json
{
  "shoulder_score": 25,
  "chest_score": 15,
  "arm_score": -10,
  "back_score": 30,
  "abs_score": 20,
  "total_score": 80,
  "comments": {
    "shoulder": "三角筋の張り出しが顕著に優れています",
    "chest": "大胸筋の厚みが若干上回っています",
    "arm": "上腕の太さがやや劣ります",
    "back": "広背筋の広がりが明らかに優位です",
    "abs": "腹筋のカットがより鮮明です"
  }
}
```

## 環境変数

### 共通
- `NODE_ENV` - 環境 (development / production)
- `PORT` - ポート番号

### バックエンド (Flask)
- `FLASK_APP` - Flaskアプリケーションのエントリーポイント
- `FLASK_ENV` - 環境 (development / production)
- `SECRET_KEY` - Flaskセッション用シークレットキー
- `OPENAI_API_KEY` - OpenAI APIキー
- `DATABASE_URL` - PostgreSQL接続URL
- `JWT_SECRET_KEY` - JWT署名用シークレットキー
- `AWS_S3_BUCKET` - 画像保存用S3バケット名
- `AWS_REGION` - AWSリージョン (例: ap-northeast-1)
- `AWS_ACCESS_KEY_ID` - AWS認証情報
- `AWS_SECRET_ACCESS_KEY` - AWS認証情報

### フロントエンド
- `NEXT_PUBLIC_API_URL` - バックエンドAPIのURL

## 開発ルール

### コーディング規約
- コミットメッセージは日本語でOK
- エラーハンドリングを必ず実装（try-catch、エラーミドルウェア）
- 環境変数は`.env.example`で管理し、`.env`はgitignore
- TypeScript使用を推奨（型安全性向上）

### セキュリティ
- パスワードは必ずハッシュ化（bcrypt / werkzeug.security推奨）
- JWTトークンでAPI認証（Flask-JWT-Extended推奨）
- 画像アップロード時のファイルサイズ・形式バリデーション（JPG, PNG, 最大10MBなど）
- CORS設定を適切に行う（Flask-CORS）
- SQL injection対策（SQLAlchemy ORMを使用）
- 管理者権限チェック（デコレーターで実装推奨）

### パフォーマンス
- 画像はAWS S3に保存（DBには保存しない）
- S3の署名付きURLを使用して画像アクセス
- リーダーボードはキャッシュ活用（Redis推奨、将来的に導入）
- ページネーション実装
- 画像は適切なサイズにリサイズしてからS3にアップロード（Pillow使用）

### テスト
- ユニットテスト（pytest推奨）
- APIエンドポイントの統合テスト
- OpenAI API呼び出しはモック化してテスト（unittest.mockまたはpytest-mock）

## 技術スタック詳細

### Python / Flask関連パッケージ
- **Flask**: Webフレームワーク
- **Flask-SQLAlchemy**: ORM
- **Flask-Migrate**: DBマイグレーション
- **Flask-JWT-Extended**: JWT認証
- **Flask-CORS**: CORS対応
- **boto3**: AWS S3操作
- **Pillow**: 画像処理
- **python-dotenv**: 環境変数管理
- **psycopg2-binary**: PostgreSQLドライバ
- **openai**: OpenAI API クライアント
- **werkzeug**: セキュリティユーティリティ

## 評価回数制限について

現状、評価回数の制限は実装しない。
将来的に必要になった場合は、以下の実装を検討：
- ユーザーごとの1日あたりの評価回数をカウント
- Redis等を使用してレート制限
- データベースに評価回数テーブルを追加

## 決定事項まとめ

✅ **確定した仕様:**
1. バックエンド: Flask (Python)
2. 画像保存: AWS S3
3. 認証方式: JWT
4. ベースライン画像管理: 管理者のみ
5. 評価回数制限: 現状不要（将来的に変更の可能性あり）
6. プロンプト: 別途用意されているため、claude.mdには記載しない

## 不足事項の確認

以下の点について、追加で確認が必要な場合はお知らせください：

1. **フロントエンドのページ構成**
   - ホーム、画像アップロード・評価、評価履歴、リーダーボード、管理者ダッシュボード等
   - 具体的なページ数や遷移フロー

2. **ユーザー登録**
   - 誰でも登録可能か、招待制か
   - メール認証は必要か

3. **画像の表示権限**
   - 他ユーザーの画像をリーダーボードで表示するか
   - プライバシー設定は必要か

4. **開発環境**
   - Dockerを使用するか
   - ローカル開発時のデータベース環境（Docker Compose等）

上記の点は開発を進めながら調整可能ですが、事前に決まっている内容があれば教えてください。