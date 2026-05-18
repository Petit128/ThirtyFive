const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/roleAuth');
const { pool } = require('../middleware/roleAuth');

// GET /api/admin/users - Liste tous les utilisateurs
router.get('/users', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar, bio, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/admin/users/:id/role - Changer le rôle d'un utilisateur
router.put('/users/:id/role', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['student', 'professor', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Doit être: student, professor ou admin'
      });
    }

    const result = await pool.query(
      `UPDATE users 
       SET role = $1 
       WHERE id = $2 
       RETURNING id, name, email, role`,
      [role, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    console.log(`✅ Rôle changé pour ${result.rows[0].email}: ${role}`);

    res.json({
      success: true,
      message: `Rôle de ${result.rows[0].name} changé à ${role}`,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur changement rôle:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/lessons - Approuver/Refuser les leçons
router.get('/lessons', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.id, l.title, l.description, l.subject, l.class_level, 
              l.created_at, l.approved, u.name as created_by
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       ORDER BY l.created_at DESC`
    );

    res.json({
      success: true,
      lessons: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération leçons:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/admin/lessons/:id/approve - Approuver une leçon
router.put('/lessons/:id/approve', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    const result = await pool.query(
      `UPDATE lessons 
       SET approved = $1, approved_by = $2, approved_at = NOW()
       WHERE id = $3 
       RETURNING id, title, approved`,
      [approved, req.user.id, parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Leçon non trouvée'
      });
    }

    console.log(`✅ Leçon ${result.rows[0].title}: ${approved ? 'approuvée' : 'rejetée'}`);

    res.json({
      success: true,
      message: `Leçon ${approved ? 'approuvée' : 'rejetée'}`,
      lesson: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur approbation leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/statistics - Statistiques globales
router.get('/statistics', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const usersCount = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = 'professor' THEN 1 ELSE 0 END) as professors,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins
       FROM users`
    );

    const lessonsCount = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN approved = true THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN approved = false THEN 1 ELSE 0 END) as pending
       FROM lessons`
    );

    const quizzesCount = await pool.query(
      `SELECT COUNT(*) as total FROM quizzes`
    );

    const gradesCount = await pool.query(
      `SELECT AVG(score) as average_grade FROM grades`
    );

    res.json({
      success: true,
      statistics: {
        users: usersCount.rows[0],
        lessons: lessonsCount.rows[0],
        quizzes: quizzesCount.rows[0],
        grades: gradesCount.rows[0]
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/admin/reports - Rapports d'utilisation
router.get('/reports', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const activityReport = await pool.query(
      `SELECT DATE(last_login) as date, COUNT(*) as logins
       FROM users
       WHERE last_login IS NOT NULL
       GROUP BY DATE(last_login)
       ORDER BY date DESC
       LIMIT 30`
    );

    const lessonsReport = await pool.query(
      `SELECT l.subject, COUNT(*) as count, AVG(l.rating) as avg_rating
       FROM lessons l
       GROUP BY l.subject
       ORDER BY count DESC`
    );

    res.json({
      success: true,
      reports: {
        activity: activityReport.rows,
        lessons: lessonsReport.rows
      }
    });
  } catch (error) {
    console.error('❌ Erreur génération rapports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    console.log(`✅ Utilisateur ${result.rows[0].name} supprimé`);

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;
