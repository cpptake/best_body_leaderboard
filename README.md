# ボディビルダー画像比較評価アプリ（最小構成版）

OpenAI Vision APIを使用して、2枚のボディビルダー画像を比較評価するシンプルなWebアプリケーションです。

## 機能

- 2枚の画像（ベースライン vs 比較対象）をアップロード
- OpenAI Vision APIで5つの部位（肩・胸・腕・背中・腹）を自動評価
- 各部位を-10〜+10点で相対評価
- 総合スコア（-50〜+50点）を表示
- 視覚的な評価結果の表示

## 技術スタック

- **フロントエンド**: Next.js 14, React 18, Tailwind CSS
- **バックエンド**: Flask (Python 3.11)
- **AI**: OpenAI Vision API (GPT-4 Vision)
- **コンテナ**: Docker, Docker Compose

## プロジェクト構造

```
/
├── backend/              # Flaskバックエンド
│   ├── services/
│   │   └── openai_service.py
│   ├── utils/
│   │   └── image_utils.py
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/             # Next.jsフロントエンド
│   ├── src/
│   │   ├── pages/
│   │   │   ├── index.js
│   │   │   └── _app.js
│   │   ├── components/
│   │   │   ├── ImageUploader.js
│   │   │   └── EvaluationResult.js
│   │   ├── lib/
│   │   │   └── api.js
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd best_body_leaderboard
```

### 2. 環境変数の設定

```bash
# ルートディレクトリに.envファイルを作成
cp .env.example .env

# .envファイルを編集してOpenAI APIキーを設定
# OPENAI_API_KEY=your-actual-api-key-here
```

### 3. Docker Composeで起動

```bash
docker-compose up --build
```

### 4. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:5000

## ローカル開発（Dockerを使わない場合）

### バックエンド

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### フロントエンド

```bash
cd frontend
npm install
npm run dev
```

## 使い方

1. ブラウザで http://localhost:3000 を開く
2. 「ベースライン画像」と「比較対象画像」をアップロード
   - ドラッグ&ドロップまたはクリックして選択
   - JPG, JPEG, PNG形式（最大10MB）
3. 「評価を実行」ボタンをクリック
4. 数秒後に評価結果が表示されます
   - 各部位のスコアと評価コメント
   - 総合スコア
   - 2枚の画像の並列表示

## API仕様

### POST /api/evaluate

2枚の画像を評価するエンドポイント

**リクエスト:**
```
Content-Type: multipart/form-data

baseline_image: File
comparison_image: File
```

**レスポンス例:**
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

## 環境変数

### バックエンド
- `FLASK_ENV`: 開発環境（development / production）
- `OPENAI_API_KEY`: OpenAI APIキー（必須）
- `CORS_ORIGINS`: 許可するCORSオリジン
- `PORT`: サーバーポート（デフォルト: 5000）

### フロントエンド
- `NEXT_PUBLIC_API_URL`: バックエンドAPIのURL

## 注意事項

- OpenAI APIキーが必要です
- 画像はメモリ上で処理され、保存されません
- データベース機能はありません（将来の拡張予定）
- 評価履歴は保存されません

## トラブルシューティング

### Dockerコンテナが起動しない
```bash
# コンテナとイメージを削除して再ビルド
docker-compose down
docker-compose up --build
```

### OpenAI APIエラー
- `.env`ファイルにAPIキーが正しく設定されているか確認
- APIキーの有効性を確認
- OpenAIのレート制限に達していないか確認

### フロントエンドがバックエンドに接続できない
- バックエンドが起動しているか確認: http://localhost:5000/health
- `.env`ファイルのURLが正しいか確認

## 今後の拡張予定

- データベース（PostgreSQL）の導入
- ユーザー認証機能
- 評価履歴の保存
- リーダーボード機能
- ベースライン画像の管理機能

## ライセンス

MIT

## 詳細仕様

詳細な仕様については `claude.md` を参照してください。
