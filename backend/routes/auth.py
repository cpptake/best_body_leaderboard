from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db
from models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """ユーザー登録"""
    try:
        data = request.get_json()

        # バリデーション
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        username = data['username']
        password = data['password']

        # ユーザー名の重複チェック
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 400

        # ユーザー作成
        user = User(username=username)
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # JWTトークン生成
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """ログイン"""
    try:
        data = request.get_json()

        # バリデーション
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400

        username = data['username']
        password = data['password']

        # ユーザー検索
        user = User.query.filter_by(username=username).first()

        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid username or password'}), 401

        # JWTトークン生成
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """現在のユーザー情報を取得"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify(user.to_dict()), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """ログアウト（クライアント側でトークン削除が必要）"""
    # JWTはステートレスなので、実際のログアウトはクライアント側でトークンを削除することで実現
    return jsonify({'message': 'Logout successful'}), 200
