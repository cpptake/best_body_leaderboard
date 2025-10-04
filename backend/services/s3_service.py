import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from werkzeug.utils import secure_filename
from PIL import Image
import io
import uuid
from datetime import datetime, timedelta
from flask import current_app

class S3Service:
    """AWS S3連携サービス"""

    def __init__(self):
        self.s3_client = None
        self.bucket_name = None

    def _get_s3_client(self):
        """S3クライアントを取得（遅延初期化）"""
        if not self.s3_client:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=current_app.config.get('AWS_ACCESS_KEY_ID'),
                aws_secret_access_key=current_app.config.get('AWS_SECRET_ACCESS_KEY'),
                region_name=current_app.config.get('AWS_REGION', 'ap-northeast-1')
            )
            self.bucket_name = current_app.config.get('AWS_S3_BUCKET')
        return self.s3_client

    def validate_image(self, file):
        """
        画像ファイルをバリデーション

        Args:
            file: FileStorageオブジェクト

        Returns:
            tuple: (is_valid: bool, error_message: str or None)
        """
        # ファイルの存在チェック
        if not file:
            return False, 'No file provided'

        # ファイル名チェック
        if file.filename == '':
            return False, 'No selected file'

        # ファイル拡張子チェック
        allowed_extensions = current_app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg'})
        file_ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''

        if file_ext not in allowed_extensions:
            return False, f'Invalid file type. Allowed types: {", ".join(allowed_extensions)}'

        # ファイルサイズチェック（10MB）
        max_size = current_app.config.get('MAX_CONTENT_LENGTH', 10 * 1024 * 1024)
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > max_size:
            return False, f'File too large. Maximum size: {max_size / (1024 * 1024)}MB'

        # 画像フォーマットチェック（Pillowで検証）
        try:
            image = Image.open(file)
            image.verify()
            file.seek(0)  # ファイルポインタを先頭に戻す
        except Exception as e:
            return False, f'Invalid image file: {str(e)}'

        return True, None

    def resize_image(self, file, max_width=1920, max_height=1920):
        """
        画像をリサイズ

        Args:
            file: FileStorageオブジェクト
            max_width: 最大幅（デフォルト: 1920px）
            max_height: 最大高さ（デフォルト: 1920px）

        Returns:
            BytesIO: リサイズされた画像データ
        """
        try:
            image = Image.open(file)

            # EXIF情報に基づいて画像を回転（スマホ写真対応）
            try:
                from PIL import ImageOps
                image = ImageOps.exif_transpose(image)
            except Exception:
                pass

            # アスペクト比を維持してリサイズ
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

            # RGBモードに変換（PNGのアルファチャンネル対応）
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode == 'RGBA' else None)
                image = background

            # バイトストリームに保存
            output = io.BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            output.seek(0)

            return output

        except Exception as e:
            raise Exception(f'Image resize failed: {str(e)}')

    def upload_image(self, file, folder='images'):
        """
        画像をS3にアップロード

        Args:
            file: FileStorageオブジェクト
            folder: S3内のフォルダ名（デフォルト: 'images'）

        Returns:
            dict: {'url': str, 's3_key': str}

        Raises:
            Exception: アップロード失敗時
        """
        # バリデーション
        is_valid, error_msg = self.validate_image(file)
        if not is_valid:
            raise ValueError(error_msg)

        # 画像リサイズ
        resized_image = self.resize_image(file)

        # ユニークなファイル名を生成
        file_ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        s3_key = f"{folder}/{datetime.utcnow().strftime('%Y/%m/%d')}/{unique_filename}"

        try:
            s3_client = self._get_s3_client()

            # S3にアップロード
            s3_client.upload_fileobj(
                resized_image,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': 'image/jpeg',
                    'ACL': 'private'  # プライベートアクセス
                }
            )

            # URLを生成（署名付きURLではなく、直接アクセス用のURL）
            # 実際の運用では署名付きURLを使用することを推奨
            url = f"https://{self.bucket_name}.s3.{current_app.config.get('AWS_REGION')}.amazonaws.com/{s3_key}"

            return {
                'url': url,
                's3_key': s3_key
            }

        except NoCredentialsError:
            raise Exception('AWS credentials not found')
        except ClientError as e:
            raise Exception(f'S3 upload failed: {str(e)}')
        except Exception as e:
            raise Exception(f'Upload failed: {str(e)}')

    def generate_presigned_url(self, s3_key, expiration=3600):
        """
        署名付きURLを生成（一時的なアクセス用）

        Args:
            s3_key: S3オブジェクトキー
            expiration: 有効期限（秒）デフォルト: 1時間

        Returns:
            str: 署名付きURL
        """
        try:
            s3_client = self._get_s3_client()

            url = s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )

            return url

        except ClientError as e:
            raise Exception(f'Failed to generate presigned URL: {str(e)}')

    def delete_image(self, s3_key):
        """
        S3から画像を削除

        Args:
            s3_key: S3オブジェクトキー

        Returns:
            bool: 成功時True
        """
        try:
            s3_client = self._get_s3_client()

            s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )

            return True

        except ClientError as e:
            raise Exception(f'Failed to delete image: {str(e)}')

    def get_image_url(self, s3_key, use_presigned=True, expiration=3600):
        """
        画像URLを取得

        Args:
            s3_key: S3オブジェクトキー
            use_presigned: 署名付きURLを使用するか（デフォルト: True）
            expiration: 署名付きURLの有効期限（秒）

        Returns:
            str: 画像URL
        """
        if use_presigned:
            return self.generate_presigned_url(s3_key, expiration)
        else:
            return f"https://{self.bucket_name}.s3.{current_app.config.get('AWS_REGION')}.amazonaws.com/{s3_key}"


# シングルトンインスタンス
s3_service = S3Service()
