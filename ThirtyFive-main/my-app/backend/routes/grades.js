const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Grade = require('../models/Grade');

// Obtenir les notes de l'utilisateur connecté
router.get('/my-grades', protect, async (req, res) => {
    try {
        const grades = await Grade.getUserGrades(req.user.id);
        res.json({ success: true, grades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir le bulletin (report card) de l'utilisateur
router.get('/my-report', protect, async (req, res) => {
    try {
        const report = await Grade.getStudentReportCard(req.user.id);
        res.json({ success: true, report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Générer un bulletin
router.post('/generate-report', protect, async (req, res) => {
    try {
        const report = await Grade.generateReportCard(req.user.id);
        res.json({ success: true, report });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Ajouter/modifier une note
router.post('/', protect, authorize('admin'), async (req, res) => {
    try {
        const { userId, lessonId, quizId, grade, maxGrade, weight, comment } = req.body;
        
        const gradeRecord = await Grade.addGrade({
            userId, lessonId, quizId, grade, maxGrade, weight, comment,
            gradedBy: req.user.id
        });
        
        res.status(201).json({ success: true, grade: gradeRecord });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Admin: Obtenir les notes d'une classe
router.get('/class/:className', protect, authorize('admin'), async (req, res) => {
    try {
        const { className } = req.params;
        const { subject } = req.query;
        
        const grades = await Grade.getClassGrades(className, subject);
        res.json({ success: true, grades });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;