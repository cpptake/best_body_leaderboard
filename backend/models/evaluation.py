from models import db, generate_uuid
from datetime import datetime

class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False, index=True)
    baseline_image_id = db.Column(db.String(36), db.ForeignKey('baseline_images.id'), nullable=False)
    comparison_image_id = db.Column(db.String(36), db.ForeignKey('comparison_images.id'), nullable=False)
    shoulder_score = db.Column(db.Integer, nullable=False)
    chest_score = db.Column(db.Integer, nullable=False)
    arm_score = db.Column(db.Integer, nullable=False)
    back_score = db.Column(db.Integer, nullable=False)
    abs_score = db.Column(db.Integer, nullable=False)
    total_score = db.Column(db.Integer, nullable=False, index=True)
    evaluation_comment = db.Column(db.Text)
    evaluated_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # Composite index for leaderboard queries
    __table_args__ = (
        db.Index('idx_evaluations_user_total_score', 'user_id', 'total_score'),
    )

    def to_dict(self, include_images=False):
        """評価情報を辞書形式で返す"""
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'baseline_image_id': self.baseline_image_id,
            'comparison_image_id': self.comparison_image_id,
            'scores': {
                'shoulder': self.shoulder_score,
                'chest': self.chest_score,
                'arm': self.arm_score,
                'back': self.back_score,
                'abs': self.abs_score,
                'total': self.total_score
            },
            'evaluation_comment': self.evaluation_comment,
            'evaluated_at': self.evaluated_at.isoformat() if self.evaluated_at else None
        }

        # Include image data if requested
        if include_images:
            result['baseline_image'] = self.baseline_image.to_dict() if self.baseline_image else None
            result['comparison_image'] = self.comparison_image.to_dict() if self.comparison_image else None
            result['user'] = self.user.to_dict() if self.user else None

        return result

    def __repr__(self):
        return f'<Evaluation {self.id} - Total Score: {self.total_score}>'
