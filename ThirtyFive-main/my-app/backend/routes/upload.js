const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const UploadedFile = require('../models/uploadedFile');

// Configuration multer pour les fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/files');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        // Accepter tous les types de fichiers
        cb(null, true);
    }
});

// Upload de fichier
router.post('/', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        const { lessonId, isPublic } = req.body;
        
        const fileRecord = await UploadedFile.save({
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            userId: req.user.id,
            lessonId: lessonId ? parseInt(lessonId) : null,
            isPublic: isPublic === 'true'
        });
        
        res.json({
            success: true,
            file: {
                ...fileRecord,
                downloadUrl: `/api/upload/download/${fileRecord.id}`
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Télécharger un fichier
router.get('/download/:id', protect, async (req, res) => {
    try {
        const file = await UploadedFile.getFile(req.params.id);
        
        if (!file) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        // Vérifier les permissions
        if (!file.is_public && file.user_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        
        res.download(file.file_path, file.original_name);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Obtenir les fichiers d'une leçon
router.get('/lesson/:lessonId', protect, async (req, res) => {
    try {
        const files = await UploadedFile.getFiles(req.params.lessonId);
        res.json({ success: true, files });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Supprimer un fichier
router.delete('/:id', protect, async (req, res) => {
    try {
        const isAdmin = req.user.role === 'admin';
        const result = await UploadedFile.deleteFile(req.params.id, req.user.id, isAdmin);
        
        if (!result) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }
        
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error(error);
        res.status(403).json({ success: false, message: error.message });
    }
});

module.exports = router;