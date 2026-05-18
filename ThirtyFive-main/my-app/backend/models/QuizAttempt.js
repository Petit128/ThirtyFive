// backend/models/QuizAttempt.js
const { query } = require('../config/database');

class QuizAttempt {
  static async getUserAttempts(userId, quizId = null) {
    let queryText = `
      SELECT qa.*, q.title as quiz_title, q.passing_score
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.user_id = $1
    `;
    const values = [userId];

    if (quizId) {
      queryText += ` AND qa.quiz_id = $2`;
      values.push(quizId);
    }

    queryText += ` ORDER BY qa.created_at DESC`;

    const result = await query(queryText, values);
    return result.rows;
  }

  static async getBestScore(userId, quizId) {
    const result = await query(
      `SELECT MAX(score) as best_score
       FROM quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2 AND score IS NOT NULL`,
      [userId, quizId]
    );
    return result.rows[0]?.best_score || 0;
  }
}

module.exports = QuizAttempt;