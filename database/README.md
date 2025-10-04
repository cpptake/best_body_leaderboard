# データベース

## セットアップ

### 1. PostgreSQLのインストール

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
```

### 2. データベースの作成

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベースを作成
CREATE DATABASE best_body_leaderboard;

# ユーザーを作成（オプション）
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE best_body_leaderboard TO myuser;

# 終了
\q
```

### 3. スキーマの適用

#### 方法A: schema.sqlを使用（推奨）

```bash
# PostgreSQLにschema.sqlを適用
psql -U postgres -d best_body_leaderboard -f database/schema.sql
```

#### 方法B: Flask-Migrateを使用

```bash
cd backend

# 仮想環境の有効化
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows

# 依存パッケージのインストール
pip install -r requirements.txt

# マイグレーションの初期化
flask db init

# マイグレーションファイルの生成
flask db migrate -m "Initial migration"

# マイグレーションの適用
flask db upgrade
```

#### 方法C: init_db.pyスクリプトを使用（開発環境）

```bash
cd backend

# 仮想環境の有効化
source venv/bin/activate

# 依存パッケージのインストール
pip install -r requirements.txt

# データベースを初期化（テーブル作成 + 管理者ユーザー作成）
python init_db.py
```

## マイグレーション

モデルを変更した後、以下のコマンドでマイグレーションを作成・適用します：

```bash
# マイグレーションファイルの生成
flask db migrate -m "説明文"

# マイグレーションの適用
flask db upgrade

# マイグレーションのロールバック
flask db downgrade
```

## テーブル構造

### users
ユーザー情報

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| username | VARCHAR(255) | ユーザー名（一意） |
| password_hash | VARCHAR(255) | ハッシュ化されたパスワード |
| is_admin | BOOLEAN | 管理者フラグ |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### baseline_images
ベースライン画像（評価基準）

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| image_url | VARCHAR(500) | S3のURL |
| s3_key | VARCHAR(500) | S3オブジェクトキー |
| description | TEXT | 説明 |
| is_active | BOOLEAN | アクティブフラグ |
| created_by | UUID | 作成者（管理者） |
| created_at | TIMESTAMP | 作成日時 |
| updated_at | TIMESTAMP | 更新日時 |

### comparison_images
比較対象画像

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| image_url | VARCHAR(500) | S3のURL |
| s3_key | VARCHAR(500) | S3オブジェクトキー |
| uploaded_at | TIMESTAMP | アップロード日時 |

### evaluations
評価結果

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | 主キー |
| user_id | UUID | ユーザーID |
| baseline_image_id | UUID | ベースライン画像ID |
| comparison_image_id | UUID | 比較画像ID |
| shoulder_score | INTEGER | 肩の得点（-10〜10） |
| chest_score | INTEGER | 胸の得点（-10〜10） |
| arm_score | INTEGER | 腕の得点（-10〜10） |
| back_score | INTEGER | 背中の得点（-10〜10） |
| abs_score | INTEGER | 腹の得点（-10〜10） |
| total_score | INTEGER | 合計得点（-50〜50） |
| evaluation_comment | TEXT | 評価コメント |
| evaluated_at | TIMESTAMP | 評価日時 |

## インデックス

パフォーマンス向上のため、以下のインデックスが作成されています：

- `users.username` - ユーザー名検索
- `evaluations.user_id` - ユーザーごとの評価履歴
- `evaluations.total_score` - リーダーボード
- `evaluations.evaluated_at` - 時系列表示
- `evaluations(user_id, total_score)` - ユーザーごとの最高得点

## 初期データ

`database/seeds/` に初期データ投入用のSQLファイルを配置できます。
