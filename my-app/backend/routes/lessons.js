const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Lesson = require('../models/Lesson');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /html|htm|css|js|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only HTML, CSS, and JS files are allowed'));
    }
  }
});

// @route   GET /api/lessons
// @desc    Get all lessons
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      subject, 
      class: className, 
      difficulty,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    const query = { isPublished: true };
    
    if (subject) query.subject = subject;
    if (className) query.class = className;
    if (difficulty) query.difficulty = difficulty;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const lessons = await Lesson.find(query)
      .populate('createdBy', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Lesson.countDocuments(query);

    res.json({
      success: true,
      count: lessons.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      lessons
    });
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/lessons/:id
// @desc    Get single lesson
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('ratings.user', 'name avatar')
      .populate('comments.user', 'name avatar');

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    // Increment view count
    await lesson.incrementViews();

    res.json({
      success: true,
      lesson
    });
  } catch (error) {
    console.error('Get lesson error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/lessons
// @desc    Create a lesson
// @access  Private (Admin only)
router.post('/', 
  protect, 
  authorize('admin'),
  upload.single('htmlFile'),
  [
    body('title').notEmpty().withMessage('Title is required').isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
    body('description').notEmpty().withMessage('Description is required').isLength({ max: 500 }).withMessage('Description too long'),
    body('subject').isIn(['Math', 'Physics', 'Science', 'Chemistry', 'Biology', 'English', 'History', 'Geography']).withMessage('Invalid subject'),
    body('class').isIn(['Primary', 'Middle School', 'High School', 'College']).withMessage('Invalid class level'),
    body('difficulty').optional().isIn(['Beginner', 'Intermediate', 'Advanced']).withMessage('Invalid difficulty level'),
    body('html').optional()
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          errors: errors.array() 
        });
      }

      const lessonData = {
        ...req.body,
        createdBy: req.user.id
      };

      // If file was uploaded, use its content
      if (req.file) {
        const fs = require('fs');
        lessonData.html = fs.readFileSync(req.file.path, 'utf8');
      }

      const lesson = new Lesson(lessonData);
      await lesson.save();

      res.status(201).json({
        success: true,
        message: 'Lesson created successfully',
        lesson
      });
    } catch (error) {
      console.error('Create lesson error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  }
);

// @route   PUT /api/lessons/:id
// @desc    Update a lesson
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      lesson
    });
  } catch (error) {
    console.error('Update lesson error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/lessons/:id
// @desc    Delete a lesson
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    await lesson.deleteOne();

    res.json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Delete lesson error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/lessons/:id/rate
// @desc    Rate a lesson
// @access  Private
router.post('/:id/rate', protect, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('review').optional().isLength({ max: 200 }).withMessage('Review too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    // Check if user already rated
    const existingRating = lesson.ratings.find(
      r => r.user.toString() === req.user.id
    );

    if (existingRating) {
      // Update existing rating
      existingRating.rating = req.body.rating;
      if (req.body.review) existingRating.review = req.body.review;
      existingRating.createdAt = Date.now();
    } else {
      // Add new rating
      lesson.ratings.push({
        user: req.user.id,
        rating: req.body.rating,
        review: req.body.review
      });
    }

    // Recalculate average rating
    lesson.calculateRating();
    await lesson.save();

    res.json({
      success: true,
      message: 'Rating added successfully',
      rating: lesson.rating
    });
  } catch (error) {
    console.error('Rate lesson error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/lessons/:id/comment
// @desc    Add comment to lesson
// @access  Private
router.post('/:id/comment', protect, [
  body('text').notEmpty().withMessage('Comment text is required').isLength({ max: 200 }).withMessage('Comment too long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    lesson.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await lesson.save();

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: lesson.comments[lesson.comments.length - 1]
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/lessons/:id/download
// @desc    Increment download count
// @access  Private
router.post('/:id/download', protect, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        message: 'Lesson not found' 
      });
    }

    lesson.downloads += 1;
    await lesson.save();

    res.json({
      success: true,
      downloads: lesson.downloads
    });
  } catch (error) {
    console.error('Download increment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;