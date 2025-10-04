from models import db, generate_uuid
from datetime import datetime

class BaselineImage(db.Model):
    __tablename__ = 'baseline_images'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    image_url = db.Column(db.String(500), nullable=False)
    s3_key = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    evaluations = db.relationship('Evaluation', backref='baseline_image', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        """ベースライン画像情報を辞書形式で返す"""
        return {
            'id': self.id,
            'image_url': self.image_url,
            's3_key': self.s3_key,
            'description': self.description,
            'is_active': self.is_active,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<BaselineImage {self.id} - Active: {self.is_active}>'
