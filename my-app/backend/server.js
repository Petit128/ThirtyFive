const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// ==================== MIDDLEWARE AVEC LIMITE AUGMENTÉE ====================
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir les fichiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger
app.use((req, res, next) => {
  console.log(`\n ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length) {
    console.log(' Body:', req.body);
  }
  next();
});

// ==================== CONNEXION POSTGRESQL ====================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'edulearn',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'petit',
});

pool.connect((err) => {
  if (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  } else {
    console.log('✅ PostgreSQL connected');
  }
});

// ==================== CONFIGURATION UPLOAD ====================
// Configuration pour l'upload de fichiers HTML (leçons)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'lesson-' + uniqueSuffix + '.html');
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 1024 * 1024 * 1024, // 1GB max
    fieldSize: 1024 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/html' || 
        file.originalname.endsWith('.html') || 
        file.originalname.endsWith('.htm')) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers HTML sont acceptés'));
    }
  }
});

// ==================== CONFIGURATION UPLOAD IMAGES ====================
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads/avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const uploadImage = multer({ 
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// ==================== ROUTES D'AUTH ====================

// REGISTER
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log(' Tentative inscription:', req.body.email);
    
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    const existingUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword, 'user']
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre-secret-jwt',
      { expiresIn: '7d' }
    );

    console.log(' Inscription réussie:', email);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user
    });

  } catch (error) {
    console.error(' Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log(' Tentative connexion:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      console.log('❌ Utilisateur non trouvé:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre-secret-jwt',
      { expiresIn: '7d' }
    );

    delete user.password;

    console.log('✅ Connexion réussie:', email);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET CURRENT USER
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    const result = await pool.query(
      'SELECT id, name, email, role, avatar, bio, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Erreur auth me:', error);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
});

// ==================== ROUTES USERS ====================

// GET /api/users/profile - Récupérer le profil utilisateur
app.get('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    const result = await pool.query(
      `SELECT id, name, email, role, avatar, bio, created_at, last_login
       FROM users WHERE id = $1`,
      [decoded.id]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Récupérer les statistiques de l'utilisateur
    const statsResult = await pool.query(
      `SELECT 
         COUNT(DISTINCT CASE WHEN ul.completed_at IS NOT NULL THEN ul.lesson_id END) as completed_count,
         COUNT(DISTINCT CASE WHEN ul.is_favorite THEN ul.lesson_id END) as favorites_count,
         COALESCE(AVG(ul.score), 0) as average_score,
         COALESCE(SUM(l.duration), 0) as total_minutes
       FROM user_lessons ul
       LEFT JOIN lessons l ON ul.lesson_id = l.id
       WHERE ul.user_id = $1`,
      [user.id]
    );

    const stats = statsResult.rows[0] || {
      completed_count: 0,
      favorites_count: 0,
      average_score: 0,
      total_minutes: 0
    };

    res.json({
      success: true,
      user: {
        ...user,
        stats: {
          completed_count: parseInt(stats.completed_count),
          favorites_count: parseInt(stats.favorites_count),
          average_score: parseFloat(stats.average_score).toFixed(1),
          total_minutes: parseInt(stats.total_minutes)
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// PUT /api/users/profile - Mettre à jour le profil utilisateur
app.put('/api/users/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');
    const { name, bio, location, website, github, twitter, avatar } = req.body;

    // Construire la requête de mise à jour
    let updateQuery = 'UPDATE users SET ';
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramIndex}`);
      values.push(bio);
      paramIndex++;
    }

    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(location);
      paramIndex++;
    }

    if (website !== undefined) {
      updates.push(`website = $${paramIndex}`);
      values.push(website);
      paramIndex++;
    }

    if (github !== undefined) {
      updates.push(`github = $${paramIndex}`);
      values.push(github);
      paramIndex++;
    }

    if (twitter !== undefined) {
      updates.push(`twitter = $${paramIndex}`);
      values.push(twitter);
      paramIndex++;
    }

    if (avatar) {
      updates.push(`avatar = $${paramIndex}`);
      values.push(avatar);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }

    updateQuery += updates.join(', ');
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, name, email, role, avatar, bio, created_at, location, website, github, twitter`;

    values.push(decoded.id);

    const result = await pool.query(updateQuery, values);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// POST /api/users/avatar - Uploader un avatar
app.post('/api/users/avatar', uploadImage.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    // Générer l'URL de l'avatar
    const avatarUrl = `http://localhost:5000/uploads/avatars/${req.file.filename}`;

    // Mettre à jour l'utilisateur dans la base de données
    await pool.query(
      'UPDATE users SET avatar = $1 WHERE id = $2',
      [avatarUrl, decoded.id]
    );

    res.json({
      success: true,
      message: 'Avatar uploadé avec succès',
      avatar: avatarUrl
    });

  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/users/progress - Récupérer la progression
app.get('/api/users/progress', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    const result = await pool.query(
      `SELECT 
         l.id, l.title, l.subject, l.class_level,
         ul.completed_at, ul.score, ul.is_favorite
       FROM user_lessons ul
       JOIN lessons l ON ul.lesson_id = l.id
       WHERE ul.user_id = $1
       ORDER BY ul.completed_at DESC NULLS LAST`,
      [decoded.id]
    );

    res.json({
      success: true,
      progress: result.rows
    });

  } catch (error) {
    console.error('❌ Erreur récupération progression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/users - Liste des utilisateurs (admin seulement)
app.get('/api/users', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userCheck.rows[0]?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const result = await pool.query(
      `SELECT id, name, email, role, avatar, bio, created_at, last_login
       FROM users ORDER BY created_at DESC`
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

// DELETE /api/users/:id - Supprimer un utilisateur (admin seulement)
app.delete('/api/users/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');

    // Vérifier si l'utilisateur est admin
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userCheck.rows[0]?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

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

// ==================== ROUTES LESSONS ====================

// GET ALL LESSONS
app.get('/api/lessons', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, subject, class_level as class, description, emoji, duration, difficulty, downloads, views, rating FROM lessons ORDER BY id DESC'
    );
    res.json({ success: true, lessons: result.rows });
  } catch (error) {
    console.error('❌ Erreur récupération lessons:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET LESSON BY ID
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const result = await pool.query(
      'SELECT * FROM lessons WHERE id = $1',
      [lessonId]
    );

    const lesson = result.rows[0];

    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    }

    await pool.query('UPDATE lessons SET views = views + 1 WHERE id = $1', [lessonId]);

    res.json({ success: true, lesson });
  } catch (error) {
    console.error('❌ Erreur récupération lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/lessons - Version sans fichier
app.post('/api/lessons', async (req, res) => {
  try {
    console.log('📝 Création nouvelle leçon - Body reçu:', req.body);
    
    const { title, description, subject, class_level, emoji, html_content } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, subject, class_level, emoji, html_content) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, subject, class_level as class, description, emoji`,
      [
        title,
        description || 'Description par défaut',
        subject || 'Général',
        class_level || 'Tous niveaux',
        emoji || '📚',
        html_content || '<div>Contenu par défaut</div>'
      ]
    );

    console.log('✅ Leçon créée avec ID:', result.rows[0].id);
    
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

// POST /api/lessons/uploads - Version avec fichier
app.post('/api/lessons/uploads', upload.single('htmlFile'), async (req, res) => {
  try {
    console.log('📝 Upload de leçon avec fichier - Body reçu:', req.body);
    console.log('📁 Fichier reçu:', req.file ? req.file.originalname : 'Aucun fichier');

    const title = req.body.title || 'Sans titre';
    const description = req.body.description || req.body.desc || '';
    const subject = req.body.subject || req.body.matiere || 'Général';
    const class_level = req.body.class_level || req.body.class || req.body.niveau || 'Tous niveaux';
    const emoji = req.body.emoji || '📚';
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Le titre est requis'
      });
    }

    let htmlContent = '';
    if (req.file) {
      htmlContent = fs.readFileSync(req.file.path, 'utf8');
      console.log(`📄 Fichier lu: ${req.file.originalname} (${htmlContent.length} caractères)`);
    } else {
      htmlContent = req.body.html_content || req.body.html || '<div>Contenu par défaut</div>';
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, subject, class_level, emoji, html_content) 
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, subject, class_level as class, description, emoji`,
      [
        title,
        description,
        subject,
        class_level,
        emoji,
        htmlContent
      ]
    );

    console.log('✅ Leçon créée avec ID:', result.rows[0].id);
    
    res.status(201).json({
      success: true,
      message: 'Leçon créée avec succès',
      lesson: result.rows[0],
      fileInfo: req.file ? {
        filename: req.file.filename,
        size: req.file.size,
        originalName: req.file.originalname
      } : null
    });

  } catch (error) {
    console.error('❌ Erreur création leçon:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création'
    });
  }
});

// DELETE /api/lessons/:id - Supprimer une leçon
app.delete('/api/lessons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lessonId = parseInt(id);
    
    if (isNaN(lessonId)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const checkResult = await pool.query(
      'SELECT id FROM lessons WHERE id = $1',
      [lessonId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    }

    await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);

    console.log(`✅ Leçon ${lessonId} supprimée`);
    
    res.json({
      success: true,
      message: 'Leçon supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// GET /api/lessons/debug - Pour voir toutes les leçons avec détails
app.get('/api/lessons/debug', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons ORDER BY id');
    res.json({
      success: true,
      count: result.rows.length,
      lessons: result.rows
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route pour réinitialiser les IDs (à utiliser une seule fois)
app.post('/api/lessons/reset-ids', async (req, res) => {
  try {
    const lessons = await pool.query('SELECT * FROM lessons ORDER BY id');
    
    for (let i = 0; i < lessons.rows.length; i++) {
      const lesson = lessons.rows[i];
      const newId = i + 1;
      
      if (lesson.id !== newId) {
        await pool.query(
          'UPDATE lessons SET id = $1 WHERE id = $2',
          [newId, lesson.id]
        );
        console.log(`✅ Leçon ${lesson.title}: ID ${lesson.id} → ${newId}`);
      }
    }
    
    await pool.query(
      'SELECT setval(\'lessons_id_seq\', (SELECT MAX(id) FROM lessons))'
    );
    
    res.json({
      success: true,
      message: 'IDs réinitialisés avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES DE TEST ====================

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Serveur OK',
    time: new Date().toISOString()
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API EduLearn',
    endpoints: {
      test: '/api/test',
      register: '/api/auth/register',
      login: '/api/auth/login',
      me: '/api/auth/me',
      lessons: '/api/lessons',
      upload: '/api/lessons/uploads (POST avec fichier)',
      profile: '/api/users/profile',
      avatar: '/api/users/avatar (POST pour uploader)'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log(` Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

// Démarrer le serveur
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 SERVEUR DÉMARRÉ SUR http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('\n📋 Routes disponibles:');
  console.log(`   ✅ GET  http://localhost:${PORT}/`);
  console.log(`   ✅ GET  http://localhost:${PORT}/api/test`);
  console.log(`   ✅ POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   ✅ POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   ✅ GET  http://localhost:${PORT}/api/auth/me`);
  console.log(`   ✅ GET  http://localhost:${PORT}/api/lessons`);
  console.log(`   ✅ POST http://localhost:${PORT}/api/lessons (sans fichier)`);
  console.log(`   ✅ POST http://localhost:${PORT}/api/lessons/uploads (AVEC fichier)`);
  console.log(`   ✅ DELETE http://localhost:${PORT}/api/lessons/:id`);
  console.log(`   ✅ GET  http://localhost:${PORT}/api/lessons/:id`);
  console.log(`   ✅ GET  http://localhost:${PORT}/api/users/profile`);
  console.log(`   ✅ PUT  http://localhost:${PORT}/api/users/profile`);
  console.log(`   ✅ POST http://localhost:${PORT}/api/users/avatar (upload image)`);
  console.log('\n🔑 Comptes de test:');
  console.log('   admin@school.com / admin123');
  console.log('   student@school.com / student123');
  console.log('='.repeat(60) + '\n');
});