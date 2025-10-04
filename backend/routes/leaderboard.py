from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db
from models.evaluation import Evaluation
from models.user import User

leaderboard_bp = Blueprint('leaderboard', __name__)

@leaderboard_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """
    リーダーボード（ランキング）を取得

    クエリパラメータ:
    - page: ページ番号（デフォルト: 1）
    - per_page: 1ページあたりの件数（デフォルト: 20）
    - baseline_image_id: ベースライン画像IDでフィルター（オプション）
    - start_date: 開始日時でフィルター（オプション）
    - end_date: 終了日時でフィルター（オプション）
    """
    try:
        # クエリパラメータ
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        baseline_image_id = request.args.get('baseline_image_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        # ユーザーごとの最高得点を取得するサブクエリ
        subquery = db.session.query(
            Evaluation.user_id,
            func.max(Evaluation.total_score).label('max_score')
        ).group_by(Evaluation.user_id).subquery()

        # メインクエリ: 各ユーザーの最高得点の評価を取得
        query = db.session.query(Evaluation).join(
            subquery,
            db.and_(
                Evaluation.user_id == subquery.c.user_id,
                Evaluation.total_score == subquery.c.max_score
            )
        )

        # フィルタリング
        if baseline_image_id:
            query = query.filter(Evaluation.baseline_image_id == baseline_image_id)

        if start_date:
            query = query.filter(Evaluation.evaluated_at >= start_date)

        if end_date:
            query = query.filter(Evaluation.evaluated_at <= end_date)

        # ソートとページネーション
        pagination = query.order_by(Evaluation.total_score.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)

        # レスポンス作成
        leaderboard = []
        for rank, evaluation in enumerate(pagination.items, start=(page - 1) * per_page + 1):
            item = evaluation.to_dict(include_images=True)
            item['rank'] = rank
            leaderboard.append(item)

        return jsonify({
            'leaderboard': leaderboard,
            'total': pagination.total,
            'page': page,
            'per_page': per_page,
            'pages': pagination.pages
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@leaderboard_bp.route('/leaderboard/user/<user_id>', methods=['GET'])
def get_user_ranking(user_id):
    """特定ユーザーの順位と最高得点を取得"""
    try:
        # ユーザーの最高得点を取得
        user_best = db.session.query(
            func.max(Evaluation.total_score).label('max_score')
        ).filter(Evaluation.user_id == user_id).scalar()

        if user_best is None:
            return jsonify({'error': 'User has no evaluations'}), 404

        # 順位を計算（そのスコアより高いスコアの数 + 1）
        rank = db.session.query(func.count(func.distinct(Evaluation.user_id))).filter(
            Evaluation.total_score > user_best
        ).scalar() + 1

        # 最高得点の評価を取得
        best_evaluation = Evaluation.query.filter(
            Evaluation.user_id == user_id,
            Evaluation.total_score == user_best
        ).order_by(Evaluation.evaluated_at.desc()).first()

        return jsonify({
            'rank': rank,
            'evaluation': best_evaluation.to_dict(include_images=True) if best_evaluation else None
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
