from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db
from models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    """自分のプロフィールを取得"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_my_profile():
    """プロフィールを更新"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # ユーザー名の更新
        if 'username' in data:
            new_username = data['username']

            # 重複チェック
            existing_user = User.query.filter_by(username=new_username).first()
            if existing_user and existing_user.id != current_user_id:
                return jsonify({'error': 'Username already exists'}), 400

            user.username = new_username

        # パスワードの更新
        if 'password' in data:
            user.set_password(data['password'])

        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/me', methods=['DELETE'])
@jwt_required()
def delete_my_account():
    """アカウントを削除"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # TODO: ユーザーに関連する画像をS3から削除

        db.session.delete(user)
        db.session.commit()

        return jsonify({'message': 'Account deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """特定ユーザーの公開情報を取得"""
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # 公開情報のみ返す
        return jsonify({
            'id': user.id,
            'username': user.username,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
