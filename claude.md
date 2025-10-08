# ボディビルダー画像比較評価アプリ（最小構成版）

## プロジェクト概要
OpenAI Vision APIを使用して、2枚のボディビルダー画像を比較評価する**シンプルな**Webアプリケーション。
ベースライン画像（基準）と比較対象画像を入力し、5つの部位（肩・胸・腕・背中・腹）について相対評価を行い、総合得点を表示する。

**重要: このバージョンはMVP（最小機能製品）であり、以下の機能は含まれません：**
- ユーザー登録・ログイン機能
- データベース（後で追加予定）
- 評価履歴の保存
- リーダーボード
- ベースライン画像の管理機能

## 技術スタック
- **フロントエンド**: React / Next.js
- **バックエンド**: Flask (Python)
- **AI API**: OpenAI Vision API (GPT-4 Vision)
- **コンテナ**: Docker / Docker Compose
- **画像処理**: Pillow (Python)

## プロジェクト構造
```
/project-root
  /frontend           # Next.jsアプリケーション
    /public
    /src
      /pages          # ページコンポーネント
        index.js      # メインページ（画像アップロード&評価表示）
      /components     # UIコンポーネント
        ImageUploader.js
        EvaluationResult.js
      /lib
        api.js        # API通信
    package.json
    next.config.js
    tailwind.config.js
  /backend            # Flask API サーバー
    /services
      openai_service.py  # OpenAI API連携
    /utils
      image_utils.py     # 画像処理
    app.py               # Flaskアプリエントリーポイント
    requirements.txt
  docker-compose.yml
  .env.example
  README.md
  claude.md
```

## コア機能（実装必須）

### 1. 画像アップロード
- ベースライン画像（基準となる画像）のアップロード
- 比較対象画像のアップロード
- 画像プレビュー表示
- ファイルバリデーション（JPG/PNG、最大10MB）

### 2. OpenAI Vision APIによる評価
- 2枚の画像をOpenAI Vision APIに送信
- 5つの部位（肩・胸・腕・背中・腹）をそれぞれ-10〜+10点で評価
- 各部位の評価理由をテキストで取得
- 合計得点（-50〜+50点）を算出

### 3. 評価結果の表示
- 各部位のスコアを視覚的に表示（プログレスバーまたはゲージ）
- 各部位の評価コメント表示
- 合計スコアを大きく表示
- 評価対象の2枚の画像を並べて表示

## API設計（最小構成）

### バックエンドエンドポイント

#### POST /api/evaluate
2枚の画像を評価するエンドポイント

**リクエスト:**
```
Content-Type: multipart/form-data

baseline_image: File (画像ファイル)
comparison_image: File (画像ファイル)
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "shoulder_score": 5,
    "chest_score": 3,
    "arm_score": -2,
    "back_score": 7,
    "abs_score": 4,
    "total_score": 17,
    "comments": {
      "shoulder": "三角筋の張り出しが顕著に優れています",
      "chest": "大胸筋の厚みが若干上回っています",
      "arm": "上腕の太さがやや劣ります",
      "back": "広背筋の広がりが明らかに優位です",
      "abs": "腹筋のカットがより鮮明です"
    },
    "baseline_image_url": "data:image/jpeg;base64,...",
    "comparison_image_url": "data:image/jpeg;base64,..."
  }
}
```

**エラーレスポンス:**
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

## OpenAI Vision API連携

### プロンプト設計
**注意: プロンプトは別途用意されているため、ここでは詳細を記載しない。**
外部から渡されるプロンプトを使用する想定。

### 想定レスポンス形式
```json
{
  "shoulder_score": 5,
  "chest_score": 3,
  "arm_score": -2,
  "back_score": 7,
  "abs_score": 4,
  "total_score": 17,
  "comments": {
    "shoulder": "評価コメント",
    "chest": "評価コメント",
    "arm": "評価コメント",
    "back": "評価コメント",
    "abs": "評価コメント"
  }
}
```

各部位: -10〜+10点、合計: -50〜+50点

## 実装の優先順位

### フェーズ1: バックエンドの基本実装
1. Flask基本構造のセットアップ
2. OpenAI Vision API連携サービスの実装
3. 画像処理ユーティリティの実装（Base64エンコード、バリデーション）
4. /api/evaluateエンドポイントの実装
5. CORS設定

### フェーズ2: フロントエンドの実装
1. Next.js基本構造のセットアップ
2. ImageUploaderコンポーネント（ドラッグ&ドロップ、プレビュー）
3. EvaluationResultコンポーネント（スコア表示、コメント表示）
4. メインページ（index.js）の実装
5. API通信の実装

### フェーズ3: 統合とDocker化
1. フロントエンドとバックエンドの統合テスト
2. Dockerfileの作成（frontend, backend）
3. docker-compose.ymlの作成
4. 環境変数の設定
5. 動作確認

## 環境変数

### バックエンド (.env)
```
FLASK_ENV=development
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=http://localhost:3000
```

### フロントエンド (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 開発ルール

### コーディング規約
- シンプルさを最優先（複雑な実装は避ける）
- エラーハンドリングは必須
- コメントは日本語でOK
- 環境変数は`.env.example`で管理

### セキュリティ
- 画像ファイルのバリデーション（サイズ、形式）
- CORS設定を適切に行う
- APIキーの安全な管理

### パフォーマンス
- 画像はBase64でメモリ上で処理（DBやS3は使わない）
- 適切な画像リサイズ（最大1920x1920推奨）
- OpenAI APIのタイムアウト設定

## Python / Flask関連パッケージ（requirements.txt）

```
Flask==3.0.0
flask-cors==4.0.0
Pillow==10.1.0
openai==1.3.0
python-dotenv==1.0.0
```

## フロントエンド関連パッケージ（package.json）

```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "1.6.0"
  },
  "devDependencies": {
    "tailwindcss": "3.3.0",
    "autoprefixer": "10.4.16",
    "postcss": "8.4.31"
  }
}
```

## Docker構成

### backend/Dockerfile
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

### frontend/Dockerfile
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend:/app

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
```

## データベースについて

**現バージョンではデータベースは実装しません。**

将来的に以下の機能を追加する場合にDBを導入：
- ユーザー認証
- 評価履歴の保存
- リーダーボード
- ベースライン画像の管理

## 実装上の注意点

1. **シンプルさを保つ**
   - 機能を追加したい衝動に駆られても、まずはコア機能のみを完成させる
   - 必要最小限のコードで実装

2. **画像処理**
   - 画像はメモリ上で処理（ファイル保存不要）
   - Base64エンコードでフロントエンドに返却
   - 大きすぎる画像は自動リサイズ

3. **エラーハンドリング**
   - OpenAI APIのエラー（レート制限、認証エラー等）
   - 画像形式・サイズのバリデーションエラー
   - ネットワークエラー

4. **UI/UX**
   - ローディング状態を明確に表示
   - エラーメッセージをユーザーフレンドリーに
   - レスポンシブデザイン対応

## テスト方法

### ローカル開発環境での起動

1. バックエンド起動:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

2. フロントエンド起動:
```bash
cd frontend
npm install
npm run dev
```

3. ブラウザで http://localhost:3000 にアクセス

### Docker環境での起動

```bash
docker-compose up --build
```

### 動作確認

1. 2枚の画像をアップロード
2. 「評価を実行」ボタンをクリック
3. 数秒後に評価結果が表示されることを確認

## 今後の拡張予定（参考）

このMVPが完成した後、以下の機能を段階的に追加可能：
1. データベースの導入（PostgreSQL）
2. ユーザー認証機能
3. 評価履歴の保存・表示
4. リーダーボード機能
5. AWS S3への画像保存
6. ベースライン画像の管理機能

## 決定事項まとめ

✅ **最小構成の方針:**
- データベースなし
- 認証なし
- 画像比較と評価表示のみ
- メモリ上で画像処理（保存なし）

✅ **技術スタック:**
- Flask (バックエンド)
- Next.js (フロントエンド)
- OpenAI Vision API
- Docker / Docker Compose

✅ **スコア範囲:**
- 各部位: -10〜+10点
- 合計: -50〜+50点