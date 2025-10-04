from flask import jsonify
from werkzeug.exceptions import HTTPException
from sqlalchemy.exc import SQLAlchemyError

def register_error_handlers(app):
    """エラーハンドラーを登録"""

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized', 'message': 'Authentication required'}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden', 'message': 'Insufficient permissions'}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error', 'message': str(error)}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({'error': error.name, 'message': error.description}), error.code

    @app.errorhandler(SQLAlchemyError)
    def handle_db_exception(error):
        return jsonify({'error': 'Database error', 'message': str(error)}), 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        return jsonify({'error': 'Unexpected error', 'message': str(error)}), 500
