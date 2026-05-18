-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    avatar VARCHAR(255) DEFAULT 'default-avatar.png',
    bio TEXT,
    reset_password_token VARCHAR(255),
    reset_password_expire TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_level VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) DEFAULT '📚',
    html_content TEXT NOT NULL,
    css_content TEXT DEFAULT '',
    js_content TEXT DEFAULT '',
    duration INTEGER DEFAULT 15,
    difficulty VARCHAR(50) DEFAULT 'Beginner',
    thumbnail VARCHAR(255) DEFAULT 'default-lesson.png',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    downloads INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    tags TEXT[],
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_difficulty CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'))
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(lesson_id, user_id)
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User lessons (completed lessons)
CREATE TABLE IF NOT EXISTS user_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    is_favorite BOOLEAN DEFAULT false,
    UNIQUE(user_id, lesson_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
CREATE INDEX IF NOT EXISTS idx_lessons_class ON lessons(class_level);
CREATE INDEX IF NOT EXISTS idx_lessons_created_by ON lessons(created_by);
CREATE INDEX IF NOT EXISTS idx_ratings_lesson ON ratings(lesson_id);
CREATE INDEX IF NOT EXISTS idx_comments_lesson ON comments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lessons_user ON user_lessons(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at BEFORE UPDATE ON ratings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update lesson rating
CREATE OR REPLACE FUNCTION update_lesson_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lessons 
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM ratings
        WHERE lesson_id = NEW.lesson_id
    )
    WHERE id = NEW.lesson_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for rating updates
CREATE TRIGGER update_lesson_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_lesson_rating();

-- Insert default admin user (password: admin123)
INSERT INTO users (name, email, password, role)
VALUES (
    'Admin User',
    'admin@school.com',
    '$2a$10$X7VYxH8Y5Q5Q5Q5Q5Q5Q5u5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', -- admin123
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default student user (password: student123)
INSERT INTO users (name, email, password, role)
VALUES (
    'Student User',
    'student@school.com',
    '$2a$10$Y7VYxH8Y5Q5Q5Q5Q5Q5Q5u5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', -- student123
    'user'
) ON CONFLICT (email) DO NOTHING;

-- Insert default teacher user (password: teacher123)
INSERT INTO users (name, email, password, role)
VALUES (
    'Teacher User',
    'teacher@school.com',
    '$2a$10$Z7VYxH8Y5Q5Q5Q5Q5Q5Q5u5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5Q5', -- teacher123
    'user'
) ON CONFLICT (email) DO NOTHING;