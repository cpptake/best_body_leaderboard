#!/usr/bin/env python3
"""
データベース初期化スクリプト

Usage:
    python init_db.py
"""

from app import create_app
from models import db
from models.user import User
from models.baseline_image import BaselineImage
from models.comparison_image import ComparisonImage
from models.evaluation import Evaluation

def init_database():
    """データベースを初期化"""
    app = create_app()

    with app.app_context():
        # テーブル作成
        db.create_all()
        print("✅ Database tables created successfully!")

        # 管理者アカウントの作成（存在しない場合）
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(username='admin', is_admin=True)
            admin.set_password('admin123')  # 本番環境では変更必須
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created (username: admin, password: admin123)")
        else:
            print("ℹ️  Admin user already exists")

if __name__ == '__main__':
    init_database()
