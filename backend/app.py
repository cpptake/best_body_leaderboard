import os
from flask import Flask
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config import config
from models import db

# Import models for migration
from models.user import User
from models.baseline_image import BaselineImage
from models.comparison_image import ComparisonImage
from models.evaluation import Evaluation

migrate = Migrate()
jwt = JWTManager()

def create_app(config_name=None):
    """Flaskアプリケーションのファクトリー関数"""

    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Register error handlers
    from middleware.error_handler import register_error_handlers
    register_error_handlers(app)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.evaluate import evaluate_bp
    from routes.leaderboard import leaderboard_bp
    from routes.baseline_images import baseline_images_bp
    from routes.users import users_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(evaluate_bp, url_prefix='/api')
    app.register_blueprint(leaderboard_bp, url_prefix='/api')
    app.register_blueprint(baseline_images_bp, url_prefix='/api/baseline-images')
    app.register_blueprint(users_bp, url_prefix='/api/users')

    # Health check endpoint
    @app.route('/health')
    def health_check():
        return {'status': 'healthy'}, 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
