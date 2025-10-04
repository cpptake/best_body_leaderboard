# Services

外部サービス連携層

## S3 Service

AWS S3との連携を担当するサービス

### 主な機能

- **画像バリデーション** - ファイルタイプ、サイズ、形式の検証
- **画像リサイズ** - Pillowを使用して最大1920x1920にリサイズ
- **S3アップロード** - 画像をS3にアップロード
- **署名付きURL生成** - 一時的なアクセス用URLを生成
- **画像削除** - S3から画像を削除

### 使用例

```python
from services.s3_service import s3_service

# 画像をアップロード
result = s3_service.upload_image(file, folder='comparison_images')
# => {'url': 'https://...', 's3_key': 'comparison_images/2024/01/15/uuid.jpg'}

# 署名付きURLを生成（1時間有効）
url = s3_service.generate_presigned_url(s3_key, expiration=3600)

# 画像を削除
s3_service.delete_image(s3_key)
```

### バリデーション

- **許可される形式**: JPG, PNG, JPEG
- **最大ファイルサイズ**: 10MB
- **リサイズ**: 最大1920x1920px（アスペクト比維持）
- **EXIF対応**: スマホ写真の回転を自動補正

## OpenAI Service

OpenAI Vision APIとの連携を担当するサービス

### 主な機能

- **肉体評価** - 2枚の画像を比較してボディビルダーの肉体を評価
- **プロンプト生成** - デフォルトの評価プロンプトを生成
- **レスポンスパース** - APIレスポンスをパースして評価結果を抽出
- **リトライロジック** - レート制限やタイムアウト時の自動リトライ

### 使用例

```python
from services.openai_service import openai_service

# デフォルトプロンプトを取得
prompt = openai_service.create_evaluation_prompt()

# 肉体を評価
result = openai_service.evaluate_physique(
    baseline_image_url="https://...",
    comparison_image_url="https://...",
    prompt=prompt,
    max_retries=3
)

# 結果
# {
#     'shoulder_score': 5,
#     'chest_score': 3,
#     'arm_score': -2,
#     'back_score': 7,
#     'abs_score': 4,
#     'total_score': 17,
#     'comments': {
#         'shoulder': '三角筋の張り出しが優れています',
#         ...
#     }
# }
```

### エラーハンドリング

- **RateLimitError**: 指数バックオフでリトライ
- **APIConnectionError**: 自動リトライ
- **APITimeoutError**: 自動リトライ
- **その他のエラー**: 例外をスロー

### 評価スコア

各部位は **-10〜+10** の範囲で評価されます：

- **肩** (shoulder_score): 三角筋の発達度
- **胸** (chest_score): 大胸筋の発達度
- **腕** (arm_score): 上腕二頭筋・三頭筋の発達度
- **背中** (back_score): 広背筋・僧帽筋の発達度
- **腹** (abs_score): 腹直筋の明瞭さ

**合計スコア** (total_score): -50〜+50

## 設定

`.env`ファイルで以下の環境変数を設定してください：

```bash
# AWS S3
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

## テスト

```bash
# モックを使用したテスト
pytest tests/services/test_s3_service.py
pytest tests/services/test_openai_service.py
```
