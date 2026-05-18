const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration pour l'upload de tous types de fichiers
const universalStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, name + '-' + uniqueSuffix + ext);
  }
});

// Multer sans restriction de type
const uploadUniversal = multer({
  storage: universalStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2GB max
    fieldSize: 2 * 1024 * 1024 * 1024
  }
});

// Configuration pour HTML (leçons)
const lessonStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/lessons');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lesson-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadLesson = multer({
  storage: lessonStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /html|htm|txt/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = /text|html/;
    const mimeType = mime.test(file.mimetype);

    if (ext || mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers HTML/TXT sont acceptés'));
    }
  }
});

// Configuration pour les images
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'));
    }
  }
});

// Configuration pour vidéos
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 1024 * 1024 * 1024 }, // 1GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm|flv|wmv/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = /video/;
    const mimeType = mime.test(file.mimetype);

    if (ext || mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Seules les vidéos sont acceptées'));
    }
  }
});

// Configuration pour documents (PDF, Excel, Word)
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowedExt = /pdf|docx?|xlsx?|pptx?|txt/;
    const ext = allowedExt.test(path.extname(file.originalname).toLowerCase());
    const allowedMime = /pdf|word|sheet|presentation|text|msword/;
    const mime = allowedMime.test(file.mimetype);

    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error('Type de document non supporté'));
    }
  }
});

// Configuration pour ZIP
const archiveStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/archives');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'archive-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadArchive = multer({
  storage: archiveStorage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 }, // 2GB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /zip|rar|7z|tar|gz/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = /zip|compressed|archive/;
    const mimeType = mime.test(file.mimetype);

    if (ext || mimeType) {
      cb(null, true);
    } else {
      cb(new Error('Seules les archives sont acceptées'));
    }
  }
});

module.exports = {
  uploadUniversal,
  uploadLesson,
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadArchive
};
