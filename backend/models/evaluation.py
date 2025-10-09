from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Evaluation(db.Model):
    __tablename__ = 'evaluations'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), nullable=False, index=True)
    shoulder_score = db.Column(db.Integer, nullable=False)
    chest_score = db.Column(db.Integer, nullable=False)
    arm_score = db.Column(db.Integer, nullable=False)
    back_score = db.Column(db.Integer, nullable=False)
    abs_score = db.Column(db.Integer, nullable=False)
    total_score = db.Column(db.Integer, nullable=False, index=True)
    shoulder_comment = db.Column(db.Text)
    chest_comment = db.Column(db.Text)
    arm_comment = db.Column(db.Text)
    back_comment = db.Column(db.Text)
    abs_comment = db.Column(db.Text)
    evaluated_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'shoulder_score': self.shoulder_score,
            'chest_score': self.chest_score,
            'arm_score': self.arm_score,
            'back_score': self.back_score,
            'abs_score': self.abs_score,
            'total_score': self.total_score,
            'comments': {
                'shoulder': self.shoulder_comment,
                'chest': self.chest_comment,
                'arm': self.arm_comment,
                'back': self.back_comment,
                'abs': self.abs_comment
            },
            'evaluated_at': self.evaluated_at.isoformat()
        }
