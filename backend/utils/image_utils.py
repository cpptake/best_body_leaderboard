import base64
import logging
from io import BytesIO
from PIL import Image

# ロガーの設定
logger = logging.getLogger(__name__)

# 許可する画像形式
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_DIMENSION = 1920  # 最大幅・高さ


def is_allowed_file(filename):
    """
    ファイル名が許可された拡張子かどうかをチェック
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def validate_image(file):
    """
    画像ファイルのバリデーション
    - ファイルサイズのチェック
    - 画像形式のチェック
    """
    # ファイルサイズチェック
    file.seek(0, 2)  # ファイルの終端に移動
    file_size = file.tell()
    file.seek(0)  # ファイルの先頭に戻す

    logger.debug(f"画像サイズ: {file_size / (1024*1024):.2f}MB")

    if file_size > MAX_IMAGE_SIZE:
        logger.error(f"画像サイズが制限を超えています: {file_size / (1024*1024):.2f}MB > {MAX_IMAGE_SIZE // (1024*1024)}MB")
        raise ValueError(f"画像サイズが大きすぎます（最大{MAX_IMAGE_SIZE // (1024*1024)}MB）")

    # 画像として読み込めるかチェック
    try:
        img = Image.open(file)
        img.verify()
        file.seek(0)  # ファイルの先頭に戻す
        logger.debug("画像バリデーション成功")
        return True
    except Exception as e:
        logger.error(f"画像バリデーション失敗: {str(e)}")
        raise ValueError(f"無効な画像ファイルです: {str(e)}")


def resize_image_if_needed(image, max_dimension=MAX_DIMENSION):
    """
    画像が大きすぎる場合はリサイズする
    アスペクト比は維持する
    """
    width, height = image.size
    logger.debug(f"元の画像サイズ: {width}x{height}")

    if width <= max_dimension and height <= max_dimension:
        logger.debug("リサイズ不要")
        return image

    # アスペクト比を維持してリサイズ
    if width > height:
        new_width = max_dimension
        new_height = int(height * (max_dimension / width))
    else:
        new_height = max_dimension
        new_width = int(width * (max_dimension / height))

    logger.info(f"画像をリサイズ: {width}x{height} -> {new_width}x{new_height}")
    return image.resize((new_width, new_height), Image.Resampling.LANCZOS)


def image_to_base64(file):
    """
    画像ファイルをBase64エンコードされた文字列に変換
    必要に応じてリサイズも行う
    """
    try:
        # 画像を開く
        logger.debug("画像を開いています...")
        img = Image.open(file)
        logger.debug(f"画像モード: {img.mode}")

        # RGBモードに変換（PNGのアルファチャンネルなどを処理）
        if img.mode != 'RGB':
            logger.debug(f"画像をRGBモードに変換: {img.mode} -> RGB")
            img = img.convert('RGB')

        # 必要に応じてリサイズ
        img = resize_image_if_needed(img)

        # BytesIOに保存
        logger.debug("画像をJPEG形式でエンコード中...")
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)

        # Base64エンコード
        logger.debug("Base64エンコード中...")
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        logger.debug(f"Base64エンコード完了（長さ: {len(img_base64)}文字）")
        return f"data:image/jpeg;base64,{img_base64}"
    except Exception as e:
        logger.error(f"画像のBase64エンコード中にエラー: {str(e)}", exc_info=True)
        raise ValueError(f"画像のエンコードに失敗しました: {str(e)}")


def prepare_image_for_openai(file):
    """
    OpenAI APIに送信するための画像を準備
    - バリデーション
    - リサイズ
    - Base64エンコード
    """
    logger.info("OpenAI用の画像を準備中...")

    # バリデーション
    logger.debug("画像をバリデーション中...")
    validate_image(file)

    # Base64エンコード
    logger.debug("画像をBase64エンコード中...")
    result = image_to_base64(file)

    logger.info("OpenAI用の画像準備完了")
    return result
