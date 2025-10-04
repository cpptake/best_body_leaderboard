from models import db, generate_uuid
from datetime import datetime

class ComparisonImage(db.Model):
    __tablename__ = 'comparison_images'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    s3_key = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    evaluations = db.relationship('Evaluation', backref='comparison_image', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """比較画像情報を辞書形式で返す"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'image_url': self.image_url,
            's3_key': self.s3_key,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }

    def __repr__(self):
        return f'<ComparisonImage {self.id} - User: {self.user_id}>'
