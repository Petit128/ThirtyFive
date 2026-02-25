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

module.exports = router;