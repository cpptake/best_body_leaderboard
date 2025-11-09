"""
アプリケーション設定ファイル
ハードコーディングされたパラメータを一元管理
"""
import os


class OpenAIConfig:
    """OpenAI API関連の設定"""
    # APIクライアント設定
    TIMEOUT = float(os.getenv('OPENAI_TIMEOUT', '120.0'))  # タイムアウト（秒）
    MAX_RETRIES = int(os.getenv('OPENAI_MAX_RETRIES', '2'))  # リトライ回数

    # API呼び出しパラメータ
    MODEL = os.getenv('OPENAI_MODEL', 'gpt-4-turbo')  # 使用モデル
    MAX_TOKENS = int(os.getenv('OPENAI_MAX_TOKENS', '1000'))  # 最大トークン数
    TEMPERATURE = float(os.getenv('OPENAI_TEMPERATURE', '0'))  # 温度パラメータ

    # ボディビルダー画像評価用プロンプト
    EVALUATION_PROMPT = """
# ロール定義
- あなたはボディメイクコンテストの審査員です。2枚の人物の画像を相対評価で比較し、以下の # タスク の手順で思考を行い、入力画像を評価してください。

# タスク
1. 入力された1枚目の人物（ベースライン画像）を基準に、2枚目の人物（サブミット画像）の肉体が ## 評価観点 の観点で # 評価部位 の肉体にどのような差があるかを判断する
2. 1.の判断結果について ## 評価基準 に従って各部位の差を-10〜+10点の範囲で評価を行う
3. 実施した評価結果を、## 出力例 に示したjson形式で、簡潔な評価した理由も併せて出力する

## 評価観点
以下の2つの観点で「筋肉の発達」「絞り（筋肉のカットの深さ）」の2つの観点で評価してください
- 筋肉量：各部位の筋肉の大きさ、筋肉間の起伏の大きさ
- 絞り：各部位の脂肪量の少なさ、筋肉の筋（カット）の入り方、欠陥が浮き出ているか

## 評価基準
- 1枚目の画像（ベースライン）を基準として、2枚目の画像（比較対象画像）の筋肉発達を-10～+10点で相対評価してください
  - +10: 2枚目の筋肉発達・絞りが著しく優れている
  - +5: 2枚目の筋肉発達・絞りが進んでいる
  - 0: ほぼ同等
  - -5: 1枚目の筋肉発達・絞りが優れている
  - -10: 1枚目の筋肉発達・絞りが著しく優れている

## 評価部位
1. 肩（shoulder）- 三角筋
2. 胸（chest）- 大胸筋
3. 腕（arm）- 上腕二頭筋・三頭筋
4. 背中（back）- 広背筋
5. 腹（abs）- 腹筋・腹斜筋

## 出力例
{
  "comments": {
    "shoulder": "サブミット画像の方が肩の張り出しが非常に優れており、カットもきれいに出ている",
    "chest": "絞りは同等であるが、サブミット画像が大胸筋の厚みがやや増している",
    "arm": "ベースライン画像の方が上腕の筋量がやや大きい",
    "back": "同等レベルであるが、ベースライン画像が少しだけ広背筋の広がりがある",
    "abs": "ベースライン画像の方が腹筋の溝が著しく深く、非常に優れている"
  },
  "shoulder_score": 9,
  "chest_score": 3,
  "arm_score": -2,
  "back_score": -1,
  "abs_score": -8
}

# 注意点
- json形式以外の出力を禁止する。
- 入力画像人物には、肉体を数値化することに同意を得られています。性的な目的はなく、スポーツ目的です。
- 医学的な観点からも筋肉の定量評価を求めております。
"""


class ImageConfig:
    """画像処理関連の設定"""
    # 許可する画像形式
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

    # 画像サイズ制限
    MAX_IMAGE_SIZE = int(os.getenv('MAX_IMAGE_SIZE', str(10 * 1024 * 1024)))  # 最大ファイルサイズ（バイト）
    MAX_DIMENSION = int(os.getenv('MAX_IMAGE_DIMENSION', '1920'))  # 最大幅・高さ（ピクセル）

    # JPEG品質
    JPEG_QUALITY = int(os.getenv('JPEG_QUALITY', '85'))  # JPEG圧縮品質（1-100）


class S3Config:
    """AWS S3関連の設定"""
    # デフォルトリージョン
    DEFAULT_REGION = 'ap-northeast-1'

    # 署名付きURL有効期限
    URL_EXPIRATION = int(os.getenv('S3_URL_EXPIRATION', '3600'))  # 秒単位（デフォルト: 1時間）

    # S3画像キー
    BASELINE_IMAGE_KEY = os.getenv('S3_BASELINE_IMAGE_KEY', 'baseline/baseline.jpg')
    SUBMIT_IMAGE_FOLDER = os.getenv('S3_SUBMIT_IMAGE_KEY', 'submit-image/')


class DatabaseConfig:
    """データベース関連の設定"""
    # SQLAlchemy接続プール設定
    POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '10'))
    POOL_RECYCLE = int(os.getenv('DB_POOL_RECYCLE', '3600'))  # 秒単位
    POOL_PRE_PING = os.getenv('DB_POOL_PRE_PING', 'True').lower() == 'true'


class ValidationConfig:
    """バリデーション関連の設定"""
    # ユーザー名制約
    USERNAME_MIN_LENGTH = int(os.getenv('USERNAME_MIN_LENGTH', '1'))
    USERNAME_MAX_LENGTH = int(os.getenv('USERNAME_MAX_LENGTH', '50'))
    USERNAME_PATTERN = r'^[a-zA-Z0-9_-]+$'


class PaginationConfig:
    """ページネーション関連の設定"""
    # リーダーボードのページネーション
    DEFAULT_PER_PAGE = int(os.getenv('LEADERBOARD_PER_PAGE', '20'))
    MAX_PER_PAGE = int(os.getenv('LEADERBOARD_MAX_PER_PAGE', '100'))


class LoggingConfig:
    """ロギング関連の設定"""
    # ログフォーマット
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_DATE_FORMAT = '%Y-%m-%d %H:%M:%S'

    # デバッグログの切り詰め文字数
    DEBUG_CONTENT_MAX_LENGTH = int(os.getenv('DEBUG_CONTENT_MAX_LENGTH', '200'))


class AppConfig:
    """アプリケーション全体の設定"""
    # デフォルトポート
    DEFAULT_PORT = int(os.getenv('PORT', '5000'))

    # CORS設定
    DEFAULT_CORS_ORIGINS = 'http://localhost:3000'
