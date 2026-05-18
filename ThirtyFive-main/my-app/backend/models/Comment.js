const { query } = require('../config/database');

class Comment {
  // Create comment
  static async create(lessonId, userId, content) {
    const result = await query(
      `INSERT INTO comments (lesson_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [lessonId, userId, content]
    );

    return result.rows[0];
  }

  // Get comments for a lesson
  static async findByLesson(lessonId, limit = 50, offset = 0) {
    const result = await query(
      `SELECT c.*, u.name, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.lesson_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [lessonId, limit, offset]
    );

    return result.rows;
  }

  // Update comment
  static async update(id, userId, content) {
    const result = await query(
      `UPDATE comments 
       SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [content, id, userId]
    );

    return result.rows[0];
  }

  // Delete comment
  static async delete(id, userId) {
    const result = await query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    return result.rows[0];
  }

  // Get comment by ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM comments WHERE id = $1',
      [id]
    );

    return result.rows[0];
  }
}

module.exports = Comment;