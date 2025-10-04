# Best Body Leaderboard - セットアップガイド

## 前提条件

- Python 3.8以上
- Node.js 16以上
- PostgreSQL 12以上
- AWS S3アカウント（画像保存用）
- OpenAI APIキー

## 環境変数の設定

プロジェクトルートに `.env` ファイルを作成します：

```bash
cp .env.example .env
```

`.env` ファイルを編集して、以下の値を設定：

```env
# Flask設定
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here  # 本番環境では必ず変更

# データベース
DATABASE_URL=postgresql://username:password@localhost:5432/best_body_leaderboard

# JWT設定
JWT_SECRET_KEY=your-jwt-secret-key-here  # 本番環境では必ず変更

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-northeast-1

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# フロントエンド
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 1. データベースのセットアップ

### PostgreSQLのインストール（未インストールの場合）

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# PostgreSQL公式サイトからインストーラーをダウンロード
```

### データベースの作成

```bash
# PostgreSQLに接続
sudo -u postgres psql

# データベースを作成
CREATE DATABASE best_body_leaderboard;

# ユーザーを作成（オプション）
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE best_body_leaderboard TO your_username;

# 終了
\q
```

## 2. バックエンドのセットアップ

```bash
cd backend

# 仮想環境の作成
python3 -m venv venv

# 仮想環境の有効化
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate     # Windows

# 依存パッケージのインストール
pip install -r requirements.txt

# データベースの初期化（テーブル作成）
python init_db.py

# 開発サーバーの起動
python app.py
```

バックエンドは `http://localhost:5000` で起動します。

### バックエンドの動作確認

```bash
# ヘルスチェック
curl http://localhost:5000/

# レスポンス例:
# {"message": "Best Body Leaderboard API", "status": "running"}
```

## 3. フロントエンドのセットアップ

```bash
cd frontend

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

### フロントエンドの動作確認

ブラウザで `http://localhost:3000` にアクセスして、ホームページが表示されることを確認します。

## 4. 動作確認の流れ

### ステップ1: ユーザー登録

1. ブラウザで `http://localhost:3000` にアクセス
2. 「無料で始める」または「新規登録」をクリック
3. ユーザー名とパスワードを入力して登録
4. 自動的にログイン状態になる

### ステップ2: 管理者権限でベースライン画像を登録

デフォルトの管理者アカウントでログイン：

- **ユーザー名**: admin
- **パスワード**: admin123

管理者でログイン後：

1. ナビゲーションから「管理者」→「ベースライン画像管理」を選択
2. 「新規追加」ボタンをクリック
3. ボディビルダーの画像をアップロード
4. 説明文を入力（例: "クリス・バムステッド 2023"）
5. 「アップロード」をクリック

### ステップ3: 画像評価を実行

1. ナビゲーションから「評価する」を選択
2. ベースライン画像を選択
3. 比較対象の画像をアップロード
4. （オプション）カスタムプロンプトを入力
5. 「評価を実行」ボタンをクリック
6. AI評価結果が表示される

### ステップ4: リーダーボードを確認

1. ナビゲーションから「リーダーボード」を選択
2. 全ユーザーのランキングが表示される
3. トップ3はメダル表示される
4. フィルターで期間やベースライン画像を絞り込み可能

### ステップ5: 評価履歴を確認

1. ナビゲーションから「履歴」を選択
2. 過去の評価結果が一覧表示される
3. 「詳細を見る」で詳細画面に遷移
4. 評価の削除も可能

## トラブルシューティング

### バックエンドが起動しない

**症状**: `ModuleNotFoundError` が発生

**解決策**:
```bash
# 仮想環境が有効化されているか確認
which python  # venvのpythonが表示されるはず

# 依存パッケージを再インストール
pip install -r requirements.txt
```

**症状**: データベース接続エラー

**解決策**:
```bash
# PostgreSQLが起動しているか確認
sudo systemctl status postgresql  # Linux
brew services list  # macOS

# DATABASE_URLが正しいか確認
echo $DATABASE_URL
```

### フロントエンドが起動しない

**症状**: `Module not found` エラー

**解決策**:
```bash
# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

**症状**: バックエンドに接続できない

**解決策**:
```bash
# .env.localファイルを作成
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# 開発サーバーを再起動
npm run dev
```

### 画像アップロードが失敗する

**症状**: S3関連のエラー

**解決策**:
1. AWS認証情報が正しいか確認
2. S3バケットが存在し、書き込み権限があるか確認
3. バケットのCORS設定を確認

```json
// S3 CORS設定例
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": []
  }
]
```

### OpenAI API呼び出しが失敗する

**症状**: 評価実行時にエラー

**解決策**:
1. OpenAI APIキーが正しいか確認
2. APIクレジットが残っているか確認
3. レート制限に達していないか確認

## 開発時の注意点

### ホットリロード

- **バックエンド**: ファイル変更時に自動的に再起動（Flask開発サーバー）
- **フロントエンド**: ファイル変更時に自動的にリロード（Next.js Fast Refresh）

### デバッグモード

**バックエンド**:
```python
# app.pyの最後
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

**フロントエンド**:
```bash
# ブラウザの開発者ツールを開く
# React Developer Toolsをインストール推奨
```

### ログの確認

**バックエンド**:
```bash
# コンソールにログが出力される
# エラーはスタックトレースとともに表示
```

**フロントエンド**:
```bash
# ターミナルとブラウザコンソールの両方を確認
# Network タブでAPI通信を確認
```

## 本番環境へのデプロイ

### 環境変数の変更

本番環境では以下を必ず変更：

```env
FLASK_ENV=production
SECRET_KEY=<長くランダムな文字列>
JWT_SECRET_KEY=<長くランダムな文字列>
DATABASE_URL=<本番DBのURL>
NEXT_PUBLIC_API_URL=<本番APIのURL>
```

### セキュリティチェックリスト

- [ ] SECRET_KEYとJWT_SECRET_KEYを変更
- [ ] PostgreSQLのパスワードを強固にする
- [ ] S3バケットのアクセス権限を制限
- [ ] CORS設定を本番ドメインのみに制限
- [ ] HTTPSを有効化
- [ ] レート制限を実装
- [ ] CSRFトークンを実装（必要に応じて）

## よくある質問

### Q: 管理者アカウントのパスワードを変更するには？

A: データベースで直接更新するか、新しい管理者を作成：

```python
# Python対話シェルで
from app import app, db
from models.user import User
from werkzeug.security import generate_password_hash

with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    admin.password_hash = generate_password_hash('new_password')
    db.session.commit()
```

### Q: ベースライン画像を一括登録するには？

A: スクリプトを作成して実行：

```python
# bulk_upload.py
from app import app, db
from models.baseline_image import BaselineImage
import os

with app.app_context():
    images = [
        {'description': 'クリス・バムステッド 2023', 'url': 's3://...'},
        {'description': 'ロニー・コールマン 2000', 'url': 's3://...'},
    ]

    for img in images:
        baseline = BaselineImage(
            description=img['description'],
            image_url=img['url'],
            is_active=True
        )
        db.session.add(baseline)

    db.session.commit()
```

### Q: データベースをリセットするには？

A:

```bash
# データベースを削除して再作成
psql -U postgres -c "DROP DATABASE best_body_leaderboard;"
psql -U postgres -c "CREATE DATABASE best_body_leaderboard;"

# テーブルを再作成
cd backend
python init_db.py
```

## サポート

問題が解決しない場合は、以下を確認してください：

1. このファイルのトラブルシューティングセクション
2. バックエンドの `backend/README.md`
3. フロントエンドの `frontend/README.md`
4. プロジェクトのIssueトラッカー（GitHub等）

## 次のステップ

- プロフィールページの実装（未実装）
- 画像の最適化とキャッシュ
- パフォーマンスチューニング
- テストの追加
- CI/CDパイプラインの構築
