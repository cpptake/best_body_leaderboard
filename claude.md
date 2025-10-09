# ボディビルダー画像比較評価アプリ（リーダーボード機能追加版）

## プロジェクト概要
OpenAI Vision APIを使用して、2枚のボディビルダー画像を比較評価するWebアプリケーション。
ベースライン画像（基準）と比較対象画像を入力し、5つの部位（肩・胸・腕・背中・腹）について相対評価を行い、総合得点を表示する。

**新機能: リーダーボード（得点表）**
- ユーザー名を入力して評価を記録
- **同名ユーザー内で最大total_scoreの評価のみを抽出し、ランキング表示**
- 同点の場合は、最も新しい評価日時を表示
- ページネーション対応

**注意: 本格的な認証機能は未実装**
- 現状はユーザー名を入力するだけ（簡易版）
- 将来的にユーザー登録・ログイン機能を追加予定

## 技術スタック
- **フロントエンド**: React / Next.js
- **バックエンド**: Flask (Python)
- **データベース**: PostgreSQL（Dockerコンテナ）
- **AI API**: OpenAI Vision API (GPT-4 Vision)
- **コンテナ**: Docker / Docker Compose
- **画像処理**: Pillow (Python)
- **ORM**: SQLAlchemy (Python)

## プロジェクト構造
```
/project-root
  /frontend           # Next.jsアプリケーション
    /public
    /src
      /pages
        index.js      # メインページ（画像アップロード&評価表示）
        leaderboard.js # リーダーボードページ
      /components
        ImageUploader.js
        EvaluationResult.js
        LeaderboardTable.js  # NEW
        UsernameInput.js     # NEW
      /lib
        api.js        # API通信
    package.json
    next.config.js
    tailwind.config.js
  /backend            # Flask API サーバー
    /models           # NEW
      evaluation.py   # 評価モデル
    /services
      openai_service.py
    /utils
      image_utils.py
    app.py
    config.py         # NEW
    requirements.txt
  docker-compose.yml
  .env.example
  README.md
  claude.md
```

## コア機能

### 1. 画像アップロードと評価（既存）
- ベースライン画像と比較対象画像のアップロード
- **ユーザー名の入力（NEW）**
- OpenAI Vision APIによる評価
- 評価結果の表示

### 2. 評価結果の保存（NEW）
- ユーザー名と評価スコアをデータベースに保存
- 各部位のスコアとコメントを保存
- 評価日時を記録

### 3. リーダーボード（NEW）
- **同名ユーザー内で最大total_scoreを持つ評価のみを抽出**
- 各ユーザーの最高得点をランキング表示
- 同じユーザーが複数回評価を受けた場合、最高得点のみが表示される
- 同じユーザーの同じスコアが複数ある場合、最新の評価日時を表示
- ページネーション対応（20件ずつ表示）
- 順位、ユーザー名、最高得点、評価日時を表示

## データベース設計

### evaluationsテーブル
評価結果を保存するテーブル

```sql
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    shoulder_score INTEGER NOT NULL CHECK (shoulder_score >= -10 AND shoulder_score <= 10),
    chest_score INTEGER NOT NULL CHECK (chest_score >= -10 AND chest_score <= 10),
    arm_score INTEGER NOT NULL CHECK (arm_score >= -10 AND arm_score <= 10),
    back_score INTEGER NOT NULL CHECK (back_score >= -10 AND back_score <= 10),
    abs_score INTEGER NOT NULL CHECK (abs_score >= -10 AND abs_score <= 10),
    shoulder_comment TEXT,
    chest_comment TEXT,
    arm_comment TEXT,
    back_comment TEXT,
    abs_comment TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_evaluated_at (evaluated_at DESC)
);
```

**注:** `total_score`は物理カラムではなく、5つの部位スコアの合計値として計算プロパティ（hybrid_property）で実装されています。

**インデックス:**
- `username`: ユーザー別の検索用
- `evaluated_at`: 日時順ソート用

**注:** `total_score`はhybrid_propertyとして実装されているため、SQLクエリでも使用可能です（インデックスは不要）。

## API設計

### 既存エンドポイント（更新）

#### POST /api/evaluate
2枚の画像を評価し、結果をDBに保存

**リクエスト:**
```
Content-Type: multipart/form-data

username: String (ユーザー名、必須) # NEW
baseline_image: File (画像ファイル)
comparison_image: File (画像ファイル)
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "evaluation_id": 123,  # NEW
    "username": "user123", # NEW
    "shoulder_score": 5,
    "chest_score": 3,
    "arm_score": -2,
    "back_score": 7,
    "abs_score": 4,
    "total_score": 17,  # 5つの部位スコアの合計（サーバー側で自動計算）
    "comments": {
      "shoulder": "三角筋の張り出しが顕著に優れています",
      "chest": "大胸筋の厚みが若干上回っています",
      "arm": "上腕の太さがやや劣ります",
      "back": "広背筋の広がりが明らかに優位です",
      "abs": "腹筋のカットがより鮮明です"
    },
    "baseline_image_url": "data:image/jpeg;base64,...",
    "comparison_image_url": "data:image/jpeg;base64,...",
    "evaluated_at": "2025-10-08T12:34:56Z" # NEW
  }
}
```

### 新規エンドポイント

#### GET /api/leaderboard
リーダーボードを取得

**処理内容:**
- 同名ユーザー内で最大total_scoreを持つ評価のみを抽出
- 同じスコアが複数ある場合は、最新の評価日時を表示
- best_scoreの降順、username順でソート

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `per_page`: 1ページあたりの件数（デフォルト: 20、最大: 100）

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "username": "muscle_king",
        "best_score": 45,
        "evaluated_at": "2025-10-08T12:34:56Z"
      },
      {
        "rank": 2,
        "username": "bodybuilder_pro",
        "best_score": 42,
        "evaluated_at": "2025-10-07T10:20:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_count": 100
    }
  }
}
```

**注意:**
- `evaluated_at`は最高得点を獲得した評価の日時（同点の場合は最新）を表示

#### GET /api/leaderboard/user/{username}
特定ユーザーの評価履歴を取得

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "username": "user123",
    "best_score": 35,
    "evaluation_count": 5,
    "evaluations": [
      {
        "id": 123,
        "total_score": 35,
        "evaluated_at": "2025-10-08T12:34:56Z"
      }
    ]
  }
}
```

## 実装の優先順位

### フェーズ4: データベース導入（NEW）
1. PostgreSQLコンテナの追加（docker-compose.yml）
2. SQLAlchemyのセットアップ
3. evaluationsモデルの作成
4. データベースマイグレーション（初期テーブル作成）

### フェーズ5: 評価保存機能の実装（NEW）
1. POST /api/evaluateエンドポイントの更新
   - ユーザー名を受け取る
   - 評価結果をDBに保存
   - evaluation_idを返す
2. エラーハンドリング（DB接続エラー等）

### フェーズ6: リーダーボード機能の実装（NEW）
1. GET /api/leaderboardエンドポイントの実装
   - ユーザーごとの最高得点を集計
   - ページネーション対応
2. GET /api/leaderboard/user/{username}の実装
3. SQLクエリの最適化

### フェーズ7: フロントエンドの更新（NEW）
1. UsernameInputコンポーネントの作成
2. index.jsにユーザー名入力フィールドを追加
3. leaderboard.jsページの作成
4. LeaderboardTableコンポーネントの作成
5. ページネーション機能の実装

## 環境変数

### バックエンド (.env)
```
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=http://localhost:3000
DATABASE_URL=postgresql://bodybuilder:password@db:5432/bodybuilder_db  # NEW
```

### フロントエンド (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### データベース (docker-compose.yml内で設定)
```
POSTGRES_USER=bodybuilder
POSTGRES_PASSWORD=password
POSTGRES_DB=bodybuilder_db
```

## Python / Flask関連パッケージ（requirements.txt）

```
Flask==3.0.0
flask-cors==4.0.0
Pillow==10.1.0
openai==1.3.0
python-dotenv==1.0.0
# NEW
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9
Flask-SQLAlchemy==3.1.1
```

## Docker構成（更新）

### docker-compose.yml
```yaml
version: '3.8'
services:
  db:  # NEW
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: bodybuilder
      POSTGRES_PASSWORD: password
      POSTGRES_DB: bodybuilder_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U bodybuilder"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app
    depends_on:
      db:  # NEW
        condition: service_healthy

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    env_file:
      - ./frontend/.env.local
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend

volumes:
  postgres_data:  # NEW
```

## データベース初期化

### backend/models/evaluation.py
```python
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, index=True)
    shoulder_score = db.Column(db.Integer, nullable=False)
    chest_score = db.Column(db.Integer, nullable=False)
    arm_score = db.Column(db.Integer, nullable=False)
    back_score = db.Column(db.Integer, nullable=False)
    abs_score = db.Column(db.Integer, nullable=False)
    shoulder_comment = db.Column(db.Text)
    chest_comment = db.Column(db.Text)
    arm_comment = db.Column(db.Text)
    back_comment = db.Column(db.Text)
    abs_comment = db.Column(db.Text)
    evaluated_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    @hybrid_property
    def total_score(self):
        """5つの部位のスコアの合計を計算"""
        return (self.shoulder_score + self.chest_score +
                self.arm_score + self.back_score + self.abs_score)

    @total_score.expression
    def total_score(cls):
        """SQLクエリで使用できるtotal_scoreの式"""
        return (cls.shoulder_score + cls.chest_score +
                cls.arm_score + cls.back_score + cls.abs_score)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'shoulder_score': self.shoulder_score,
            'chest_score': self.chest_score,
            'arm_score': self.arm_score,
            'back_score': self.back_score,
            'abs_score': self.abs_score,
            'total_score': self.total_score,
            'comments': {
                'shoulder': self.shoulder_comment,
                'chest': self.chest_comment,
                'arm': self.arm_comment,
                'back': self.back_comment,
                'abs': self.abs_comment
            },
            'evaluated_at': self.evaluated_at.isoformat()
        }
```

### アプリ起動時にテーブル自動作成
```python
# backend/app.py内
from models.evaluation import db, Evaluation

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()  # テーブルを自動作成
```

## 実装上の注意点

1. **データベース接続**
   - PostgreSQLコンテナの起動を待つ（healthcheck使用）
   - 接続エラー時の適切なエラーハンドリング
   - connection poolingの設定

2. **ユーザー名のバリデーション**
   - 1〜50文字
   - 英数字、アンダースコア、ハイフンのみ許可
   - 空白文字の除去

3. **リーダーボードのクエリ最適化**
   - サブクエリでユーザーごとの最高得点を取得
   - 最高得点に対応する正しい評価日時を取得（同点の場合は最新）
   - インデックスを活用
   - ページネーション実装

4. **UI/UX**
   - ユーザー名入力欄を目立たせる
   - リーダーボードのトップ3を特別表示（金銀銅）
   - 自分の順位をハイライト表示（将来の認証機能実装時）

## テスト方法

### ローカル開発環境での起動

```bash
# Docker Composeで全サービス起動
docker-compose up --build

# ブラウザでアクセス
# メインページ: http://localhost:3000
# リーダーボード: http://localhost:3000/leaderboard
```

### データベース確認

```bash
# PostgreSQLコンテナに接続
docker exec -it <container_id> psql -U bodybuilder -d bodybuilder_db

# テーブル確認
\dt

# データ確認
SELECT * FROM evaluations ORDER BY total_score DESC LIMIT 10;
```

### 動作確認

1. ユーザー名を入力
2. 2枚の画像をアップロード
3. 評価を実行
4. 結果が表示され、DBに保存されることを確認
5. リーダーボードページで結果を確認

## 今後の拡張予定

1. ユーザー登録・ログイン機能の実装
2. パスワード認証の追加
3. 評価履歴の詳細表示
4. ユーザープロフィールページ
5. 画像のAWS S3保存
6. 管理者機能（ベースライン画像管理）

## 決定事項まとめ

✅ **新機能:**
- リーダーボード（得点表）
- ユーザー名入力（簡易版）
- PostgreSQLでのデータ永続化

✅ **技術スタック（追加）:**
- PostgreSQL（Dockerコンテナ）
- SQLAlchemy（ORM）

✅ **データ設計:**
- evaluationsテーブル（評価結果保存）
- ユーザーごとの最高得点を集計
- `total_score`は計算プロパティとして実装（5つの部位スコアの合計）

✅ **注意事項:**
- 本格的な認証機能は未実装（将来追加予定）
- DBはDockerコンテナで起動
- データは永続化される（volumeマウント）