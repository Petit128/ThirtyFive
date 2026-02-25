const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');

class User {
  // Create new user
  static async create(userData) {
    const { name, email, password, role = 'user', avatar = 'default-avatar.png', bio = '' } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await query(
      `INSERT INTO users (name, email, password, role, avatar, bio)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, avatar, bio, created_at`,
      [name, email, hashedPassword, role, avatar, bio]
    );
    
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await query(
      `SELECT id, name, email, role, avatar, bio, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find user by ID with password (for authentication)
  static async findByIdWithPassword(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  // Update user
  static async update(id, updates) {
    const allowedUpdates = ['name', 'bio', 'avatar'];
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        setClause.push(`${key} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (setClause.length === 0) return null;

    values.push(id);
    const result = await query(
      `UPDATE users 
       SET ${setClause.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, name, email, role, avatar, bio`,
      values
    );

    return result.rows[0];
  }

  // Update last login
  static async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  // Compare password
  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  // Get user's completed lessons
  static async getCompletedLessons(userId) {
    const result = await query(
      `SELECT l.*, ul.completed_at, ul.score
       FROM lessons l
       JOIN user_lessons ul ON l.id = ul.lesson_id
       WHERE ul.user_id = $1 AND ul.completed_at IS NOT NULL
       ORDER BY ul.completed_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  // Get user's favorite lessons
  static async getFavorites(userId) {
    const result = await query(
      `SELECT l.*
       FROM lessons l
       JOIN user_lessons ul ON l.id = ul.lesson_id
       WHERE ul.user_id = $1 AND ul.is_favorite = true
       ORDER BY l.title`,
      [userId]
    );
    
    return result.rows;
  }

  // Add lesson to favorites
  static async toggleFavorite(userId, lessonId) {
    const result = await query(
      `INSERT INTO user_lessons (user_id, lesson_id, is_favorite)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET is_favorite = NOT user_lessons.is_favorite
       RETURNING is_favorite`,
      [userId, lessonId]
    );
    
    return result.rows[0].is_favorite;
  }

  // Mark lesson as completed
  static async completeLesson(userId, lessonId, score = null) {
    const result = await query(
      `INSERT INTO user_lessons (user_id, lesson_id, completed_at, score)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       ON CONFLICT (user_id, lesson_id) 
       DO UPDATE SET completed_at = CURRENT_TIMESTAMP, score = $3
       RETURNING *`,
      [userId, lessonId, score]
    );
    
    return result.rows[0];
  }

  // Get all users (admin only)
  static async getAllUsers(limit = 50, offset = 0) {
    const result = await query(
      `SELECT id, name, email, role, avatar, bio, created_at, last_login
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    return result.rows;
  }

  // Delete user (admin only)
  static async delete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );
    
    return result.rows[0];
  }
}

module.exports = User;