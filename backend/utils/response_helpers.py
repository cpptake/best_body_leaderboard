from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    """
    成功レスポンスを生成

    Args:
        data: レスポンスデータ
        message: メッセージ
        status_code: HTTPステータスコード

    Returns:
        tuple: (response, status_code)
    """
    response = {}

    if message:
        response['message'] = message

    if data is not None:
        if isinstance(data, dict):
            response.update(data)
        else:
            response['data'] = data

    return jsonify(response), status_code


def error_response(error, message=None, status_code=400):
    """
    エラーレスポンスを生成

    Args:
        error: エラー内容（文字列またはException）
        message: 追加メッセージ
        status_code: HTTPステータスコード

    Returns:
        tuple: (response, status_code)
    """
    response = {
        'error': str(error) if error else 'An error occurred'
    }

    if message:
        response['message'] = message

    return jsonify(response), status_code
