// backend/routes/student.js (à créer)
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { pool } = require('../config/database');
const Quiz = require('../models/Quiz');
const Forum = require('../models/Forum');

// Voir les leçons disponibles
router.get('/lessons', protect, authorize('student', 'user'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM lessons WHERE is_published = true ORDER BY created_at DESC`
    );
    res.json({ success: true, lessons: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

// Voir ses notes
router.get('/my-grades', protect, authorize('student', 'user'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, l.title as lesson_title, q.title as quiz_title,
             CASE 
               WHEN g.grade >= (q.passing_score || 0) THEN 'Passed'
               ELSE 'Failed'
             END as status
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN quizzes q ON g.quiz_id = q.id
      WHERE g.user_id = $1
      ORDER BY g.graded_at DESC
    `, [req.user.id]);
    
    const stats = await pool.query(`
      SELECT 
        AVG(g.grade) as average,
        COUNT(CASE WHEN g.grade >= 60 THEN 1 END) as passed,
        COUNT(*) as total
      FROM grades g
      WHERE g.user_id = $1
    `, [req.user.id]);
    
    res.json({ success: true, grades: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

// Passer un quiz
router.get('/quizzes', protect, authorize('student', 'user'), async (req, res) => {
  try {
    const quizzes = await Quiz.getAllQuizzes();
    res.json({ success: true, quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur' });
  }
});

router.post('/quizzes/:id/attempt', protect, authorize('student', 'user'), async (req, res) => {
  try {
    const { answers } = req.body;
    const result = await Quiz.submitAttempt(req.params.id, req.user.id, answers);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Créer un topic sur le forum
router.post('/forum/topics', protect, authorize('student', 'user', 'professor', 'admin'), async (req, res) => {
  try {
    const { categoryId, title, content } = req.body;
    const result = await Forum.createTopic(categoryId, req.user.id, title, content);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur création topic' });
  }
});

router.post('/forum/topics/:id/posts', protect, authorize('student', 'user', 'professor', 'admin'), async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Forum.createPost(req.params.id, req.user.id, content);
    res.status(201).json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur création post' });
  }
});

module.exports = router;