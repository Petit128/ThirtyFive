// backend/models/Quiz.js
const { query, transaction } = require('../config/database');

class Quiz {
  // Get all quizzes
  static async getQuizzes(filters = {}, userId = null) {
    let queryText = `
      SELECT q.*, u.name as creator_name,
             COUNT(qa.id) as attempts_count
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.user_id = $1
      WHERE q.is_published = true
    `;
    
    const values = [userId];
    let paramIndex = 2;

    if (filters.lessonId) {
      queryText += ` AND q.lesson_id = $${paramIndex}`;
      values.push(filters.lessonId);
      paramIndex++;
    }

    queryText += ` GROUP BY q.id, u.name ORDER BY q.created_at DESC`;

    const result = await query(queryText, values);
    return result.rows;
  }

  // Get single quiz with questions
  static async getQuiz(quizId, userId = null) {
    const quizResult = await query(
      `SELECT q.*, u.name as creator_name
       FROM quizzes q
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = $1 AND q.is_published = true`,
      [quizId]
    );

    if (quizResult.rows.length === 0) return null;

    const questionsResult = await query(
      `SELECT id, question_text, question_type, options, points, order_index
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY order_index ASC`,
      [quizId]
    );

    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows.map(q => ({
      ...q,
      options: q.options || []
    }));

    if (userId) {
      const attemptResult = await query(
        `SELECT id, score, answers, completed_at
         FROM quiz_attempts
         WHERE quiz_id = $1 AND user_id = $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [quizId, userId]
      );
      quiz.lastAttempt = attemptResult.rows[0] || null;
    }

    return quiz;
  }

  // Create quiz
  static async create(quizData) {
    const { title, description, lessonId, createdBy, timeLimit, passingScore, attemptsAllowed } = quizData;
    
    const result = await query(
      `INSERT INTO quizzes (title, description, lesson_id, created_by, time_limit, passing_score, attempts_allowed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, lessonId, createdBy, timeLimit, passingScore || 60, attemptsAllowed || 3]
    );

    return result.rows[0];
  }

  // Add question to quiz
  static async addQuestion(quizId, question) {
    const { text, type, options, correctAnswer, points, orderIndex } = question;
    
    const result = await query(
      `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [quizId, text, type || 'multiple_choice', JSON.stringify(options || []), correctAnswer, points || 1, orderIndex || 0]
    );

    return result.rows[0];
  }

  // Submit quiz attempt
  static async submitAttempt(quizId, userId, answers) {
    const quiz = await this.getQuiz(quizId);
    if (!quiz) throw new Error('Quiz not found');

    // Check attempts limit
    const attemptsCount = await query(
      'SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2',
      [quizId, userId]
    );
    
    if (parseInt(attemptsCount.rows[0].count) >= quiz.attempts_allowed) {
      throw new Error('Maximum attempts reached');
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    
    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers[question.id];
      
      if (userAnswer && userAnswer.toLowerCase() === question.correct_answer?.toLowerCase()) {
        earnedPoints += question.points;
      }
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= quiz.passing_score;

    const result = await query(
      `INSERT INTO quiz_attempts (quiz_id, user_id, score, answers, completed_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING *`,
      [quizId, userId, score, JSON.stringify(answers)]
    );

    return {
      attempt: result.rows[0],
      score,
      passed,
      totalPoints,
      earnedPoints
    };
  }

  // Get user's grade for quiz
  static async getGrade(userId, quizId) {
    const result = await query(
      `SELECT score, completed_at
       FROM quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2 AND score IS NOT NULL
       ORDER BY completed_at DESC
       LIMIT 1`,
      [userId, quizId]
    );
    return result.rows[0];
  }

  // Update quiz
  static async updateQuiz(quizId, updates) {
    const allowedUpdates = ['title', 'description', 'time_limit', 'passing_score', 'is_published', 'attempts_allowed'];
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

    values.push(quizId);
    const result = await query(
      `UPDATE quizzes 
       SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0];
  }

  // Delete quiz
  static async deleteQuiz(quizId) {
    await query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    await query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [quizId]);
    const result = await query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [quizId]);
    return result.rows[0];
  }
}

module.exports = Quiz;