const { query } = require('../config/database');

class UserLesson {
  // Check if user has completed lesson
  static async isCompleted(userId, lessonId) {
    const result = await query(
      'SELECT completed_at FROM user_lessons WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    return result.rows[0]?.completed_at || null;
  }

  // Check if lesson is favorited
  static async isFavorite(userId, lessonId) {
    const result = await query(
      'SELECT is_favorite FROM user_lessons WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    return result.rows[0]?.is_favorite || false;
  }

  // Get user progress on a lesson
  static async getUserProgress(userId, lessonId) {
    const result = await query(
      'SELECT * FROM user_lessons WHERE user_id = $1 AND lesson_id = $2',
      [userId, lessonId]
    );

    return result.rows[0];
  }

  // Get all completed lessons for user
  static async getCompletedLessons(userId) {
    const result = await query(
      `SELECT l.*, ul.completed_at, ul.score
       FROM user_lessons ul
       JOIN lessons l ON ul.lesson_id = l.id
       WHERE ul.user_id = $1 AND ul.completed_at IS NOT NULL
       ORDER BY ul.completed_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // Get all favorite lessons for user
  static async getFavoriteLessons(userId) {
    const result = await query(
      `SELECT l.*
       FROM user_lessons ul
       JOIN lessons l ON ul.lesson_id = l.id
       WHERE ul.user_id = $1 AND ul.is_favorite = true
       ORDER BY l.title`,
      [userId]
    );

    return result.rows;
  }

  // Get statistics for user
  static async getUserStats(userId) {
    const result = await query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN ul.completed_at IS NOT NULL THEN ul.lesson_id END) as completed_count,
         COUNT(DISTINCT CASE WHEN ul.is_favorite THEN ul.lesson_id END) as favorites_count,
         COALESCE(AVG(ul.score), 0) as average_score,
         SUM(l.duration) as total_minutes
       FROM user_lessons ul
       JOIN lessons l ON ul.lesson_id = l.id
       WHERE ul.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }
}

module.exports = UserLesson;