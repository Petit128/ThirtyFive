const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Forum = require('../models/Forum');

// Obtenir toutes les catégories
router.get('/categories', protect, async (req, res) => {
    try {
        const categories = await Forum.getCategories();
        res.json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir les topics d'une catégorie
router.get('/categories/:id/topics', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const topics = await Forum.getTopics(id, parseInt(page), parseInt(limit));
        res.json({ success: true, ...topics });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir un topic avec ses posts
router.get('/topics/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        
        const topic = await Forum.getTopic(id);
        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }
        
        const posts = await Forum.getPosts(id, parseInt(page), parseInt(limit));
        
        res.json({ success: true, topic, posts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Créer un nouveau topic
router.post('/topics', protect, async (req, res) => {
    try {
        const { categoryId, title, content } = req.body;
        
        if (!categoryId || !title || !content) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const result = await Forum.createTopic(categoryId, req.user.id, title, content);
        res.status(201).json({ success: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Ajouter un post à un topic
router.post('/topics/:id/posts', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }
        
        const topic = await Forum.getTopic(id);
        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }
        
        if (topic.is_locked && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Topic is locked' });
        }
        
        const post = await Forum.createPost(id, req.user.id, content);
        res.status(201).json({ success: true, post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: épingler un topic
router.put('/topics/:id/pin', protect, authorize('admin'), async (req, res) => {
    try {
        const isPinned = await Forum.togglePin(req.params.id);
        res.json({ success: true, isPinned });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: verrouiller un topic
router.put('/topics/:id/lock', protect, authorize('admin'), async (req, res) => {
    try {
        const isLocked = await Forum.toggleLock(req.params.id);
        res.json({ success: true, isLocked });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Modifier un post
router.put('/posts/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const post = await ForumPost.update(id, req.user.id, content);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }
    
    res.json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Supprimer un post
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const result = await ForumPost.delete(req.params.id, req.user.id, isAdmin);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Post not found or unauthorized' });
    }
    
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Liker un post
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const likes = await ForumPost.like(req.params.id, req.user.id);
    res.json({ success: true, likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Marquer comme réponse
router.post('/posts/:id/answer', protect, authorize('admin'), async (req, res) => {
  try {
    const post = await ForumPost.markAsAnswer(req.params.id, req.body.topicId);
    res.json({ success: true, post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;