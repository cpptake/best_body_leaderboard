import os
from werkzeug.utils import secure_filename

def allowed_file(filename, allowed_extensions=None):
    """
    ファイル拡張子が許可されているかチェック

    Args:
        filename: ファイル名
        allowed_extensions: 許可する拡張子のセット（デフォルト: {'png', 'jpg', 'jpeg'}）

    Returns:
        bool: 許可されている場合True
    """
    if allowed_extensions is None:
        allowed_extensions = {'png', 'jpg', 'jpeg'}

    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions


def get_file_extension(filename):
    """
    ファイル拡張子を取得

    Args:
        filename: ファイル名

    Returns:
        str: 拡張子（小文字、ドットなし）
    """
    if '.' in filename:
        return filename.rsplit('.', 1)[1].lower()
    return ''


def get_secure_filename(filename):
    """
    安全なファイル名を取得

    Args:
        filename: 元のファイル名

    Returns:
        str: セキュアなファイル名
    """
    return secure_filename(filename)
