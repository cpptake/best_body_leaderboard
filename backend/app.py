import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.openai_service import evaluate_bodybuilder_images
from utils.image_utils import is_allowed_file, prepare_image_for_openai

# 環境変数の読み込み
load_dotenv()

# ロギング設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 開発環境ではDEBUGレベルに変更
if os.getenv('FLASK_ENV') == 'development':
    logging.getLogger().setLevel(logging.DEBUG)
    logger.debug("デバッグモードが有効です")

# Flaskアプリケーションの初期化
app = Flask(__name__)

# CORS設定
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=cors_origins)
logger.info(f"CORS設定完了: {cors_origins}")


@app.route('/health', methods=['GET'])
def health_check():
    """
    ヘルスチェックエンドポイント
    """
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """
    2枚の画像を評価するエンドポイント

    Request:
        - baseline_image: ベースライン画像ファイル
        - comparison_image: 比較対象画像ファイル

    Response:
        - success: bool
        - data: 評価結果（スコアとコメント）
        - error: エラーメッセージ（エラー時）
    """
    logger.info("=== 評価リクエスト開始 ===")

    try:
        # ファイルの存在チェック
        if 'baseline_image' not in request.files:
            logger.warning("ベースライン画像が指定されていません")
            return jsonify({
                'success': False,
                'error': 'ベースライン画像が指定されていません'
            }), 400

        if 'comparison_image' not in request.files:
            logger.warning("比較対象画像が指定されていません")
            return jsonify({
                'success': False,
                'error': '比較対象画像が指定されていません'
            }), 400

        baseline_file = request.files['baseline_image']
        comparison_file = request.files['comparison_image']

        logger.info(f"ベースライン画像: {baseline_file.filename}")
        logger.info(f"比較対象画像: {comparison_file.filename}")

        # ファイル名のチェック
        if baseline_file.filename == '':
            logger.warning("ベースライン画像のファイル名が空です")
            return jsonify({
                'success': False,
                'error': 'ベースライン画像のファイル名が空です'
            }), 400

        if comparison_file.filename == '':
            logger.warning("比較対象画像のファイル名が空です")
            return jsonify({
                'success': False,
                'error': '比較対象画像のファイル名が空です'
            }), 400

        # ファイル形式のチェック
        if not is_allowed_file(baseline_file.filename):
            logger.warning(f"ベースライン画像の形式が無効: {baseline_file.filename}")
            return jsonify({
                'success': False,
                'error': 'ベースライン画像の形式が無効です（JPG, JPEG, PNGのみ対応）'
            }), 400

        if not is_allowed_file(comparison_file.filename):
            logger.warning(f"比較対象画像の形式が無効: {comparison_file.filename}")
            return jsonify({
                'success': False,
                'error': '比較対象画像の形式が無効です（JPG, JPEG, PNGのみ対応）'
            }), 400

        # 画像の準備（バリデーション、リサイズ、Base64エンコード）
        logger.info("ベースライン画像を準備中...")
        baseline_image_base64 = prepare_image_for_openai(baseline_file)
        logger.debug(f"ベースライン画像のBase64長: {len(baseline_image_base64)}")

        logger.info("比較対象画像を準備中...")
        comparison_image_base64 = prepare_image_for_openai(comparison_file)
        logger.debug(f"比較対象画像のBase64長: {len(comparison_image_base64)}")

        # OpenAI APIで評価
        logger.info("OpenAI APIで評価中...")
        evaluation_result = evaluate_bodybuilder_images(
            baseline_image_base64,
            comparison_image_base64
        )

        # 画像のBase64データをレスポンスに含める
        evaluation_result['baseline_image_url'] = baseline_image_base64
        evaluation_result['comparison_image_url'] = comparison_image_base64

        logger.info("=== 評価リクエスト成功 ===")
        return jsonify({
            'success': True,
            'data': evaluation_result
        }), 200

    except ValueError as e:
        # バリデーションエラー
        logger.error(f"バリデーションエラー: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        # その他のエラー
        logger.error(f"サーバーエラー: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'サーバーエラーが発生しました: {str(e)}'
        }), 500


@app.errorhandler(404)
def not_found(error):
    """
    404エラーハンドラ
    """
    logger.warning(f"404エラー: {request.path}")
    return jsonify({
        'success': False,
        'error': 'エンドポイントが見つかりません'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """
    500エラーハンドラ
    """
    logger.error(f"500エラー: {error}", exc_info=True)
    return jsonify({
        'success': False,
        'error': '内部サーバーエラーが発生しました'
    }), 500


if __name__ == '__main__':
    # OpenAI APIキーのチェック
    if not os.getenv('OPENAI_API_KEY'):
        logger.warning("OPENAI_API_KEYが設定されていません")
    else:
        logger.info("OPENAI_API_KEYが設定されています")

    # サーバー起動
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV') == 'development'

    logger.info(f"Flaskサーバーを起動中... (ポート: {port}, デバッグモード: {debug})")
    app.run(host='0.0.0.0', port=port, debug=debug)
