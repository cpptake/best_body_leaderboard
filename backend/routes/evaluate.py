from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.evaluation import Evaluation
from models.baseline_image import BaselineImage
from models.comparison_image import ComparisonImage
from services.s3_service import s3_service
from services.openai_service import openai_service

evaluate_bp = Blueprint('evaluate', __name__)

@evaluate_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def create_evaluation():
    """
    画像評価を実行

    Request:
        - comparison_image: 比較対象画像ファイル（必須）
        - baseline_image_id: ベースライン画像ID（オプション、未指定の場合はアクティブなものを使用）
        - custom_prompt: カスタムプロンプト（オプション、未指定の場合はデフォルトプロンプトを使用）
    """
    try:
        current_user_id = get_jwt_identity()

        # 1. ベースライン画像の取得
        baseline_image_id = request.form.get('baseline_image_id')

        if baseline_image_id:
            baseline_image = BaselineImage.query.get(baseline_image_id)
            if not baseline_image:
                return jsonify({'error': 'Baseline image not found'}), 404
        else:
            # アクティブなベースライン画像を取得
            baseline_image = BaselineImage.query.filter_by(is_active=True).first()
            if not baseline_image:
                return jsonify({'error': 'No active baseline image found'}), 404

        # 2. 比較画像のアップロード
        if 'comparison_image' not in request.files:
            return jsonify({'error': 'Comparison image is required'}), 400

        comparison_file = request.files['comparison_image']

        # 画像をS3にアップロード
        try:
            upload_result = s3_service.upload_image(comparison_file, folder='comparison_images')
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': f'Image upload failed: {str(e)}'}), 500

        # 比較画像をDBに保存
        comparison_image = ComparisonImage(
            user_id=current_user_id,
            image_url=upload_result['url'],
            s3_key=upload_result['s3_key']
        )
        db.session.add(comparison_image)
        db.session.flush()  # IDを取得するため

        # 3. 署名付きURLを生成（OpenAI APIに渡すため）
        baseline_url = s3_service.get_image_url(baseline_image.s3_key, use_presigned=True)
        comparison_url = s3_service.get_image_url(comparison_image.s3_key, use_presigned=True)

        # 4. プロンプトの取得
        custom_prompt = request.form.get('custom_prompt')
        if custom_prompt:
            prompt = custom_prompt
        else:
            prompt = openai_service.create_evaluation_prompt()

        # 5. OpenAI Vision APIで評価
        try:
            evaluation_result = openai_service.evaluate_physique(
                baseline_image_url=baseline_url,
                comparison_image_url=comparison_url,
                prompt=prompt
            )
        except Exception as e:
            # OpenAI APIエラーの場合、アップロードした画像を削除
            try:
                s3_service.delete_image(comparison_image.s3_key)
            except:
                pass
            db.session.rollback()
            return jsonify({'error': f'Evaluation failed: {str(e)}'}), 500

        # 6. 評価結果をDBに保存
        evaluation = Evaluation(
            user_id=current_user_id,
            baseline_image_id=baseline_image.id,
            comparison_image_id=comparison_image.id,
            shoulder_score=evaluation_result['shoulder_score'],
            chest_score=evaluation_result['chest_score'],
            arm_score=evaluation_result['arm_score'],
            back_score=evaluation_result['back_score'],
            abs_score=evaluation_result['abs_score'],
            total_score=evaluation_result['total_score'],
            evaluation_comment=str(evaluation_result.get('comments', ''))
        )

        db.session.add(evaluation)
        db.session.commit()

        # 7. レスポンス
        return jsonify({
            'message': 'Evaluation completed successfully',
            'evaluation': evaluation.to_dict(include_images=True),
            'scores': {
                'shoulder': evaluation.shoulder_score,
                'chest': evaluation.chest_score,
                'arm': evaluation.arm_score,
                'back': evaluation.back_score,
                'abs': evaluation.abs_score,
                'total': evaluation.total_score
            },
            'comments': evaluation_result.get('comments', {})
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluate_bp.route('/evaluations', methods=['GET'])
@jwt_required()
def get_evaluations():
    """ユーザーの評価履歴を取得"""
    try:
        current_user_id = get_jwt_identity()

        # クエリパラメータ
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)

        # ページネーション
        pagination = Evaluation.query.filter_by(user_id=current_user_id)\
            .order_by(Evaluation.evaluated_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        evaluations = [eval.to_dict(include_images=True) for eval in pagination.items]

        return jsonify({
            'evaluations': evaluations,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluate_bp.route('/evaluations/<evaluation_id>', methods=['GET'])
@jwt_required()
def get_evaluation(evaluation_id):
    """特定の評価詳細を取得"""
    try:
        current_user_id = get_jwt_identity()

        evaluation = Evaluation.query.get(evaluation_id)

        if not evaluation:
            return jsonify({'error': 'Evaluation not found'}), 404

        # 自分の評価のみ取得可能
        if evaluation.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403

        return jsonify(evaluation.to_dict(include_images=True)), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluate_bp.route('/evaluations/<evaluation_id>', methods=['DELETE'])
@jwt_required()
def delete_evaluation(evaluation_id):
    """評価を削除"""
    try:
        current_user_id = get_jwt_identity()

        evaluation = Evaluation.query.get(evaluation_id)

        if not evaluation:
            return jsonify({'error': 'Evaluation not found'}), 404

        # 自分の評価のみ削除可能
        if evaluation.user_id != current_user_id:
            return jsonify({'error': 'Access denied'}), 403

        db.session.delete(evaluation)
        db.session.commit()

        return jsonify({'message': 'Evaluation deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
