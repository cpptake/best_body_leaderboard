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
