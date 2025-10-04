from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from middleware.auth import admin_required
from models import db
from models.baseline_image import BaselineImage
from models.user import User

baseline_images_bp = Blueprint('baseline_images', __name__)

@baseline_images_bp.route('', methods=['GET'])
def get_baseline_images():
    """ベースライン画像一覧を取得"""
    try:
        # クエリパラメータ
        active_only = request.args.get('active_only', 'false').lower() == 'true'

        query = BaselineImage.query

        if active_only:
            query = query.filter_by(is_active=True)

        baseline_images = query.order_by(BaselineImage.created_at.desc()).all()

        return jsonify({
            'baseline_images': [img.to_dict() for img in baseline_images]
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@baseline_images_bp.route('/active', methods=['GET'])
def get_active_baseline_image():
    """現在アクティブなベースライン画像を取得"""
    try:
        baseline_image = BaselineImage.query.filter_by(is_active=True).first()

        if not baseline_image:
            return jsonify({'error': 'No active baseline image found'}), 404

        return jsonify(baseline_image.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@baseline_images_bp.route('/<image_id>', methods=['GET'])
def get_baseline_image(image_id):
    """特定のベースライン画像を取得"""
    try:
        baseline_image = BaselineImage.query.get(image_id)

        if not baseline_image:
            return jsonify({'error': 'Baseline image not found'}), 404

        return jsonify(baseline_image.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@baseline_images_bp.route('', methods=['POST'])
@jwt_required()
@admin_required
def create_baseline_image():
    """
    ベースライン画像を登録（管理者のみ）

    TODO: 画像アップロード処理（S3）を実装
    """
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # バリデーション
        if not data or not data.get('image_url') or not data.get('s3_key'):
            return jsonify({'error': 'image_url and s3_key are required'}), 400

        # ベースライン画像作成
        baseline_image = BaselineImage(
            image_url=data['image_url'],
            s3_key=data['s3_key'],
            description=data.get('description'),
            is_active=data.get('is_active', True),
            created_by=current_user_id
        )

        db.session.add(baseline_image)
        db.session.commit()

        return jsonify({
            'message': 'Baseline image created successfully',
            'baseline_image': baseline_image.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@baseline_images_bp.route('/<image_id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_baseline_image(image_id):
    """ベースライン画像を更新（管理者のみ）"""
    try:
        baseline_image = BaselineImage.query.get(image_id)

        if not baseline_image:
            return jsonify({'error': 'Baseline image not found'}), 404

        data = request.get_json()

        # 更新可能なフィールド
        if 'description' in data:
            baseline_image.description = data['description']

        if 'is_active' in data:
            baseline_image.is_active = data['is_active']

        db.session.commit()

        return jsonify({
            'message': 'Baseline image updated successfully',
            'baseline_image': baseline_image.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@baseline_images_bp.route('/<image_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_baseline_image(image_id):
    """ベースライン画像を削除（管理者のみ）"""
    try:
        baseline_image = BaselineImage.query.get(image_id)

        if not baseline_image:
            return jsonify({'error': 'Baseline image not found'}), 404

        # TODO: S3から画像を削除

        db.session.delete(baseline_image)
        db.session.commit()

        return jsonify({'message': 'Baseline image deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
