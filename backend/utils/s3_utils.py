import os
import logging
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from io import BytesIO

logger = logging.getLogger(__name__)


class S3Client:
    """AWS S3クライアントのユーティリティクラス"""

    def __init__(self):
        """S3クライアントの初期化"""
        self.aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        self.aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        self.bucket_name = os.getenv('AWS_S3_BUCKET')
        self.region = os.getenv('AWS_REGION', 'ap-northeast-1')

        # 環境変数のチェック
        if not all([self.aws_access_key_id, self.aws_secret_access_key, self.bucket_name]):
            logger.warning("S3の環境変数が設定されていません")
            self.s3_client = None
            return

        try:
            # S3クライアントの作成
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=self.aws_access_key_id,
                aws_secret_access_key=self.aws_secret_access_key,
                region_name=self.region
            )
            logger.info(f"S3クライアントを初期化しました (バケット: {self.bucket_name}, リージョン: {self.region})")
        except Exception as e:
            logger.error(f"S3クライアントの初期化に失敗しました: {str(e)}")
            self.s3_client = None

    def is_available(self):
        """S3クライアントが利用可能かチェック"""
        return self.s3_client is not None

    def get_image(self, key):
        """
        S3から画像を取得してBytesIOオブジェクトとして返す

        Args:
            key (str): S3オブジェクトのキー

        Returns:
            BytesIO: 画像データ

        Raises:
            ValueError: S3クライアントが利用不可の場合
            ClientError: S3からの取得に失敗した場合
        """
        if not self.is_available():
            raise ValueError("S3クライアントが初期化されていません")

        try:
            logger.info(f"S3から画像を取得中: s3://{self.bucket_name}/{key}")

            # S3からオブジェクトを取得
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=key
            )

            # BytesIOオブジェクトとして読み込み
            image_data = BytesIO(response['Body'].read())
            image_data.seek(0)  # ファイルポインタを先頭に戻す

            logger.info(f"S3から画像を取得しました: {key}")
            return image_data

        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'NoSuchKey':
                logger.error(f"S3に指定されたキーが存在しません: {key}")
                raise ValueError(f"画像が見つかりません: {key}")
            elif error_code == 'NoSuchBucket':
                logger.error(f"S3バケットが存在しません: {self.bucket_name}")
                raise ValueError(f"S3バケットが見つかりません: {self.bucket_name}")
            else:
                logger.error(f"S3からの画像取得に失敗しました: {str(e)}")
                raise
        except NoCredentialsError:
            logger.error("AWS認証情報が無効です")
            raise ValueError("AWS認証情報が無効です")
        except Exception as e:
            logger.error(f"予期しないエラーが発生しました: {str(e)}")
            raise

    def get_image_url(self, key, expiration=3600):
        """
        S3オブジェクトの署名付きURLを生成

        Args:
            key (str): S3オブジェクトのキー
            expiration (int): URLの有効期限（秒）

        Returns:
            str: 署名付きURL

        Raises:
            ValueError: S3クライアントが利用不可の場合
        """
        if not self.is_available():
            raise ValueError("S3クライアントが初期化されていません")

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': key
                },
                ExpiresIn=expiration
            )
            logger.info(f"署名付きURLを生成しました: {key}")
            return url
        except ClientError as e:
            logger.error(f"署名付きURLの生成に失敗しました: {str(e)}")
            raise

    def upload_image(self, file_data, key, content_type='image/jpeg'):
        """
        S3に画像をアップロード

        Args:
            file_data: アップロードするファイルデータ（BytesIOまたはファイルオブジェクト）
            key (str): S3オブジェクトのキー
            content_type (str): コンテンツタイプ

        Returns:
            str: アップロードされた画像のキー

        Raises:
            ValueError: S3クライアントが利用不可の場合
        """
        if not self.is_available():
            raise ValueError("S3クライアントが初期化されていません")

        try:
            logger.info(f"S3に画像をアップロード中: s3://{self.bucket_name}/{key}")

            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_data,
                ContentType=content_type
            )

            logger.info(f"S3に画像をアップロードしました: {key}")
            return key

        except ClientError as e:
            logger.error(f"S3へのアップロードに失敗しました: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"予期しないエラーが発生しました: {str(e)}")
            raise


# シングルトンインスタンス
_s3_client_instance = None


def get_s3_client():
    """S3クライアントのシングルトンインスタンスを取得"""
    global _s3_client_instance
    if _s3_client_instance is None:
        _s3_client_instance = S3Client()
    return _s3_client_instance
