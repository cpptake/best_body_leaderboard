-- ボディビルダー肉体評価アプリケーション - データベーススキーマ

-- Extension for UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Baseline images table
CREATE TABLE baseline_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url VARCHAR(500) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Comparison images table
CREATE TABLE comparison_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Evaluations table
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    baseline_image_id UUID NOT NULL,
    comparison_image_id UUID NOT NULL,
    shoulder_score INTEGER NOT NULL CHECK (shoulder_score BETWEEN -10 AND 10),
    chest_score INTEGER NOT NULL CHECK (chest_score BETWEEN -10 AND 10),
    arm_score INTEGER NOT NULL CHECK (arm_score BETWEEN -10 AND 10),
    back_score INTEGER NOT NULL CHECK (back_score BETWEEN -10 AND 10),
    abs_score INTEGER NOT NULL CHECK (abs_score BETWEEN -10 AND 10),
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN -50 AND 50),
    evaluation_comment TEXT,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (baseline_image_id) REFERENCES baseline_images(id) ON DELETE CASCADE,
    FOREIGN KEY (comparison_image_id) REFERENCES comparison_images(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX idx_evaluations_total_score ON evaluations(total_score DESC);
CREATE INDEX idx_evaluations_evaluated_at ON evaluations(evaluated_at DESC);
CREATE INDEX idx_evaluations_user_total_score ON evaluations(user_id, total_score DESC);
CREATE INDEX idx_baseline_images_is_active ON baseline_images(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_baseline_images_updated_at BEFORE UPDATE ON baseline_images
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
