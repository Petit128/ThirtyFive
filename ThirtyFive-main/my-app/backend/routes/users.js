const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserLesson = require('../models/UserLesson');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get user statistics
    const [completedLessons, favorites, stats] = await Promise.all([
      UserLesson.getCompletedLessons(req.user.id),
      UserLesson.getFavoriteLessons(req.user.id),
      UserLesson.getUserStats(req.user.id)
    ]);

    res.json({
      success: true,
      user: {
        ...user,
        completedLessons,
        favorites,
        stats
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    
    const user = await User.update(req.user.id, { name, bio, avatar });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users/progress
// @desc    Get user learning progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    const [completedLessons, favorites, stats] = await Promise.all([
      UserLesson.getCompletedLessons(req.user.id),
      UserLesson.getFavoriteLessons(req.user.id),
      UserLesson.getUserStats(req.user.id)
    ]);

    res.json({
      success: true,
      completedLessons,
      favorites,
      stats
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const offset = req.query.offset || 0;
    
    const users = await User.getAllUsers(limit, offset);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    await User.delete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


// Dans routes/users.js
// Admin: Mettre à jour les permissions d'un utilisateur
router.put('/:id/permissions', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { permissions, role, school, className } = req.body;
        
        const updates = [];
        const values = [];
        
        if (permissions !== undefined) {
            updates.push(`permissions = $${updates.length + 1}`);
            values.push(JSON.stringify(permissions));
        }
        if (role !== undefined) {
            updates.push(`role = $${updates.length + 1}`);
            values.push(role);
        }
        if (school !== undefined) {
            updates.push(`school = $${updates.length + 1}`);
            values.push(school);
        }
        if (className !== undefined) {
            updates.push(`class_name = $${updates.length + 1}`);
            values.push(className);
        }
        
        values.push(id);
        
        const result = await pool.query(`
            UPDATE users 
            SET ${updates.join(', ')}
            WHERE id = $${values.length}
            RETURNING id, name, email, role, school, class_name, permissions
        `, values);
        
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Obtenir les statistiques de la plateforme
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
                (SELECT COUNT(*) FROM lessons) as total_lessons,
                (SELECT COUNT(*) FROM forum_topics) as forum_topics,
                (SELECT COUNT(*) FROM forum_posts) as forum_posts,
                (SELECT COUNT(*) FROM quizzes) as total_quizzes,
                (SELECT COUNT(*) FROM quiz_attempts) as quiz_attempts,
                (SELECT COUNT(*) FROM grades) as total_grades
        `);
        
        res.json({ success: true, stats: stats.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;