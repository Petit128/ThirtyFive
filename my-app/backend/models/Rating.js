const { query } = require('../config/database');

class Rating {
  // Add or update rating
  static async upsert(lessonId, userId, rating, review = null) {
    const result = await query(
      `INSERT INTO ratings (lesson_id, user_id, rating, review)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lesson_id, user_id) 
       DO UPDATE SET rating = $3, review = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [lessonId, userId, rating, review]
    );

    return result.rows[0];
  }

  // Get rating by user and lesson
  static async findByUserAndLesson(userId, lessonId) {
    const result = await query(
      'SELECT * FROM ratings WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    return result.rows[0];
  }

  // Get all ratings for a lesson
  static async findByLesson(lessonId) {
    const result = await query(
      `SELECT r.*, u.name, u.avatar
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.lesson_id = $1
       ORDER BY r.created_at DESC`,
      [lessonId]
    );

    return result.rows;
  }

  // Delete rating
  static async delete(lessonId, userId) {
    const result = await query(
      'DELETE FROM ratings WHERE lesson_id = $1 AND user_id = $2 RETURNING id',
      [lessonId, userId]
    );

    return result.rows[0];
  }

  // Get average rating for lesson
  static async getAverageForLesson(lessonId) {
    const result = await query(
      'SELECT COALESCE(AVG(rating), 0) as average FROM ratings WHERE lesson_id = $1',
      [lessonId]
    );

    return parseFloat(result.rows[0].average);
  }
}

module.exports = Rating;