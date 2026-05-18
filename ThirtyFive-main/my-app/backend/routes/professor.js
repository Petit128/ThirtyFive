const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { authMiddleware, authorize } = require('../middleware/roleAuth');
const { uploadUniversal, uploadLesson } = require('../middleware/fileUpload');
const { pool } = require('../middleware/roleAuth');

// POST /api/professor/lessons - Créer une leçon
router.post('/lessons', authMiddleware, authorize('professor', 'admin'), uploadLesson.single('htmlFile'), async (req, res) => {
  try {
    const { title, description, subject, class_level, emoji, html_content } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    let htmlContent = '';
    if (req.file) {
      htmlContent = fs.readFileSync(req.file.path, 'utf8');
      console.log(`📄 Fichier lu: ${req.file.originalname}`);
    } else {
      htmlContent = html_content || '<div>Contenu par défaut</div>';
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, subject, class_level, emoji, html_content, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, subject, class_level as class, description, emoji`,
      [
        title,
        description || '',
        subject || 'Général',
        class_level || 'Tous niveaux',
        emoji || '📚',
        htmlContent,
        req.user.id
      ]
    );

    console.log('✅ Leçon créée par professeur:', result.rows[0].id);

    res.status(201).json({
      success: true,
      message: 'Leçon créée avec succès',
      lesson: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur création leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

// POST /api/professor/upload - Upload multi-type de fichiers
router.post('/upload', authMiddleware, authorize('professor', 'admin'), uploadUniversal.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      uploadedAt: new Date()
    };

    // Sauvegarder l'info de fichier en BD
    await pool.query(
      `INSERT INTO files (filename, original_name, mimetype, size, uploaded_by, file_path)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.user.id,
        fileInfo.path
      ]
    );

    console.log(`✅ Fichier uploadé: ${req.file.originalname}`);

    res.json({
      success: true,
      message: 'Fichier uploadé avec succès',
      file: fileInfo
    });
  } catch (error) {
    console.error('❌ Erreur upload fichier:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'upload'
    });
  }
});

// POST /api/professor/quizzes - Créer un quiz
router.post('/quizzes', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { title, description, subject, time_limit, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Titre et questions requis'
      });
    }

    const result = await pool.query(
      `INSERT INTO quizzes (title, description, subject, time_limit, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title`,
      [title, description || '', subject || '', time_limit || 30, req.user.id]
    );

    const quizId = result.rows[0].id;

    // Ajouter les questions
    for (const question of questions) {
      await pool.query(
        `INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          quizId,
          question.text,
          question.type || 'multiple_choice',
          JSON.stringify(question.options),
          question.correctAnswer
        ]
      );
    }

    console.log(`✅ Quiz créé: ${title}`);

    res.status(201).json({
      success: true,
      message: 'Quiz créé avec succès',
      quiz: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur création quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

// GET /api/professor/students - Liste des étudiants
router.get('/students', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, avatar, created_at
       FROM users
       WHERE role = 'student'
       ORDER BY name`
    );

    res.json({
      success: true,
      students: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération étudiants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/professor/students/:id/grades - Notes d'un étudiant
router.get('/students/:id/grades', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT g.id, g.lesson_id, g.quiz_id, g.score, g.max_score, g.created_at,
              l.title as lesson_title, q.title as quiz_title
       FROM grades g
       LEFT JOIN lessons l ON g.lesson_id = l.id
       LEFT JOIN quizzes q ON g.quiz_id = q.id
       WHERE g.student_id = $1
       ORDER BY g.created_at DESC`,
      [parseInt(id)]
    );

    res.json({
      success: true,
      grades: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération notes:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/professor/analytics - Analyse des performances
router.get('/analytics', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const classAnalytics = await pool.query(
      `SELECT AVG(g.score) as avg_score, MAX(g.score) as max_score, 
              MIN(g.score) as min_score, COUNT(g.id) as total_grades
       FROM grades g
       WHERE g.created_by = $1`,
      [req.user.id]
    );

    const studentProgress = await pool.query(
      `SELECT u.id, u.name, AVG(g.score) as avg_grade, COUNT(g.id) as grades_count
       FROM users u
       LEFT JOIN grades g ON u.id = g.student_id
       WHERE u.role = 'student'
       GROUP BY u.id, u.name
       ORDER BY avg_grade DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      analytics: {
        classAnalytics: classAnalytics.rows[0],
        studentProgress: studentProgress.rows
      }
    });
  } catch (error) {
    console.error('❌ Erreur analyse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/professor/quizzes/:id - Modifier un quiz
router.put('/quizzes/:id', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, time_limit } = req.body;

    const result = await pool.query(
      `UPDATE quizzes
       SET title = $1, description = $2, subject = $3, time_limit = $4
       WHERE id = $5 AND created_by = $6
       RETURNING id, title`,
      [title, description, subject, time_limit, parseInt(id), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé ou accès refusé' });
    }

    console.log(`✅ Quiz mis à jour: ${result.rows[0].title}`);

    res.json({
      success: true,
      message: 'Quiz mis à jour',
      quiz: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/professor/quizzes/:id - Supprimer un quiz
router.delete('/quizzes/:id', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM quizzes
       WHERE id = $1 AND created_by = $2
       RETURNING id, title`,
      [parseInt(id), req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé ou accès refusé' });
    }

    console.log(`✅ Quiz supprimé: ${result.rows[0].title}`);

    res.json({
      success: true,
      message: 'Quiz supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Ajouter à backend/routes/professor.js

// PROFESSEUR: Gérer les forums (CRUD)
// Créer une catégorie de forum
router.post('/forum/categories', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { name, description, isPrivate } = req.body;
    
    const result = await pool.query(
      `INSERT INTO forum_categories (name, description, is_private)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, isPrivate || false]
    );
    
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création catégorie:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Modifier une catégorie
router.put('/forum/categories/:id', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate } = req.body;
    
    const result = await pool.query(
      `UPDATE forum_categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_private = COALESCE($3, is_private)
       WHERE id = $4
       RETURNING *`,
      [name, description, isPrivate, id]
    );
    
    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur modification catégorie:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer une catégorie
router.delete('/forum/categories/:id', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM forum_categories WHERE id = $1', [id]);
    
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Épingler un topic
router.put('/forum/topics/:id/pin', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE forum_topics
       SET is_pinned = NOT is_pinned
       WHERE id = $1
       RETURNING is_pinned`,
      [id]
    );
    
    res.json({ success: true, isPinned: result.rows[0]?.is_pinned });
  } catch (error) {
    console.error('❌ Erreur épinglage:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Verrouiller un topic
router.put('/forum/topics/:id/lock', authMiddleware, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE forum_topics
       SET is_locked = NOT is_locked
       WHERE id = $1
       RETURNING is_locked`,
      [id]
    );
    
    res.json({ success: true, isLocked: result.rows[0]?.is_locked });
  } catch (error) {
    console.error('❌ Erreur verrouillage:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
