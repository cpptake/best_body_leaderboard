import os
import logging
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from services.openai_service import evaluate_bodybuilder_images
from utils.image_utils import is_allowed_file, prepare_image_for_openai
from utils.s3_utils import get_s3_client
from models.evaluation import db, Evaluation
from sqlalchemy import desc, func

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

# データベース設定
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
}

# SQLAlchemyの初期化
db.init_app(app)

# CORS設定
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, origins=cors_origins)
logger.info(f"CORS設定完了: {cors_origins}")

# データベーステーブルの作成
with app.app_context():
    db.create_all()
    logger.info("データベーステーブルの初期化完了")


@app.route('/health', methods=['GET'])
def health_check():
    """
    ヘルスチェックエンドポイント
    """
    return jsonify({'status': 'healthy'}), 200


@app.route('/api/baseline-image', methods=['GET'])
def get_baseline_image():
    """
    S3からベースライン画像の署名付きURLを取得するエンドポイント

    Response:
        - success: bool
        - data: {'image_url': str} - 署名付きURL
        - error: エラーメッセージ（エラー時）
    """
    logger.info("=== ベースライン画像URL取得リクエスト開始 ===")

    try:
        s3_client = get_s3_client()

        if not s3_client.is_available():
            logger.error("S3クライアントが利用できません")
            return jsonify({
                'success': False,
                'error': 'S3設定が正しくありません'
            }), 500

        # S3からベースライン画像のキーを取得
        baseline_image_key = os.getenv('S3_BASELINE_IMAGE_KEY', 'baseline/baseline.jpg')

        # 署名付きURLを生成（有効期限: 1時間）
        image_url = s3_client.get_image_url(baseline_image_key, expiration=3600)

        logger.info("ベースライン画像のURLを生成しました")
        return jsonify({
            'success': True,
            'data': {
                'image_url': image_url
            }
        }), 200

    except Exception as e:
        logger.error(f"ベースライン画像URL取得エラー: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'ベースライン画像の取得に失敗しました: {str(e)}'
        }), 500


def validate_username(username):
    """
    ユーザー名のバリデーション
    - 1〜50文字
    - 英数字、アンダースコア、ハイフンのみ許可
    """
    if not username:
        raise ValueError('ユーザー名が指定されていません')

    username = username.strip()

    if len(username) < 1 or len(username) > 50:
        raise ValueError('ユーザー名は1〜50文字である必要があります')

    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise ValueError('ユーザー名は英数字、アンダースコア、ハイフンのみ使用できます')

    return username


@app.route('/api/evaluate', methods=['POST'])
def evaluate():
    """
    画像を評価するエンドポイント（ベースライン画像は固定）

    Request:
        - username: ユーザー名（必須）
        - comparison_image: 比較対象画像ファイル

    Response:
        - success: bool
        - data: 評価結果（スコアとコメント）+ evaluation_id, username, evaluated_at
        - error: エラーメッセージ（エラー時）
    """
    logger.info("=== 評価リクエスト開始 ===")

    try:
        # ユーザー名のチェック
        username = request.form.get('username')
        try:
            username = validate_username(username)
            logger.info(f"ユーザー名: {username}")
        except ValueError as e:
            logger.warning(f"ユーザー名バリデーションエラー: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400

        # 比較対象画像のファイルチェック
        if 'comparison_image' not in request.files:
            logger.warning("比較対象画像が指定されていません")
            return jsonify({
                'success': False,
                'error': '比較対象画像が指定されていません'
            }), 400

        comparison_file = request.files['comparison_image']
        logger.info(f"比較対象画像: {comparison_file.filename}")

        # ファイル名のチェック
        if comparison_file.filename == '':
            logger.warning("比較対象画像のファイル名が空です")
            return jsonify({
                'success': False,
                'error': '比較対象画像のファイル名が空です'
            }), 400

        # ファイル形式のチェック
        if not is_allowed_file(comparison_file.filename):
            logger.warning(f"比較対象画像の形式が無効: {comparison_file.filename}")
            return jsonify({
                'success': False,
                'error': '比較対象画像の形式が無効です（JPG, JPEG, PNGのみ対応）'
            }), 400

        # S3からベースライン画像を取得
        logger.info("S3からベースライン画像を取得中...")
        s3_client = get_s3_client()

        if not s3_client.is_available():
            logger.error("S3クライアントが利用できません")
            return jsonify({
                'success': False,
                'error': 'S3設定が正しくありません。管理者に連絡してください。'
            }), 500

        try:
            # S3からベースライン画像のキーを取得
            baseline_image_key = os.getenv('S3_BASELINE_IMAGE_KEY', 'baseline/baseline.jpg')
            logger.info(f"ベースライン画像キー: {baseline_image_key}")

            # S3から画像を取得
            baseline_image_data = s3_client.get_image(baseline_image_key)

            # FileStorageオブジェクトとして準備
            from werkzeug.datastructures import FileStorage
            baseline_file = FileStorage(baseline_image_data, filename='baseline.jpg')
            baseline_image_base64 = prepare_image_for_openai(baseline_file)
            logger.debug(f"ベースライン画像のBase64長: {len(baseline_image_base64)}")

        except Exception as e:
            logger.error(f"S3からベースライン画像の取得に失敗しました: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'ベースライン画像の取得に失敗しました: {str(e)}'
            }), 500

        # 比較対象画像の準備（バリデーション、リサイズ、Base64エンコード）
        logger.info("比較対象画像を準備中...")
        comparison_image_base64 = prepare_image_for_openai(comparison_file)
        logger.debug(f"比較対象画像のBase64長: {len(comparison_image_base64)}")

        # OpenAI APIで評価
        logger.info("OpenAI APIで評価中...")
        evaluation_result = evaluate_bodybuilder_images(
            baseline_image_base64,
            comparison_image_base64
        )

        # 評価結果をデータベースに保存
        try:
            evaluation = Evaluation(
                username=username,
                shoulder_score=evaluation_result['shoulder_score'],
                chest_score=evaluation_result['chest_score'],
                arm_score=evaluation_result['arm_score'],
                back_score=evaluation_result['back_score'],
                abs_score=evaluation_result['abs_score'],
                shoulder_comment=evaluation_result['comments']['shoulder'],
                chest_comment=evaluation_result['comments']['chest'],
                arm_comment=evaluation_result['comments']['arm'],
                back_comment=evaluation_result['comments']['back'],
                abs_comment=evaluation_result['comments']['abs']
            )
            db.session.add(evaluation)
            db.session.commit()

            evaluation_id = evaluation.id
            evaluated_at = evaluation.evaluated_at.isoformat()
            logger.info(f"評価結果をデータベースに保存しました (ID: {evaluation_id})")
        except Exception as db_error:
            logger.error(f"データベース保存エラー: {str(db_error)}", exc_info=True)
            db.session.rollback()
            return jsonify({
                'success': False,
                'error': f'データベース保存エラー: {str(db_error)}'
            }), 500

        # レスポンスデータの作成
        response_data = {
            'evaluation_id': evaluation_id,
            'username': username,
            'shoulder_score': evaluation_result['shoulder_score'],
            'chest_score': evaluation_result['chest_score'],
            'arm_score': evaluation_result['arm_score'],
            'back_score': evaluation_result['back_score'],
            'abs_score': evaluation_result['abs_score'],
            'total_score': evaluation_result['total_score'],
            'comments': evaluation_result['comments'],
            'baseline_image_url': baseline_image_base64,
            'comparison_image_url': comparison_image_base64,
            'evaluated_at': evaluated_at
        }

        logger.info("=== 評価リクエスト成功 ===")
        return jsonify({
            'success': True,
            'data': response_data
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


@app.route('/api/leaderboard', methods=['GET'])
def leaderboard():
    """
    リーダーボードを取得するエンドポイント

    Query Parameters:
        - page: ページ番号（デフォルト: 1）
        - per_page: 1ページあたりの件数（デフォルト: 20、最大: 100）

    Response:
        - success: bool
        - data: リーダーボードデータとページネーション情報
    """
    logger.info("=== リーダーボードリクエスト開始 ===")

    try:
        # クエリパラメータの取得
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # ページネーションのバリデーション
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20

        logger.info(f"ページ: {page}, 1ページあたり: {per_page}件")

        # ユーザーごとの最高得点のレコードを取得
        # 各ユーザーの最大total_scoreを持つ評価を取得（同点の場合は最新の評価日時を優先）

        # ステップ1: 各ユーザーの最高得点を取得
        max_scores_subquery = db.session.query(
            Evaluation.username,
            func.max(Evaluation.total_score).label('max_score')
        ).group_by(Evaluation.username).subquery()

        # ステップ2: 最高得点を持つ評価レコードを取得
        # 同じスコアが複数ある場合は、最も新しい評価日時のものを取得
        best_evaluations_subquery = db.session.query(
            Evaluation.username,
            Evaluation.total_score,
            func.max(Evaluation.evaluated_at).label('evaluated_at')
        ).join(
            max_scores_subquery,
            (Evaluation.username == max_scores_subquery.c.username) &
            (Evaluation.total_score == max_scores_subquery.c.max_score)
        ).group_by(
            Evaluation.username,
            Evaluation.total_score
        ).subquery()

        # ステップ3: リーダーボードクエリを作成（スコア順にソート）
        leaderboard_query = db.session.query(
            best_evaluations_subquery.c.username,
            best_evaluations_subquery.c.total_score.label('best_score'),
            best_evaluations_subquery.c.evaluated_at.label('latest_evaluation')
        ).order_by(
            desc(best_evaluations_subquery.c.total_score),
            best_evaluations_subquery.c.username
        )

        # 総件数の取得
        total_count = leaderboard_query.count()

        # ページネーションを適用
        offset = (page - 1) * per_page
        leaderboard_data = leaderboard_query.limit(per_page).offset(offset).all()

        # レスポンスデータの作成
        leaderboard_list = []
        for idx, (username, best_score, latest_evaluation) in enumerate(leaderboard_data, start=offset + 1):
            leaderboard_list.append({
                'rank': idx,
                'username': username,
                'best_score': best_score,
                'evaluated_at': latest_evaluation.isoformat()
            })

        # ページネーション情報
        total_pages = (total_count + per_page - 1) // per_page

        response_data = {
            'leaderboard': leaderboard_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_pages': total_pages,
                'total_count': total_count
            }
        }

        logger.info(f"リーダーボードを取得しました: {len(leaderboard_list)}件")
        return jsonify({
            'success': True,
            'data': response_data
        }), 200

    except Exception as e:
        logger.error(f"リーダーボード取得エラー: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'リーダーボード取得エラー: {str(e)}'
        }), 500


@app.route('/api/leaderboard/user/<username>', methods=['GET'])
def user_evaluation_history(username):
    """
    特定ユーザーの評価履歴を取得するエンドポイント

    Path Parameters:
        - username: ユーザー名

    Response:
        - success: bool
        - data: ユーザーの評価履歴
    """
    logger.info(f"=== ユーザー評価履歴リクエスト: {username} ===")

    try:
        # ユーザー名のバリデーション
        try:
            username = validate_username(username)
        except ValueError as e:
            logger.warning(f"ユーザー名バリデーションエラー: {str(e)}")
            return jsonify({
                'success': False,
                'error': str(e)
            }), 400

        # ユーザーの評価履歴を取得
        evaluations = Evaluation.query.filter_by(username=username).order_by(desc(Evaluation.evaluated_at)).all()

        if not evaluations:
            return jsonify({
                'success': False,
                'error': 'ユーザーが見つかりません'
            }), 404

        # 最高得点と評価回数を計算
        best_score = max(e.total_score for e in evaluations)
        evaluation_count = len(evaluations)

        # 評価履歴リスト
        evaluation_list = []
        for evaluation in evaluations:
            evaluation_list.append({
                'id': evaluation.id,
                'total_score': evaluation.total_score,
                'evaluated_at': evaluation.evaluated_at.isoformat()
            })

        response_data = {
            'username': username,
            'best_score': best_score,
            'evaluation_count': evaluation_count,
            'evaluations': evaluation_list
        }

        logger.info(f"ユーザー {username} の評価履歴を取得しました: {evaluation_count}件")
        return jsonify({
            'success': True,
            'data': response_data
        }), 200

    except Exception as e:
        logger.error(f"ユーザー評価履歴取得エラー: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'ユーザー評価履歴取得エラー: {str(e)}'
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
