const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const Grade = require('../models/Grade');

// Obtenir tous les quizzes
router.get('/', protect, async (req, res) => {
    try {
        const { lessonId } = req.query;
        const quizzes = await Quiz.getQuizzes({ lessonId, isPublished: true }, req.user.id);
        res.json({ success: true, quizzes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir un quiz spécifique
router.get('/:id', protect, async (req, res) => {
    try {
        const quiz = await Quiz.getQuiz(req.params.id, req.user.id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        
        // Ne pas inclure les réponses correctes pour les étudiants
        if (req.user.role !== 'admin' && quiz.questions) {
            quiz.questions = quiz.questions.map(q => ({
                ...q,
                correct_answer: undefined
            }));
        }
        
        const grade = await Quiz.getGrade(req.user.id, req.params.id);
        
        res.json({ success: true, quiz, grade });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Créer un quiz (admin/teacher)
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { title, description, lessonId, timeLimit, passingScore, attemptsAllowed, questions } = req.body;
        
        const quiz = await Quiz.create({
            title, description, lessonId, createdBy: req.user.id,
            timeLimit, passingScore, attemptsAllowed
        });
        
        for (const question of (questions || [])) {
            await Quiz.addQuestion(quiz.id, question);
        }
        
        res.status(201).json({ success: true, quiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Mettre à jour un quiz
router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const quiz = await Quiz.updateQuiz(req.params.id, req.body);
        res.json({ success: true, quiz });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Supprimer un quiz
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        await Quiz.deleteQuiz(req.params.id);
        res.json({ success: true, message: 'Quiz deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Soumettre une tentative
router.post('/:id/attempt', protect, async (req, res) => {
    try {
        const { answers } = req.body;
        const result = await Quiz.submitAttempt(req.params.id, req.user.id, answers);
        
        // Enregistrer automatiquement la note
        if (result.passed && result.score) {
            await Grade.addGrade({
                userId: req.user.id,
                quizId: parseInt(req.params.id),
                grade: result.score,
                comment: 'Quiz completed automatically',
                gradedBy: null
            });
        }
        
        res.json({ success: true, ...result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

module.exports = router;