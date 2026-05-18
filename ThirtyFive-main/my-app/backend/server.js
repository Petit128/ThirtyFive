// backend/server.js
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

// ==================== CONFIGURATION UPLOAD ====================
const createDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

createDir(path.join(__dirname, 'uploads'));
createDir(path.join(__dirname, 'uploads/avatars'));
createDir(path.join(__dirname, 'uploads/lessons'));
createDir(path.join(__dirname, 'uploads/files'));
createDir(path.join(__dirname, 'uploads/documents'));
createDir(path.join(__dirname, 'uploads/videos'));
createDir(path.join(__dirname, 'uploads/archives'));
createDir(path.join(__dirname, 'uploads/css'));
createDir(path.join(__dirname, 'uploads/js'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    let dest = 'uploads/files';
    
    if (file.fieldname === 'avatar') dest = 'uploads/avatars';
    else if (ext === '.html' || ext === '.htm') dest = 'uploads/lessons';
    else if (ext === '.css') dest = 'uploads/css';
    else if (ext === '.js') dest = 'uploads/js';
    else if (file.mimetype?.startsWith('image/')) dest = 'uploads/avatars';
    else if (file.mimetype?.startsWith('video/')) dest = 'uploads/videos';
    else if (file.mimetype === 'application/pdf') dest = 'uploads/documents';
    else if (ext === '.zip' || ext === '.rar' || ext === '.7z') dest = 'uploads/archives';
    
    createDir(path.join(__dirname, dest));
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50);
    cb(null, `${name}-${unique}${ext}`);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB
});

// ==================== MIDDLEWARE ====================
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000'], 
  credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// ==================== CONNEXION POSTGRESQL ====================
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'edulearn',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'petit',
});

// ==================== INITIALISATION BASE DE DONNÉES ====================
async function initDatabase() {
  try {
    // Créer les tables si elles n'existent pas
    await pool.query(`
      -- Table users
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'student',
        avatar TEXT,
        bio TEXT,
        class_name VARCHAR(100),
        school VARCHAR(200),
        permissions JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      );

      -- Table lessons
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        subject VARCHAR(100),
        class_level VARCHAR(50),
        emoji VARCHAR(10),
        html_content TEXT,
        css_content TEXT,
        js_content TEXT,
        file_path TEXT,
        file_type VARCHAR(20) DEFAULT 'html',
        duration INTEGER DEFAULT 30,
        difficulty VARCHAR(20) DEFAULT 'beginner',
        thumbnail TEXT,
        downloads INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        is_published BOOLEAN DEFAULT true,
        approved BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table user_lessons (progression)
      CREATE TABLE IF NOT EXISTS user_lessons (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
        completed_at TIMESTAMP,
        score INTEGER,
        is_favorite BOOLEAN DEFAULT false,
        UNIQUE(user_id, lesson_id)
      );

      -- Table grades (notes)
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        lesson_id INTEGER REFERENCES lessons(id),
        quiz_id INTEGER,
        exam_type VARCHAR(20) DEFAULT 'quiz',
        grade INTEGER NOT NULL,
        max_grade INTEGER DEFAULT 100,
        comment TEXT,
        feedback TEXT,
        graded_by INTEGER REFERENCES users(id),
        graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table quizzes
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        subject VARCHAR(100),
        lesson_id INTEGER REFERENCES lessons(id),
        time_limit INTEGER DEFAULT 30,
        passing_score INTEGER DEFAULT 60,
        attempts_allowed INTEGER DEFAULT 3,
        created_by INTEGER REFERENCES users(id),
        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table quiz_questions
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB,
        correct_answer TEXT,
        points INTEGER DEFAULT 1,
        order_index INTEGER DEFAULT 0
      );

      -- Table quiz_attempts
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER,
        answers JSONB,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table forum_categories
      CREATE TABLE IF NOT EXISTS forum_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        is_private BOOLEAN DEFAULT false,
        invite_code VARCHAR(20),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table forum_topics
      CREATE TABLE IF NOT EXISTS forum_topics (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES forum_categories(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        content TEXT,
        is_pinned BOOLEAN DEFAULT false,
        is_locked BOOLEAN DEFAULT false,
        is_private BOOLEAN DEFAULT false,
        views INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table forum_posts
      CREATE TABLE IF NOT EXISTS forum_posts (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        likes INTEGER DEFAULT 0,
        is_answer BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table uploaded_files
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        file_type VARCHAR(50),
        user_id INTEGER REFERENCES users(id),
        lesson_id INTEGER REFERENCES lessons(id),
        is_public BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Table forum_category_members
      CREATE TABLE IF NOT EXISTS forum_category_members (
        category_id INTEGER REFERENCES forum_categories(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (category_id, user_id)
      );

      -- Table topic_members (pour topics privés)
      CREATE TABLE IF NOT EXISTS topic_members (
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (topic_id, user_id)
      );

      -- Index pour performances
      CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject);
      CREATE INDEX IF NOT EXISTS idx_lessons_class ON lessons(class_level);
      CREATE INDEX IF NOT EXISTS idx_grades_user ON grades(user_id);
      CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id);
    `);

    console.log('✅ Base de données initialisée');

    // Créer un compte admin par défaut si nécessaire
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@school.com']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
        ['Administrateur', 'admin@school.com', hashedPassword, 'admin']
      );
      console.log('✅ Compte admin créé: admin@school.com / admin123');
    }

    // Créer un compte professeur par défaut
    const profCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['professor@school.com']);
    if (profCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('professor123', 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
        ['Professeur Test', 'professor@school.com', hashedPassword, 'professor']
      );
      console.log('✅ Compte professeur créé: professor@school.com / professor123');
    }

    // Créer un compte étudiant par défaut
    const studentCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['student@school.com']);
    if (studentCheck.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('student123', 10);
      await pool.query(
        `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)`,
        ['Étudiant Test', 'student@school.com', hashedPassword, 'student']
      );
      console.log('✅ Compte étudiant créé: student@school.com / student123');
    }

    // Créer des catégories forum par défaut
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM forum_categories');
    if (parseInt(categoriesCount.rows[0].count) === 0) {
      await pool.query(
        `INSERT INTO forum_categories (name, description, icon) VALUES 
         ('📚 Général', 'Discussions générales sur les cours', 'general'),
         ('❓ Aide', 'Posez vos questions techniques', 'help'),
         ('💡 Projets', 'Partagez vos projets', 'projects'),
         ('📢 Annonces', 'Annonces importantes', 'announce')`
      );
      console.log('✅ Catégories forum créées');
    }

  } catch (error) {
    console.error('❌ Erreur initialisation DB:', error);
  }
}

initDatabase();

// ==================== MIDDLEWARE AUTH ====================
const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token manquant' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');
    const result = await pool.query(
      `SELECT id, name, email, role, avatar, bio, class_name, school, permissions 
       FROM users WHERE id = $1`,
      [decoded.id]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, message: 'Token invalide' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Non authentifié' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: `Accès refusé. Rôle ${req.user.role} non autorisé. Requis: ${roles.join(', ')}` 
    });
  }
  next();
};

// ==================== ROUTES AUTH ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('📝 Tentative inscription:', req.body.email);
    
    let { name, email, password, role, class_name, school } = req.body;

    if (!role || role === 'user') role = 'student';
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Mot de passe: minimum 6 caractères' });
    }

    const validRoles = ['student', 'professor', 'admin'];
    if (!validRoles.includes(role)) role = 'student';

    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, class_name, school, avatar) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, role, class_name, school, avatar, created_at`,
      [name, email, hashedPassword, role, class_name || null, school || null, 
       `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=646cff&color=fff`]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre-secret-jwt',
      { expiresIn: '7d' }
    );

    console.log('✅ Inscription réussie:', email);
    res.status(201).json({ success: true, message: 'Inscription réussie', token, user });
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentative connexion:', req.body.email);
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'votre-secret-jwt',
      { expiresIn: '7d' }
    );

    delete user.password;
    console.log('✅ Connexion réussie:', email);
    
    res.json({ success: true, message: 'Connexion réussie', token, user });
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, avatar, bio, class_name, school, created_at, last_login 
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES LESSONS ====================
app.get('/api/lessons', async (req, res) => {
  try {
    const { subject, class_level, search, file_type, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT l.*, u.name as creator_name, u.avatar as creator_avatar,
             COALESCE(r.avg_rating, 0) as rating
      FROM lessons l
      LEFT JOIN users u ON l.created_by = u.id
      LEFT JOIN (SELECT lesson_id, AVG(rating) as avg_rating FROM ratings GROUP BY lesson_id) r ON l.id = r.lesson_id
      WHERE l.is_published = true
    `;
    const values = [];
    let paramCount = 1;
    
    if (subject) {
      query += ` AND l.subject = $${paramCount++}`;
      values.push(subject);
    }
    if (class_level) {
      query += ` AND l.class_level = $${paramCount++}`;
      values.push(class_level);
    }
    if (file_type) {
      query += ` AND l.file_type = $${paramCount++}`;
      values.push(file_type);
    }
    if (search) {
      query += ` AND (l.title ILIKE $${paramCount++} OR l.description ILIKE $${paramCount++})`;
      values.push(`%${search}%`, `%${search}%`);
    }
    
    query += ` ORDER BY l.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, values);
    const countResult = await pool.query('SELECT COUNT(*) FROM lessons WHERE is_published = true');
    
    res.json({ 
      success: true, 
      lessons: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur GET lessons:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/lessons/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.name as creator_name, u.avatar as creator_avatar,
              COALESCE(r.avg_rating, 0) as rating
       FROM lessons l
       LEFT JOIN users u ON l.created_by = u.id
       LEFT JOIN (SELECT lesson_id, AVG(rating) as avg_rating FROM ratings GROUP BY lesson_id) r ON l.id = r.lesson_id
       WHERE l.id = $1`,
      [parseInt(req.params.id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    }
    
    await pool.query('UPDATE lessons SET views = views + 1 WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ success: true, lesson: result.rows[0] });
  } catch (error) {
    console.error('Erreur GET lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/lessons', protect, authorize('admin', 'professor'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, subject, class_level, emoji, html_content } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Le titre est requis' });
    }

    let filePath = null;
    let fileType = 'html';
    let htmlContent = html_content || '<div>Contenu par défaut</div>';
    
    if (req.file) {
      filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      
      if (ext === '.html' || ext === '.htm') {
        htmlContent = fs.readFileSync(req.file.path, 'utf8');
        fileType = 'html';
      } else if (ext === '.css') {
        fileType = 'css';
        htmlContent = `<link rel="stylesheet" href="/uploads/css/${req.file.filename}">`;
      } else if (ext === '.js') {
        fileType = 'javascript';
        htmlContent = `<script src="/uploads/js/${req.file.filename}"></script>`;
      } else {
        fileType = 'file';
        htmlContent = `<div class="file-resource">
          <h3>Fichier: ${req.file.originalname}</h3>
          <p>Taille: ${(req.file.size / 1024).toFixed(2)} KB</p>
          <a href="/uploads/${req.file.filename}" download>Télécharger le fichier</a>
        </div>`;
      }
    }

    const result = await pool.query(
      `INSERT INTO lessons (title, description, subject, class_level, emoji, html_content, file_path, file_type, created_by, is_published) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING *`,
      [title, description || '', subject || 'Général', class_level || 'Tous niveaux', emoji || '📚', 
       htmlContent, filePath, fileType, req.user.id]
    );
    
    console.log(`✅ Leçon créée: ${title}`);
    res.status(201).json({ success: true, lesson: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création leçon:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

app.delete('/api/lessons/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM lessons WHERE id = $1', [parseInt(req.params.id)]);
    res.json({ success: true, message: 'Leçon supprimée' });
  } catch (error) {
    console.error('Erreur DELETE lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES GRADES (Notes des étudiants) ====================
// ÉTUDIANT: voir ses notes
app.get('/api/grades/my-grades', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, l.title as lesson_title, l.subject as lesson_subject, q.title as quiz_title,
             u.name as teacher_name,
             CASE 
               WHEN g.grade >= 60 THEN 'Réussi'
               ELSE 'Échec'
             END as status
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN quizzes q ON g.quiz_id = q.id
      LEFT JOIN users u ON g.graded_by = u.id
      WHERE g.user_id = $1
      ORDER BY g.graded_at DESC
    `, [req.user.id]);
    
    const stats = await pool.query(`
      SELECT 
        COALESCE(AVG(g.grade), 0) as average,
        COUNT(CASE WHEN g.grade >= 60 THEN 1 END) as passed,
        COUNT(*) as total,
        MAX(g.grade) as best,
        MIN(g.grade) as worst
      FROM grades g
      WHERE g.user_id = $1
    `, [req.user.id]);
    
    res.json({ success: true, grades: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error('Erreur GET grades:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ÉTUDIANT: voir son rapport
app.get('/api/grades/my-report', protect, async (req, res) => {
  try {
    const subjects = await pool.query(`
      SELECT 
        COALESCE(l.subject, 'Général') as subject,
        AVG(g.grade) as average_grade,
        COUNT(*) as assignments_count,
        MIN(g.grade) as min_grade,
        MAX(g.grade) as max_grade
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      WHERE g.user_id = $1
      GROUP BY l.subject
      ORDER BY subject
    `, [req.user.id]);
    
    const overall = await pool.query(`
      SELECT 
        AVG(g.grade) as overall_average,
        COUNT(CASE WHEN g.grade >= 60 THEN 1 ELSE 0 END) as passed_count,
        COUNT(*) as total_count,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY g.grade) as median_grade
      FROM grades g
      WHERE g.user_id = $1
    `, [req.user.id]);
    
    res.json({ success: true, report: { subjects: subjects.rows, overall: overall.rows[0] } });
  } catch (error) {
    console.error('Erreur GET report:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PROFESSEUR/ADMIN: attribuer une note à un étudiant
app.post('/api/grades', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { user_id, lesson_id, quiz_id, grade, max_grade, comment, exam_type, feedback } = req.body;
    
    if (!user_id || grade === undefined) {
      return res.status(400).json({ success: false, message: 'Utilisateur et note requis' });
    }
    
    // Vérifier si l'étudiant existe
    const studentCheck = await pool.query('SELECT id, name FROM users WHERE id = $1 AND role = $2', [user_id, 'student']);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }
    
    const result = await pool.query(`
      INSERT INTO grades (user_id, lesson_id, quiz_id, grade, max_grade, comment, feedback, graded_by, exam_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (user_id, lesson_id, quiz_id) 
      DO UPDATE SET grade = $4, comment = $6, feedback = $7, graded_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [user_id, lesson_id || null, quiz_id || null, grade, max_grade || 100, comment || null, feedback || null, req.user.id, exam_type || 'exam']);
    
    console.log(`✅ Note attribuée: ${studentCheck.rows[0].name} = ${grade}/${max_grade || 100}`);
    
    res.status(201).json({ 
      success: true, 
      message: `Note ${grade}/${max_grade || 100} attribuée à ${studentCheck.rows[0].name}`,
      grade: result.rows[0]
    });
  } catch (error) {
    console.error('Erreur attribution note:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PROFESSEUR/ADMIN: voir toutes les notes des étudiants
app.get('/api/grades/all', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { class_name, subject, student_id } = req.query;
    
    let query = `
      SELECT g.*, u.name as student_name, u.class_name, u.email,
             l.title as lesson_title, l.subject as lesson_subject,
             t.name as teacher_name
      FROM grades g
      JOIN users u ON g.user_id = u.id
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN users t ON g.graded_by = t.id
      WHERE u.role = 'student'
    `;
    const values = [];
    let paramCount = 1;
    
    if (class_name) {
      query += ` AND u.class_name = $${paramCount++}`;
      values.push(class_name);
    }
    if (subject) {
      query += ` AND l.subject = $${paramCount++}`;
      values.push(subject);
    }
    if (student_id) {
      query += ` AND u.id = $${paramCount++}`;
      values.push(parseInt(student_id));
    }
    
    query += ` ORDER BY g.graded_at DESC`;
    
    const result = await pool.query(query, values);
    
    // Statistiques globales
    const stats = await pool.query(`
      SELECT 
        AVG(g.grade) as class_average,
        COUNT(DISTINCT u.id) as total_students,
        COUNT(g.id) as total_grades
      FROM grades g
      JOIN users u ON g.user_id = u.id
      WHERE u.role = 'student'
    `);
    
    res.json({ success: true, grades: result.rows, stats: stats.rows[0] });
  } catch (error) {
    console.error('Erreur GET all grades:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PROFESSEUR/ADMIN: mettre à jour une note
app.put('/api/grades/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { grade, comment, feedback } = req.body;
    
    const result = await pool.query(`
      UPDATE grades 
      SET grade = COALESCE($1, grade),
          comment = COALESCE($2, comment),
          feedback = COALESCE($3, feedback),
          graded_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [grade, comment, feedback, parseInt(id)]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Note non trouvée' });
    }
    
    res.json({ success: true, grade: result.rows[0] });
  } catch (error) {
    console.error('Erreur update grade:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES PROFESSEUR ====================
app.get('/api/professor/students', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email, avatar, class_name, school, created_at,
             (SELECT COUNT(*) FROM grades WHERE user_id = users.id) as total_grades,
             (SELECT AVG(grade) FROM grades WHERE user_id = users.id) as average_grade
      FROM users 
      WHERE role = 'student' 
      ORDER BY name
    `);
    res.json({ success: true, students: result.rows });
  } catch (error) {
    console.error('Erreur GET students:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/professor/students/:id/grades', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    const student = await pool.query('SELECT name FROM users WHERE id = $1', [studentId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }
    
    const grades = await pool.query(`
      SELECT g.*, l.title as lesson_title, l.subject as lesson_subject,
             q.title as quiz_title
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN quizzes q ON g.quiz_id = q.id
      WHERE g.user_id = $1
      ORDER BY g.graded_at DESC
    `, [studentId]);
    
    const stats = await pool.query(`
      SELECT 
        AVG(g.grade) as average,
        COUNT(*) as total,
        MAX(g.grade) as best,
        MIN(g.grade) as worst,
        COUNT(CASE WHEN g.grade >= 60 THEN 1 END) as passed
      FROM grades g
      WHERE g.user_id = $1
    `, [studentId]);
    
    res.json({ 
      success: true, 
      student: student.rows[0],
      grades: grades.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('Erreur GET student grades:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/professor/analytics', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    // Statistiques générales de la classe
    const classStats = await pool.query(`
      SELECT 
        AVG(g.grade) as avg_score,
        MAX(g.grade) as max_score,
        MIN(g.grade) as min_score,
        COUNT(DISTINCT g.user_id) as total_students,
        COUNT(g.id) as total_grades,
        COUNT(CASE WHEN g.grade >= 60 THEN 1 END) as passed_count,
        COUNT(CASE WHEN g.grade < 60 THEN 1 END) as failed_count
      FROM grades g
    `);
    
    // Top 10 étudiants
    const topStudents = await pool.query(`
      SELECT u.id, u.name, u.class_name, AVG(g.grade) as avg_grade, COUNT(g.id) as grades_count
      FROM users u
      JOIN grades g ON u.id = g.user_id
      WHERE u.role = 'student'
      GROUP BY u.id, u.name, u.class_name
      ORDER BY avg_grade DESC
      LIMIT 10
    `);
    
    // Performance par matière
    const subjectPerformance = await pool.query(`
      SELECT 
        COALESCE(l.subject, 'Général') as subject,
        AVG(g.grade) as avg_grade,
        COUNT(*) as total_exams,
        MAX(g.grade) as best,
        MIN(g.grade) as worst
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      GROUP BY l.subject
      ORDER BY avg_grade DESC
    `);
    
    // Distribution des notes
    const gradeDistribution = await pool.query(`
      SELECT 
        CASE 
          WHEN grade >= 90 THEN 'A (90-100)'
          WHEN grade >= 80 THEN 'B (80-89)'
          WHEN grade >= 70 THEN 'C (70-79)'
          WHEN grade >= 60 THEN 'D (60-69)'
          ELSE 'F (<60)'
        END as grade_letter,
        COUNT(*) as count
      FROM grades
      GROUP BY grade_letter
      ORDER BY MIN(grade) DESC
    `);
    
    res.json({ 
      success: true, 
      analytics: {
        classStats: classStats.rows[0],
        topStudents: topStudents.rows,
        subjectPerformance: subjectPerformance.rows,
        gradeDistribution: gradeDistribution.rows
      }
    });
  } catch (error) {
    console.error('Erreur GET analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/professor/upload', protect, authorize('professor', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'other';
    if (ext === '.html' || ext === '.htm') fileType = 'html';
    else if (ext === '.css') fileType = 'css';
    else if (ext === '.js') fileType = 'javascript';
    else if (req.file.mimetype?.startsWith('image/')) fileType = 'image';
    else if (req.file.mimetype?.startsWith('video/')) fileType = 'video';
    else if (req.file.mimetype === 'application/pdf') fileType = 'document';
    else if (ext === '.zip' || ext === '.rar') fileType = 'archive';
    
    const result = await pool.query(
      `INSERT INTO uploaded_files (filename, original_name, file_path, file_size, mime_type, file_type, user_id, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, fileType, req.user.id]
    );
    
    const fileInfo = {
      id: result.rows[0].id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      file_type: fileType,
      path: `/uploads/${req.file.filename}`
    };
    
    console.log(`✅ Fichier uploadé: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB) - Type: ${fileType}`);
    res.json({ success: true, file: fileInfo });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/professor/files', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { file_type, search } = req.query;
    let query = 'SELECT * FROM uploaded_files WHERE 1=1';
    const values = [];
    let paramCount = 1;
    
    if (file_type) {
      query += ` AND file_type = $${paramCount++}`;
      values.push(file_type);
    }
    if (search) {
      query += ` AND (original_name ILIKE $${paramCount++} OR filename ILIKE $${paramCount++})`;
      values.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, values);
    
    // Statistiques par type
    const stats = await pool.query(`
      SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size
      FROM uploaded_files
      GROUP BY file_type
    `);
    
    res.json({ success: true, files: result.rows, stats: stats.rows });
  } catch (error) {
    console.error('Erreur GET files:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.delete('/api/professor/files/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const file = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (file.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    // Supprimer le fichier physique
    if (fs.existsSync(file.rows[0].file_path)) {
      fs.unlinkSync(file.rows[0].file_path);
    }
    
    await pool.query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);
    res.json({ success: true, message: 'Fichier supprimé' });
  } catch (error) {
    console.error('Erreur DELETE file:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES PROFESSEUR - LEÇONS ====================

// GET /api/professor/lessons - Récupérer les leçons du professeur
app.get('/api/professor/lessons', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
             COUNT(DISTINCT ul.user_id) as students_count,
             COUNT(DISTINCT CASE WHEN ul.completed_at IS NOT NULL THEN ul.user_id END) as completed_count
      FROM lessons l
      LEFT JOIN user_lessons ul ON l.id = ul.lesson_id
      WHERE l.created_by = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [req.user.id]);
    
    res.json({ success: true, lessons: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET professor lessons:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/professor/lessons - Créer une leçon (HTML/CSS/JS ou fichier)
app.post('/api/professor/lessons', protect, authorize('professor', 'admin'), upload.single('file'), async (req, res) => {
  try {
    const { title, description, subject, class_level, emoji, lesson_type, duration, difficulty } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Le titre est requis' });
    }
    
    let htmlContent = '<div class="lesson-content"><p>Contenu en cours de préparation...</p></div>';
    let filePath = null;
    let fileType = lesson_type || 'html';
    
    if (req.file) {
      filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      
      if (ext === '.html' || ext === '.htm') {
        htmlContent = fs.readFileSync(req.file.path, 'utf8');
        fileType = 'html';
      } else if (ext === '.pdf') {
        fileType = 'pdf';
        htmlContent = `<div class="pdf-viewer">
          <embed src="/uploads/${req.file.filename}" type="application/pdf" width="100%" height="600px" />
          <p><a href="/uploads/${req.file.filename}" download>Télécharger le PDF</a></p>
        </div>`;
      } else if (ext === '.mp4' || ext === '.webm') {
        fileType = 'video';
        htmlContent = `<div class="video-player">
          <video controls width="100%" controlsList="nodownload">
            <source src="/uploads/${req.file.filename}" type="video/mp4">
            Votre navigateur ne supporte pas la vidéo.
          </video>
          <p><a href="/uploads/${req.file.filename}" download>Télécharger la vidéo</a></p>
        </div>`;
      } else if (ext === '.zip' || ext === '.rar') {
        fileType = 'archive';
        htmlContent = `<div class="archive-content">
          <h3>📦 Fichier archive: ${req.file.originalname}</h3>
          <p>Taille: ${(req.file.size / 1024 / 1024).toFixed(2)} MB</p>
          <a href="/uploads/${req.file.filename}" class="download-btn" download>Télécharger l'archive</a>
        </div>`;
      } else {
        fileType = 'document';
        htmlContent = `<div class="document-content">
          <h3>📄 Fichier: ${req.file.originalname}</h3>
          <p>Taille: ${(req.file.size / 1024).toFixed(2)} KB</p>
          <a href="/uploads/${req.file.filename}" class="download-btn" download>Télécharger</a>
        </div>`;
      }
    }
    
    const result = await pool.query(`
      INSERT INTO lessons (title, description, subject, class_level, emoji, html_content, file_path, file_type, 
                          lesson_type, duration, difficulty, created_by, is_published, approved, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, false, NOW())
      RETURNING *
    `, [title, description || '', subject || 'Général', class_level || 'Tous niveaux', emoji || '📚', 
       htmlContent, filePath, fileType, fileType, duration || 30, difficulty || 'beginner', req.user.id]);
    
    console.log(`✅ Leçon créée par professeur: ${title}`);
    
    res.status(201).json({ 
      success: true, 
      lesson: result.rows[0],
      message: 'Leçon créée avec succès. En attente d\'approbation admin.'
    });
  } catch (error) {
    console.error('❌ Erreur création leçon:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/professor/lessons/:id - Modifier une leçon
app.put('/api/professor/lessons/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const { title, description, subject, class_level, emoji, html_content, duration, difficulty } = req.body;
    
    const lesson = await pool.query('SELECT created_by FROM lessons WHERE id = $1', [lessonId]);
    if (lesson.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    }
    if (lesson.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    const result = await pool.query(`
      UPDATE lessons SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        subject = COALESCE($3, subject),
        class_level = COALESCE($4, class_level),
        emoji = COALESCE($5, emoji),
        html_content = COALESCE($6, html_content),
        duration = COALESCE($7, duration),
        difficulty = COALESCE($8, difficulty),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *
    `, [title, description, subject, class_level, emoji, html_content, duration, difficulty, lessonId]);
    
    res.json({ success: true, lesson: result.rows[0], message: 'Leçon mise à jour' });
  } catch (error) {
    console.error('❌ Erreur update lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/professor/lessons/:id - Supprimer une leçon
app.delete('/api/professor/lessons/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    const lesson = await pool.query('SELECT created_by, file_path FROM lessons WHERE id = $1', [lessonId]);
    if (lesson.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Leçon non trouvée' });
    }
    if (lesson.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    // Supprimer le fichier physique
    if (lesson.rows[0].file_path && fs.existsSync(lesson.rows[0].file_path)) {
      fs.unlinkSync(lesson.rows[0].file_path);
    }
    
    await pool.query('DELETE FROM user_lessons WHERE lesson_id = $1', [lessonId]);
    await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
    
    res.json({ success: true, message: 'Leçon supprimée' });
  } catch (error) {
    console.error('❌ Erreur delete lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES QUIZ ====================
app.get('/api/quizzes', protect, async (req, res) => {
  try {
    const { subject } = req.query;
    let query = `
      SELECT q.*, u.name as creator_name,
             (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $1) as attempts_count,
             (SELECT score FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $1 ORDER BY completed_at DESC LIMIT 1) as your_score
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.is_published = true
    `;
    const values = [req.user.id];
    
    if (subject) {
      query += ` AND q.subject = $2`;
      values.push(subject);
    }
    
    query += ` ORDER BY q.created_at DESC`;
    
    const result = await pool.query(query, values);
    res.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error('Erreur GET quizzes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/quizzes/:id', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    const quizResult = await pool.query(`
      SELECT q.*, u.name as creator_name
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = $1 AND q.is_published = true
    `, [quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    const questionsResult = await pool.query(`
      SELECT id, question_text, options, points, order_index
      FROM quiz_questions 
      WHERE quiz_id = $1
      ORDER BY order_index ASC
    `, [quizId]);
    
    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows.map(q => ({
      ...q,
      options: q.options || []
    }));
    
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('Erreur GET quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Dans server.js - Remplacer la route POST /api/quizzes/:id/attempt
app.post('/api/quizzes/:id/attempt', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, exam_type = 'quiz' } = req.body;
    
    // Récupérer les questions avec les réponses correctes
    const questions = await pool.query(`
      SELECT id, correct_answer, points, question_text
      FROM quiz_questions 
      WHERE quiz_id = $1
    `, [quizId]);
    
    if (questions.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Questions non trouvées' });
    }
    
    let score = 0;
    let totalPoints = 0;
    const detailedResults = [];
    
    for (const q of questions.rows) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer && userAnswer.toString().toLowerCase() === (q.correct_answer || '').toString().toLowerCase();
      if (isCorrect) {
        score += q.points;
      }
      detailedResults.push({
        question_id: q.id,
        question_text: q.question_text,
        user_answer: userAnswer || null,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        points: q.points,
        earned_points: isCorrect ? q.points : 0
      });
    }
    
    const finalScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    const quizInfo = await pool.query(`
      SELECT passing_score, title, subject, lesson_id 
      FROM quizzes WHERE id = $1
    `, [quizId]);
    
    const passed = finalScore >= (quizInfo.rows[0]?.passing_score || 60);
    
    // Enregistrer la tentative (sans ON CONFLICT)
    const attemptResult = await pool.query(`
      INSERT INTO quiz_attempts (quiz_id, user_id, score, answers, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [quizId, req.user.id, finalScore, JSON.stringify(answers)]);
    
    // Vérifier si une note existe déjà pour ce quiz et cet utilisateur
    const existingGrade = await pool.query(`
      SELECT id FROM grades WHERE user_id = $1 AND quiz_id = $2
    `, [req.user.id, quizId]);
    
    let gradeResult;
    if (existingGrade.rows.length > 0) {
      // Mettre à jour la note existante
      gradeResult = await pool.query(`
        UPDATE grades 
        SET grade = $1, 
            graded_at = CURRENT_TIMESTAMP,
            comment = $2,
            exam_type = $3,
            subject = $4
        WHERE user_id = $5 AND quiz_id = $6
        RETURNING *
      `, [finalScore, 
          `${passed ? '✅ Réussi' : '❌ Échec'} - Score: ${finalScore}%`, 
          exam_type, 
          quizInfo.rows[0]?.subject || 'Général',
          req.user.id, 
          quizId]);
    } else {
      // Insérer une nouvelle note
      gradeResult = await pool.query(`
        INSERT INTO grades (user_id, quiz_id, grade, max_grade, exam_type, graded_by, comment, subject)
        VALUES ($1, $2, $3, 100, $4, $5, $6, $7)
        RETURNING *
      `, [req.user.id, quizId, finalScore, exam_type, req.user.id, 
          `${passed ? '✅ Réussi' : '❌ Échec'} - Score: ${finalScore}%`, 
          quizInfo.rows[0]?.subject || 'Général']);
    }
    
    console.log(`📝 Quiz terminé: ${quizInfo.rows[0]?.title} - Score: ${finalScore}% - ${passed ? 'Réussi' : 'Échec'}`);
    
    res.json({ 
      success: true, 
      score: finalScore, 
      passed,
      total_points: totalPoints,
      earned_points: score,
      details: detailedResults,
      attempt: attemptResult.rows[0],
      grade: gradeResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur quiz attempt:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// Remplacer la route POST /api/professor/quizzes
// MODIFIER la route POST /api/professor/quizzes pour supporter les questions avec fichiers
app.post('/api/professor/quizzes', protect, authorize('professor', 'admin'), upload.single('exam_file'), async (req, res) => {
  try {
    const { 
      title, description, subject, time_limit, passing_score, 
      exam_type, max_attempts, allow_retry, instructions, questions
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Titre requis' });
    }
    
    let examFilePath = null;
    let examFileName = null;
    
    // Si c'est un examen avec fichier principal
    if (req.file && (exam_type === 'exam' || exam_type === 'assignment')) {
      examFilePath = req.file.path;
      examFileName = req.file.originalname;
    }
    
    // Parser les questions
    let parsedQuestions = [];
    if (questions) {
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      } catch (e) {
        console.error('Erreur parsing questions:', e);
      }
    }
    
    const result = await pool.query(`
      INSERT INTO quizzes (title, description, subject, time_limit, passing_score, 
                          exam_type, max_attempts, allow_retry, exam_file_path, exam_file_name,
                          instructions, created_by, is_published, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
      RETURNING *
    `, [title, description || '', subject || '', time_limit || 30, passing_score || 60,
        exam_type || 'quiz', max_attempts || 1, allow_retry === 'true' || allow_retry === true, 
        examFilePath, examFileName, instructions || null, req.user.id]);
    
    const quizId = result.rows[0].id;
    
    // Ajouter les questions (qui peuvent être du texte OU des fichiers)
    if (parsedQuestions.length > 0) {
      for (let i = 0; i < parsedQuestions.length; i++) {
        const q = parsedQuestions[i];
        
        // Si la question a un fichier attaché (déjà uploadé)
        if (q.file_path) {
          await pool.query(`
            INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index,
                                        question_file_path, question_file_name, question_file_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [quizId, q.text || 'Voir le fichier ci-dessous', q.type || 'file', 
              JSON.stringify(q.options || []), q.correctAnswer, q.points || 1, i,
              q.file_path, q.file_name, q.file_type]);
        } else {
          // Question texte normale
          await pool.query(`
            INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [quizId, q.text, q.type || 'multiple_choice', JSON.stringify(q.options || []), q.correctAnswer, q.points || 1, i]);
        }
      }
    }
    
    console.log(`✅ ${exam_type === 'exam' ? 'Examen' : exam_type === 'assignment' ? 'Devoir' : 'Quiz'} créé: ${title}`);
    
    res.status(201).json({ 
      success: true, 
      quiz: result.rows[0],
      message: exam_type === 'exam' ? 'Examen créé avec succès' : exam_type === 'assignment' ? 'Devoir créé avec succès' : 'Quiz créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

app.get('/api/professor/quizzes', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT q.*, 
             (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id) as attempts_count,
             (SELECT AVG(score) FROM quiz_attempts WHERE quiz_id = q.id) as avg_score
      FROM quizzes q
      WHERE q.created_by = $1
      ORDER BY q.created_at DESC
    `, [req.user.id]);
    
    res.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error('Erreur GET professor quizzes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTE POUR NOTER UN EXAMEN ÉCRIT ====================
// POST /api/professor/quizzes/:id/grade/:userId - Noter un examen écrit
app.post('/api/professor/quizzes/:id/grade/:userId', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { score, feedback } = req.body;
    
    console.log('📝 Notation examen:', { quizId, userId, score, feedback });
    
    if (isNaN(quizId) || isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'IDs invalides' });
    }
    
    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, message: 'Score requis' });
    }
    
    // 1. Vérifier si la table existe, sinon la créer
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS exam_answers (
          id SERIAL PRIMARY KEY,
          quiz_id INTEGER,
          user_id INTEGER,
          answer_text TEXT,
          answer_file_path TEXT,
          answer_file_name VARCHAR(255),
          score INTEGER,
          feedback TEXT,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          graded_by INTEGER,
          graded_at TIMESTAMP
        )
      `);
      console.log('✅ Table exam_answers vérifiée/créée');
    } catch (err) {
      console.log('⚠️ Table existe déjà ou erreur:', err.message);
    }
    
    // 2. Vérifier si une réponse existe déjà
    let existingAnswer = await pool.query(`
      SELECT * FROM exam_answers 
      WHERE quiz_id = $1 AND user_id = $2
      ORDER BY submitted_at DESC 
      LIMIT 1
    `, [quizId, userId]);
    
    let result;
    
    if (existingAnswer.rows.length > 0) {
      // Mettre à jour la réponse existante
      result = await pool.query(`
        UPDATE exam_answers 
        SET score = $1, feedback = $2, graded_by = $3, graded_at = NOW()
        WHERE quiz_id = $4 AND user_id = $5
        RETURNING *
      `, [score, feedback || null, req.user.id, quizId, userId]);
      console.log('✅ Réponse existante mise à jour');
    } else {
      // Créer une nouvelle entrée (cas où l'étudiant n'a pas encore soumis officiellement)
      result = await pool.query(`
        INSERT INTO exam_answers (quiz_id, user_id, score, feedback, graded_by, graded_at, submitted_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `, [quizId, userId, score, feedback || null, req.user.id]);
      console.log('✅ Nouvelle entrée créée pour la note');
    }
    
    // 3. Enregistrer la note dans la table grades
    const quiz = await pool.query('SELECT title, subject FROM quizzes WHERE id = $1', [quizId]);
    const user = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    
    await pool.query(`
      INSERT INTO grades (user_id, quiz_id, grade, max_grade, exam_type, graded_by, comment, feedback, subject)
      VALUES ($1, $2, $3, 100, 'exam', $4, $5, $6, $7)
      ON CONFLICT (user_id, quiz_id) 
      DO UPDATE SET 
        grade = $3, 
        graded_at = CURRENT_TIMESTAMP, 
        feedback = $6,
        comment = $5
    `, [userId, quizId, score, req.user.id, 
        `Examen "${quiz.rows[0]?.title || 'Quiz'}" noté: ${score}/100`, 
        feedback, 
        quiz.rows[0]?.subject || 'Général']);
    
    console.log(`✅ Note ${score}% enregistrée pour ${user.rows[0]?.name || userId}`);
    
    res.json({ 
      success: true, 
      message: `Note de ${score}% enregistrée avec succès`,
      grade: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur notation examen:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// ==================== ROUTE POUR VOIR LES RÉPONSES DES ÉTUDIANTS ====================
// GET /api/professor/quizzes/:id/responses - Récupérer toutes les réponses d'un quiz/examen
app.get('/api/professor/quizzes/:id/responses', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    // Vérifier que le quiz appartient au professeur
    const quizCheck = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND created_by = $2',
      [quizId, req.user.id]
    );
    
    const quiz = quizCheck.rows[0];
    
    if (!quiz && req.user.role !== 'admin') {
      const quizExists = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
      if (quizExists.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
      }
    }
    
    const finalQuiz = quiz || (await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId])).rows[0];
    
    let responses;
    
    // Pour les examens écrits
    if (finalQuiz.exam_type === 'exam' || finalQuiz.exam_type === 'assignment') {
      responses = await pool.query(`
        SELECT 
          ea.*, 
          u.id as user_id,
          u.name as student_name, 
          u.email as student_email, 
          u.avatar as student_avatar,
          u.class_name
        FROM exam_answers ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.quiz_id = $1
        ORDER BY ea.submitted_at DESC
      `, [quizId]);
    } else {
      // Pour les quizzes à choix multiples
      responses = await pool.query(`
        SELECT 
          qa.*, 
          u.id as user_id,
          u.name as student_name, 
          u.email as student_email, 
          u.avatar as student_avatar,
          u.class_name
        FROM quiz_attempts qa
        JOIN users u ON qa.user_id = u.id
        WHERE qa.quiz_id = $1
        ORDER BY qa.completed_at DESC
      `, [quizId]);
    }
    
    // Statistiques
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_students,
        AVG(score) as average_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        COUNT(CASE WHEN score >= (SELECT passing_score FROM quizzes WHERE id = $1) THEN 1 END) as passed_count
      FROM ${finalQuiz.exam_type === 'exam' ? 'exam_answers' : 'quiz_attempts'}
      WHERE quiz_id = $1
    `, [quizId]);
    
    res.json({ 
      success: true, 
      quiz: finalQuiz,
      responses: responses.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// ==================== ROUTE POUR SOUMETTRE UN EXAMEN ÉCRIT ====================
// POST /api/quizzes/:id/submit-exam - Soumettre un examen écrit
app.post('/api/quizzes/:id/submit-exam', protect, upload.single('answer_file'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answer_text } = req.body;
    
    // Vérifier que le quiz existe
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    // Vérifier si l'étudiant a déjà soumis
    const existing = await pool.query(
      'SELECT * FROM exam_answers WHERE quiz_id = $1 AND user_id = $2',
      [quizId, req.user.id]
    );
    
    // Si tentative unique et déjà soumis
    if (!quiz.rows[0].allow_retry && existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà soumis cet examen' });
    }
    
    // Vérifier le nombre de tentatives
    const attemptsCount = existing.rows.length;
    const maxAttempts = quiz.rows[0].max_attempts || 1;
    
    if (attemptsCount >= maxAttempts) {
      return res.status(400).json({ success: false, message: `Nombre maximum de tentatives atteint (${maxAttempts})` });
    }
    
    let answerFilePath = null;
    let answerFileName = null;
    
    if (req.file) {
      answerFilePath = req.file.path;
      answerFileName = req.file.originalname;
    }
    
    // Insérer ou mettre à jour la réponse
    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(`
        UPDATE exam_answers
        SET answer_text = COALESCE($1, answer_text),
            answer_file_path = COALESCE($2, answer_file_path),
            answer_file_name = COALESCE($3, answer_file_name),
            submitted_at = NOW(),
            score = NULL,
            graded_by = NULL,
            graded_at = NULL
        WHERE quiz_id = $4 AND user_id = $5
        RETURNING *
      `, [answer_text || null, answerFilePath, answerFileName, quizId, req.user.id]);
    } else {
      result = await pool.query(`
        INSERT INTO exam_answers (quiz_id, user_id, answer_text, answer_file_path, answer_file_name, submitted_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `, [quizId, req.user.id, answer_text || null, answerFilePath, answerFileName]);
    }
    
    console.log(`📝 Examen soumis: étudiant ${req.user.id} - Quiz ${quizId}`);
    
    res.json({ 
      success: true, 
      message: 'Examen soumis avec succès',
      submission: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur soumission examen:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

app.delete('/api/professor/quizzes/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    await pool.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    await pool.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [quizId]);
    await pool.query('DELETE FROM quizzes WHERE id = $1 AND created_by = $2', [quizId, req.user.id]);
    
    res.json({ success: true, message: 'Quiz supprimé' });
  } catch (error) {
    console.error('Erreur DELETE quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/quizzes', protect, async (req, res) => {
  try {
    const { subject, difficulty } = req.query;
    let query = `
      SELECT q.*, u.name as creator_name,
             (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $1) as attempts_count,
             (SELECT score FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $1 ORDER BY completed_at DESC LIMIT 1) as your_score,
             (SELECT MAX(score) FROM quiz_attempts WHERE quiz_id = q.id AND user_id = $1) as best_score
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.is_published = true
    `;
    const values = [req.user.id];
    let paramCount = 2;
    
    if (subject) {
      query += ` AND q.subject = $${paramCount++}`;
      values.push(subject);
    }
    if (difficulty) {
      query += ` AND q.difficulty = $${paramCount++}`;
      values.push(difficulty);
    }
    
    query += ` ORDER BY q.created_at DESC`;
    
    const result = await pool.query(query, values);
    res.json({ success: true, quizzes: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET quizzes:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/quizzes/:id - Récupérer un quiz spécifique
app.get('/api/quizzes/:id', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    const quizResult = await pool.query(`
      SELECT q.*, u.name as creator_name
      FROM quizzes q
      LEFT JOIN users u ON q.created_by = u.id
      WHERE q.id = $1 AND q.is_published = true
    `, [quizId]);
    
    if (quizResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    // Récupérer les questions avec les fichiers
    const questionsResult = await pool.query(`
      SELECT id, question_text, question_type, options, points, order_index,
             question_file_path, question_file_name, question_file_type
      FROM quiz_questions 
      WHERE quiz_id = $1
      ORDER BY order_index ASC
    `, [quizId]);
    
    const quiz = quizResult.rows[0];
    quiz.questions = questionsResult.rows.map(q => ({
      ...q,
      options: q.options || [],
      has_file: q.question_file_path ? true : false,
      file_url: q.question_file_path ? `http://localhost:5000${q.question_file_path}` : null
    }));
    
    // Pour les étudiants, ne pas envoyer les réponses correctes
    if (req.user.role !== 'admin' && req.user.role !== 'professor') {
      quiz.questions = quiz.questions.map(q => ({
        ...q,
        correct_answer: undefined
      }));
    }
    
    res.json({ success: true, quiz });
  } catch (error) {
    console.error('❌ Erreur GET quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/quizzes - Créer un quiz (professeur/admin)
app.post('/api/quizzes', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { title, description, subject, lesson_id, time_limit, passing_score, difficulty, questions } = req.body;
    
    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Titre et questions requis' });
    }
    
    const result = await pool.query(`
      INSERT INTO quizzes (title, description, subject, lesson_id, time_limit, passing_score, difficulty, created_by, is_published, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW())
      RETURNING *
    `, [title, description || '', subject || '', lesson_id || null, time_limit || 30, passing_score || 60, difficulty || 'medium', req.user.id]);
    
    const quizId = result.rows[0].id;
    
    // Ajouter les questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await pool.query(`
        INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [quizId, q.text, q.type || 'multiple_choice', JSON.stringify(q.options || []), q.correctAnswer, q.points || 1, i]);
    }
    
    console.log(`✅ Quiz créé: ${title}`);
    
    res.status(201).json({ 
      success: true, 
      quiz: result.rows[0],
      message: 'Quiz créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/quizzes/:id - Modifier un quiz
app.put('/api/quizzes/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { title, description, subject, time_limit, passing_score, difficulty, questions } = req.body;
    
    const quiz = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [quizId]);
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    if (quiz.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    await pool.query(`
      UPDATE quizzes SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        subject = COALESCE($3, subject),
        time_limit = COALESCE($4, time_limit),
        passing_score = COALESCE($5, passing_score),
        difficulty = COALESCE($6, difficulty),
        updated_at = NOW()
      WHERE id = $7
    `, [title, description, subject, time_limit, passing_score, difficulty, quizId]);
    
    // Mettre à jour les questions si fournies
    if (questions && questions.length > 0) {
      await pool.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        await pool.query(`
          INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, order_index)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [quizId, q.text, q.type || 'multiple_choice', JSON.stringify(q.options || []), q.correctAnswer, q.points || 1, i]);
      }
    }
    
    res.json({ success: true, message: 'Quiz mis à jour' });
  } catch (error) {
    console.error('❌ Erreur update quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/quizzes/:id - Supprimer un quiz
app.delete('/api/quizzes/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    const quiz = await pool.query('SELECT created_by FROM quizzes WHERE id = $1', [quizId]);
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    if (quiz.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    await pool.query('DELETE FROM quiz_questions WHERE quiz_id = $1', [quizId]);
    await pool.query('DELETE FROM quiz_attempts WHERE quiz_id = $1', [quizId]);
    await pool.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
    
    res.json({ success: true, message: 'Quiz supprimé' });
  } catch (error) {
    console.error('❌ Erreur delete quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/quizzes/:id/attempt - Soumettre une tentative de quiz
app.post('/api/quizzes/:id/attempt', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answers, exam_type = 'quiz' } = req.body;
    
    // Récupérer les questions avec les réponses correctes
    const questions = await pool.query(`
      SELECT id, correct_answer, points, question_text
      FROM quiz_questions 
      WHERE quiz_id = $1
    `, [quizId]);
    
    if (questions.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Questions non trouvées' });
    }
    
    let score = 0;
    let totalPoints = 0;
    const detailedResults = [];
    
    for (const q of questions.rows) {
      totalPoints += q.points;
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer && userAnswer.toLowerCase() === (q.correct_answer || '').toLowerCase();
      if (isCorrect) {
        score += q.points;
      }
      detailedResults.push({
        question_id: q.id,
        question_text: q.question_text,
        user_answer: userAnswer || null,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        points: q.points,
        earned_points: isCorrect ? q.points : 0
      });
    }
    
    const finalScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    const quizInfo = await pool.query(`
      SELECT passing_score, title, subject, lesson_id 
      FROM quizzes WHERE id = $1
    `, [quizId]);
    
    const passed = finalScore >= (quizInfo.rows[0]?.passing_score || 60);
    
    // Enregistrer la tentative
    const attemptResult = await pool.query(`
      INSERT INTO quiz_attempts (quiz_id, user_id, score, answers, completed_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `, [quizId, req.user.id, finalScore, JSON.stringify(answers)]);
    
    // ENREGISTRER LA NOTE AUTOMATIQUEMENT (examen)
    const gradeResult = await pool.query(`
      INSERT INTO grades (user_id, quiz_id, grade, max_grade, exam_type, graded_by, comment, subject)
      VALUES ($1, $2, $3, 100, $4, $5, $6, $7)
      ON CONFLICT (user_id, quiz_id) 
      DO UPDATE SET 
        grade = $3, 
        graded_at = CURRENT_TIMESTAMP,
        comment = $6,
        exam_type = $4
      RETURNING *
    `, [req.user.id, quizId, finalScore, exam_type, req.user.id, 
        `${passed ? '✅ Réussi' : '❌ Échec'} - Score: ${finalScore}%`, 
        quizInfo.rows[0]?.subject || 'Général']);
    
    console.log(`📝 Quiz terminé: ${quizInfo.rows[0]?.title} - Score: ${finalScore}% - ${passed ? 'Réussi' : 'Échec'}`);
    
    res.json({ 
      success: true, 
      score: finalScore, 
      passed,
      total_points: totalPoints,
      earned_points: score,
      details: detailedResults,
      attempt: attemptResult.rows[0],
      grade: gradeResult.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur quiz attempt:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/quizzes/:id/results - Résultats détaillés d'un quiz pour un étudiant
app.get('/api/quizzes/:id/results', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    const attempts = await pool.query(`
      SELECT qa.*, q.title, q.passing_score, q.time_limit
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.quiz_id = $1 AND qa.user_id = $2
      ORDER BY qa.completed_at DESC
    `, [quizId, req.user.id]);
    
    const questions = await pool.query(`
      SELECT id, question_text, correct_answer, points
      FROM quiz_questions
      WHERE quiz_id = $1
    `, [quizId]);
    
    res.json({ success: true, attempts: attempts.rows, questions: questions.rows });
  } catch (error) {
    console.error('❌ Erreur quiz results:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES FORUM ====================
// backend/server.js - Remplacer UNIQUEMENT la route GET /api/forum/categories

// GET /api/forum/categories - Récupérer toutes les catégories (CORRIGÉ)
app.get('/api/forum/categories', protect, async (req, res) => {
  try {
    // Requête simplifiée et corrigée - pas d'ambiguïté sur user_id
    const query = `
      SELECT 
        c.id,
        c.name,
        c.description,
        c.icon,
        c.is_private,
        c.invite_code,
        c.created_by,
        c.created_at,
        COUNT(DISTINCT t.id) as topic_count,
        COUNT(DISTINCT p.id) as post_count
      FROM forum_categories c
      LEFT JOIN forum_topics t ON c.id = t.category_id
      LEFT JOIN forum_posts p ON t.id = p.topic_id
    `;
    
    let result;
    
    if (req.user.role === 'admin') {
      result = await pool.query(query + ` GROUP BY c.id ORDER BY c.name`);
    } else {
      result = await pool.query(
        query + ` 
        WHERE c.is_private = false 
           OR c.id IN (SELECT category_id FROM forum_category_members WHERE user_id = $1)
           OR c.created_by = $1
        GROUP BY c.id 
        ORDER BY c.name`,
        [req.user.id]
      );
    }
    
    // Ajouter les informations supplémentaires pour chaque catégorie
    for (const cat of result.rows) {
      // Vérifier si l'utilisateur est membre (pour catégories privées)
      if (cat.is_private) {
        const memberCheck = await pool.query(
          'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
          [cat.id, req.user.id]
        );
        cat.is_member = memberCheck.rows.length > 0;
      }
      
      // Ajouter le nom du propriétaire
      const ownerCheck = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [cat.created_by]
      );
      cat.owner_name = ownerCheck.rows[0]?.name || 'Inconnu';
    }
    
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    console.error('❌ Erreur forum categories:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/categories - Créer une catégorie (privée ou publique)
app.post('/api/forum/categories', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { name, description, icon, is_private, invite_emails } = req.body;
    
    console.log('📝 Création catégorie:', { name, is_private, invite_emails });
    
    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est requis' });
    }
    
    // Générer un code d'invitation unique pour les catégories privées
    let invite_code = null;
    if (is_private) {
      invite_code = Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    
    const result = await pool.query(`
      INSERT INTO forum_categories (name, description, icon, is_private, invite_code, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `, [name.trim(), description || '', icon || '📁', is_private || false, invite_code, req.user.id]);
    
    const newCategory = result.rows[0];
    
    // Ajouter le créateur comme membre
    await pool.query(`
      INSERT INTO forum_category_members (category_id, user_id, joined_at)
      VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING
    `, [newCategory.id, req.user.id]);
    
    // Inviter des utilisateurs par email
    if (is_private && invite_emails && Array.isArray(invite_emails) && invite_emails.length > 0) {
      for (const email of invite_emails) {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows[0]) {
          await pool.query(`
            INSERT INTO forum_category_members (category_id, user_id, joined_at)
            VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING
          `, [newCategory.id, userResult.rows[0].id]);
          console.log(`✅ Utilisateur ${email} invité dans la catégorie ${name}`);
        }
      }
    }
    
    console.log(`✅ Catégorie forum créée: ${name} (ID: ${newCategory.id}, privée: ${is_private})`);
    
    res.status(201).json({ 
      success: true, 
      category: newCategory,
      invite_code: invite_code,
      message: is_private ? `Catégorie privée créée. Code d'invitation: ${invite_code}` : 'Catégorie publique créée'
    });
  } catch (error) {
    console.error('❌ Erreur création catégorie:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la création: ' + error.message 
    });
  }
});

// GET /api/forum/categories/:id/topics - Récupérer les topics d'une catégorie (CORRIGÉ)
app.get('/api/forum/categories/:id/topics', protect, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'ID de catégorie invalide' });
    }
    
    // Vérifier l'accès à la catégorie privée
    const category = await pool.query('SELECT is_private, created_by, name FROM forum_categories WHERE id = $1', [categoryId]);
    
    if (category.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    if (category.rows[0].is_private && req.user.role !== 'admin') {
      const memberCheck = await pool.query(
        'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
        [categoryId, req.user.id]
      );
      if (memberCheck.rows.length === 0 && category.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cette catégorie est privée. Vous devez être invité pour y accéder.',
          requires_invite: true,
          category_id: categoryId
        });
      }
    }
    
    // Requête corrigée - suppression de la colonne last_viewed
    const result = await pool.query(`
      SELECT t.*, 
             u.name as author_name, 
             u.avatar as author_avatar, 
             u.role as author_role,
             COUNT(DISTINCT p.id) as reply_count,
             COALESCE(MAX(p.created_at), t.created_at) as last_activity
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      LEFT JOIN forum_posts p ON t.id = p.topic_id
      WHERE t.category_id = $1
      GROUP BY t.id, u.name, u.avatar, u.role
      ORDER BY t.is_pinned DESC, last_activity DESC
      LIMIT $2 OFFSET $3
    `, [categoryId, parseInt(limit), offset]);
    
    // Compter le total
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM forum_topics WHERE category_id = $1',
      [categoryId]
    );
    
    res.json({ 
      success: true, 
      topics: result.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit)),
      category: category.rows[0]
    });
  } catch (error) {
    console.error('Erreur GET topics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/topics - Créer un nouveau topic (CORRIGÉ)
app.post('/api/forum/topics', protect, async (req, res) => {
  try {
    const { categoryId, title, content, is_private, invited_users } = req.body;
    
    console.log('📝 Création topic:', { categoryId, title, is_private, invited_users });
    
    if (!categoryId || !title || !content) {
      return res.status(400).json({ success: false, message: 'Titre et contenu requis' });
    }
    
    // Vérifier l'accès à la catégorie
    const category = await pool.query('SELECT is_private, created_by FROM forum_categories WHERE id = $1', [categoryId]);
    
    if (category.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    if (category.rows[0].is_private && req.user.role !== 'admin') {
      const memberCheck = await pool.query(
        'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
        [categoryId, req.user.id]
      );
      if (memberCheck.rows.length === 0 && category.rows[0].created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Accès refusé à cette catégorie' });
      }
    }
    
    const topicResult = await pool.query(`
      INSERT INTO forum_topics (category_id, user_id, title, content, is_private, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [categoryId, req.user.id, title, content, is_private || false]);
    
    const newTopic = topicResult.rows[0];
    
    // Ajouter le premier post
    await pool.query(`
      INSERT INTO forum_posts (topic_id, user_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
    `, [newTopic.id, req.user.id, content]);
    
    // Pour les topics privés, ajouter les utilisateurs invités
    if (is_private && invited_users && Array.isArray(invited_users) && invited_users.length > 0) {
      for (const userId of invited_users) {
        const userIdNum = parseInt(userId);
        if (!isNaN(userIdNum)) {
          await pool.query(`
            INSERT INTO topic_members (topic_id, user_id, invited_at)
            VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING
          `, [newTopic.id, userIdNum]);
        }
      }
    }
    
    console.log(`✅ Nouveau topic créé: "${title}" dans catégorie ${categoryId}`);
    
    res.status(201).json({ 
      success: true, 
      topic: newTopic,
      message: is_private ? 'Topic privé créé. Seuls les invités peuvent le voir.' : 'Topic créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création topic:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/forum/topics/:id - Récupérer un topic avec ses posts (CORRIGÉ)
app.get('/api/forum/topics/:id', protect, async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    if (isNaN(topicId)) {
      return res.status(400).json({ success: false, message: 'ID de topic invalide' });
    }
    
    // Récupérer le topic
    const topicResult = await pool.query(`
      SELECT t.*, 
             u.name as author_name, 
             u.avatar as author_avatar, 
             u.role as author_role,
             c.name as category_name, 
             c.id as category_id, 
             c.is_private as category_is_private
      FROM forum_topics t
      JOIN users u ON t.user_id = u.id
      JOIN forum_categories c ON t.category_id = c.id
      WHERE t.id = $1
    `, [topicId]);
    
    if (topicResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Topic non trouvé' });
    }
    
    const topic = topicResult.rows[0];
    
    // Vérifier l'accès au topic privé
    if (topic.is_private && req.user.role !== 'admin' && topic.user_id !== req.user.id) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM topic_members WHERE topic_id = $1 AND user_id = $2',
        [topicId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        // Vérifier aussi l'accès à la catégorie
        if (topic.category_is_private) {
          const categoryMemberCheck = await pool.query(
            'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
            [topic.category_id, req.user.id]
          );
          if (categoryMemberCheck.rows.length === 0 && topic.created_by !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Topic privé - accès restreint' });
          }
        } else {
          return res.status(403).json({ success: false, message: 'Topic privé - accès restreint' });
        }
      }
    }
    
    // Incrémenter les vues
    await pool.query('UPDATE forum_topics SET views = views + 1 WHERE id = $1', [topicId]);
    
    // Récupérer les posts - version corrigée sans likes COUNT DISTINCT problématique
    const postsResult = await pool.query(`
      SELECT p.*, 
             u.name as author_name, 
             u.avatar as author_avatar, 
             u.role as author_role,
             COALESCE(
               (SELECT COUNT(*) FROM forum_post_likes WHERE post_id = p.id), 
               0
             ) as like_count,
             EXISTS(
               SELECT 1 FROM forum_post_likes WHERE post_id = p.id AND user_id = $2
             ) as user_liked
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.topic_id = $1
      ORDER BY p.created_at ASC
      LIMIT $3 OFFSET $4
    `, [topicId, req.user.id, parseInt(limit), offset]);
    
    // Compter le total des posts
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM forum_posts WHERE topic_id = $1',
      [topicId]
    );
    
    res.json({ 
      success: true, 
      topic,
      posts: postsResult.rows,
      total_posts: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Erreur GET topic:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/topics/:id/posts - Ajouter un post (CORRIGÉ)
app.post('/api/forum/topics/:id/posts', protect, async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Contenu requis' });
    }
    
    // Vérifier si le topic existe et n'est pas verrouillé
    const topicCheck = await pool.query(`
      SELECT is_locked, is_private, user_id, category_id 
      FROM forum_topics WHERE id = $1
    `, [topicId]);
    
    if (topicCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Topic non trouvé' });
    }
    
    if (topicCheck.rows[0].is_locked && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ce topic est verrouillé' });
    }
    
    // Vérifier l'accès aux topics privés
    if (topicCheck.rows[0].is_private && req.user.role !== 'admin' && topicCheck.rows[0].user_id !== req.user.id) {
      const memberCheck = await pool.query(
        'SELECT 1 FROM topic_members WHERE topic_id = $1 AND user_id = $2',
        [topicId, req.user.id]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ success: false, message: 'Accès restreint - Topic privé' });
      }
    }
    
    const result = await pool.query(`
      INSERT INTO forum_posts (topic_id, user_id, content, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING *
    `, [topicId, req.user.id, content]);
    
    await pool.query('UPDATE forum_topics SET updated_at = NOW() WHERE id = $1', [topicId]);
    
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur création post:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/posts/:id/like - Liker un post (CORRIGÉ)
app.post('/api/forum/posts/:id/like', protect, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Vérifier si la table existe, sinon la créer
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_post_likes (
        post_id INTEGER REFERENCES forum_posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        liked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (post_id, user_id)
      )
    `);
    
    // Vérifier si déjà liké
    const existing = await pool.query(
      'SELECT 1 FROM forum_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.id]
    );
    
    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.id]
      );
      await pool.query('UPDATE forum_posts SET likes = likes - 1 WHERE id = $1', [postId]);
    } else {
      // Like
      await pool.query(
        'INSERT INTO forum_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, req.user.id]
      );
      await pool.query('UPDATE forum_posts SET likes = likes + 1 WHERE id = $1', [postId]);
    }
    
    const result = await pool.query('SELECT likes FROM forum_posts WHERE id = $1', [postId]);
    
    res.json({ success: true, likes: result.rows[0]?.likes || 0, liked: existing.rows.length === 0 });
  } catch (error) {
    console.error('❌ Erreur like post:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/forum/topics/:id/pin - Épingler un topic (CORRIGÉ)
app.put('/api/forum/topics/:id/pin', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    
    const result = await pool.query(`
      UPDATE forum_topics SET is_pinned = NOT is_pinned, updated_at = NOW()
      WHERE id = $1
      RETURNING is_pinned
    `, [topicId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Topic non trouvé' });
    }
    
    res.json({ success: true, is_pinned: result.rows[0].is_pinned });
  } catch (error) {
    console.error('❌ Erreur pin topic:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/forum/topics/:id/lock - Verrouiller un topic (CORRIGÉ)
app.put('/api/forum/topics/:id/lock', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    
    const result = await pool.query(`
      UPDATE forum_topics SET is_locked = NOT is_locked, updated_at = NOW()
      WHERE id = $1
      RETURNING is_locked
    `, [topicId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Topic non trouvé' });
    }
    
    res.json({ success: true, is_locked: result.rows[0].is_locked });
  } catch (error) {
    console.error('❌ Erreur lock topic:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// DELETE /api/forum/posts/:id - Supprimer un post (CORRIGÉ)
app.delete('/api/forum/posts/:id', protect, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    const post = await pool.query(
      'SELECT * FROM forum_posts WHERE id = $1',
      [postId]
    );
    
    if (post.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post non trouvé' });
    }
    
    if (post.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas supprimer ce post' });
    }
    
    // Supprimer les likes associés
    await pool.query('DELETE FROM forum_post_likes WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM forum_posts WHERE id = $1', [postId]);
    
    res.json({ success: true, message: 'Post supprimé' });
  } catch (error) {
    console.error('❌ Erreur delete post:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/forum/posts/:id - Modifier un post (CORRIGÉ)
app.put('/api/forum/posts/:id', protect, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Contenu requis' });
    }
    
    const post = await pool.query(
      'SELECT * FROM forum_posts WHERE id = $1',
      [postId]
    );
    
    if (post.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post non trouvé' });
    }
    
    if (post.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas modifier ce post' });
    }
    
    const result = await pool.query(`
      UPDATE forum_posts 
      SET content = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [content, postId]);
    
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur update post:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/categories/:id/join - Rejoindre une catégorie privée (CORRIGÉ)
app.post('/api/forum/categories/:id/join', protect, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { invite_code } = req.body;
    
    if (!invite_code) {
      return res.status(400).json({ success: false, message: 'Code d\'invitation requis' });
    }
    
    const category = await pool.query(
      'SELECT is_private, invite_code, name, created_by FROM forum_categories WHERE id = $1',
      [categoryId]
    );
    
    if (!category.rows[0]) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    if (!category.rows[0].is_private) {
      return res.status(400).json({ success: false, message: 'Catégorie publique - pas besoin de code' });
    }
    
    if (category.rows[0].invite_code !== invite_code.toUpperCase()) {
      return res.status(403).json({ success: false, message: 'Code d\'invitation invalide' });
    }
    
    // Vérifier si déjà membre
    const existing = await pool.query(
      'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
      [categoryId, req.user.id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous êtes déjà membre' });
    }
    
    await pool.query(`
      INSERT INTO forum_category_members (category_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
    `, [categoryId, req.user.id]);
    
    res.json({ 
      success: true, 
      message: `Vous avez rejoint la catégorie "${category.rows[0].name}"`
    });
  } catch (error) {
    console.error('❌ Erreur join category:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/forum/categories/:id/invite - Obtenir le code d'invitation (CORRIGÉ)
app.get('/api/forum/categories/:id/invite', protect, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    const category = await pool.query(
      'SELECT id, name, is_private, invite_code, created_by FROM forum_categories WHERE id = $1',
      [categoryId]
    );
    
    if (!category.rows[0]) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    if (category.rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Seul le propriétaire peut obtenir le code' });
    }
    
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    
    res.json({ 
      success: true, 
      invite_code: category.rows[0].invite_code,
      category_name: category.rows[0].name,
      invite_link: `${clientUrl}/forum/join/${categoryId}?code=${category.rows[0].invite_code}`
    });
  } catch (error) {
    console.error('❌ Erreur get invite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/forum/my-topics - Mes topics (CORRIGÉ)
app.get('/api/forum/my-topics', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, c.name as category_name,
             COUNT(DISTINCT p.id) as reply_count,
             COALESCE(MAX(p.created_at), t.created_at) as last_activity
      FROM forum_topics t
      JOIN forum_categories c ON t.category_id = c.id
      LEFT JOIN forum_posts p ON t.id = p.topic_id
      WHERE t.user_id = $1
      GROUP BY t.id, c.name
      ORDER BY t.created_at DESC
    `, [req.user.id]);
    
    res.json({ success: true, topics: result.rows });
  } catch (error) {
    console.error('❌ Erreur my topics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/forum/search - Rechercher dans le forum (CORRIGÉ)
app.get('/api/forum/search', protect, async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Terme de recherche requis' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    let results = {};
    
    if (type === 'all' || type === 'topics') {
      const topics = await pool.query(`
        SELECT t.*, c.name as category_name, u.name as author_name,
               'topic' as result_type
        FROM forum_topics t
        JOIN forum_categories c ON t.category_id = c.id
        JOIN users u ON t.user_id = u.id
        WHERE t.title ILIKE $1 OR t.content ILIKE $1
        ORDER BY t.created_at DESC
        LIMIT 20
      `, [searchTerm]);
      results.topics = topics.rows;
    }
    
    if (type === 'all' || type === 'posts') {
      const posts = await pool.query(`
        SELECT p.*, t.title as topic_title, t.id as topic_id, u.name as author_name,
               'post' as result_type
        FROM forum_posts p
        JOIN forum_topics t ON p.topic_id = t.id
        JOIN users u ON p.user_id = u.id
        WHERE p.content ILIKE $1
        ORDER BY p.created_at DESC
        LIMIT 20
      `, [searchTerm]);
      results.posts = posts.rows;
    }
    
    res.json({ success: true, results, search_term: q });
  } catch (error) {
    console.error('❌ Erreur search:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// PUT /api/forum/posts/:id/answer - Marquer comme réponse (CORRIGÉ)
app.put('/api/forum/posts/:id/answer', protect, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Récupérer le topic associé
    const post = await pool.query('SELECT topic_id, user_id FROM forum_posts WHERE id = $1', [postId]);
    if (post.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post non trouvé' });
    }
    
    const topic = await pool.query('SELECT user_id FROM forum_topics WHERE id = $1', [post.rows[0].topic_id]);
    
    // Seul l'auteur du topic ou un admin peut marquer comme réponse
    if (topic.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Seul l\'auteur du topic peut marquer une réponse' });
    }
    
    // Enlever le marqueur des autres posts
    await pool.query(
      'UPDATE forum_posts SET is_answer = false WHERE topic_id = $1',
      [post.rows[0].topic_id]
    );
    
    // Marquer ce post comme réponse
    await pool.query(
      'UPDATE forum_posts SET is_answer = true WHERE id = $1',
      [postId]
    );
    
    res.json({ success: true, message: 'Réponse marquée comme solution' });
  } catch (error) {
    console.error('❌ Erreur mark answer:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// backend/server.js - Ajouter ces routes

// DELETE /api/forum/categories/:id - Supprimer une catégorie (admin ou propriétaire)
app.delete('/api/forum/categories/:id', protect, async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Vérifier si l'utilisateur est admin ou propriétaire
    const category = await pool.query(
      'SELECT created_by, name FROM forum_categories WHERE id = $1',
      [categoryId]
    );
    
    if (category.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }
    
    if (req.user.role !== 'admin' && category.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer cette catégorie' });
    }
    
    // Supprimer d'abord les topics et posts associés
    await pool.query('DELETE FROM forum_posts WHERE topic_id IN (SELECT id FROM forum_topics WHERE category_id = $1)', [categoryId]);
    await pool.query('DELETE FROM forum_topics WHERE category_id = $1', [categoryId]);
    await pool.query('DELETE FROM forum_category_members WHERE category_id = $1', [categoryId]);
    await pool.query('DELETE FROM forum_categories WHERE id = $1', [categoryId]);
    
    console.log(`✅ Catégorie supprimée: ${category.rows[0].name}`);
    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('❌ Erreur suppression catégorie:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// DELETE /api/forum/topics/:id - Supprimer un topic (admin ou auteur)
app.delete('/api/forum/topics/:id', protect, async (req, res) => {
  try {
    const topicId = parseInt(req.params.id);
    
    // Vérifier si l'utilisateur est admin ou auteur
    const topic = await pool.query(
      'SELECT user_id, title FROM forum_topics WHERE id = $1',
      [topicId]
    );
    
    if (topic.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Topic non trouvé' });
    }
    
    if (req.user.role !== 'admin' && topic.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé à supprimer ce topic' });
    }
    
    // Supprimer les posts et likes associés
    await pool.query('DELETE FROM forum_post_likes WHERE post_id IN (SELECT id FROM forum_posts WHERE topic_id = $1)', [topicId]);
    await pool.query('DELETE FROM forum_posts WHERE topic_id = $1', [topicId]);
    await pool.query('DELETE FROM topic_members WHERE topic_id = $1', [topicId]);
    await pool.query('DELETE FROM forum_topics WHERE id = $1', [topicId]);
    
    console.log(`✅ Topic supprimé: ${topic.rows[0].title}`);
    res.json({ success: true, message: 'Topic supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression topic:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// POST /api/forum/join-with-code - Rejoindre une catégorie avec un code
app.post('/api/forum/join-with-code', protect, async (req, res) => {
  try {
    const { invite_code } = req.body;
    
    if (!invite_code) {
      return res.status(400).json({ success: false, message: 'Code requis' });
    }
    
    // Chercher la catégorie avec ce code
    const category = await pool.query(
      'SELECT id, name, is_private, invite_code FROM forum_categories WHERE invite_code = $1 AND is_private = true',
      [invite_code.toUpperCase()]
    );
    
    if (category.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Code invalide' });
    }
    
    const cat = category.rows[0];
    
    // Vérifier si déjà membre
    const existing = await pool.query(
      'SELECT 1 FROM forum_category_members WHERE category_id = $1 AND user_id = $2',
      [cat.id, req.user.id]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Vous êtes déjà membre' });
    }
    
    // Ajouter comme membre
    await pool.query(`
      INSERT INTO forum_category_members (category_id, user_id, joined_at)
      VALUES ($1, $2, NOW())
    `, [cat.id, req.user.id]);
    
    res.json({ 
      success: true, 
      message: 'Vous avez rejoint la catégorie',
      category_name: cat.name,
      category_id: cat.id
    });
  } catch (error) {
    console.error('❌ Erreur join with code:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES ADMIN ====================
// GET /api/admin/users - Liste tous les utilisateurs (CORRIGÉ)
app.get('/api/admin/users', protect, authorize('admin'), async (req, res) => {
  try {
    // Requête simplifiée sans sous-requêtes problématiques
    const usersResult = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.role, 
        u.avatar, 
        u.bio, 
        u.class_name, 
        u.school, 
        u.created_at, 
        u.last_login
      FROM users u
      ORDER BY u.created_at DESC
    `);
    
    // Récupérer les statistiques séparément pour éviter les ambiguïtés
    const users = [];
    for (const user of usersResult.rows) {
      const gradesStats = await pool.query(`
        SELECT 
          COUNT(*) as total_grades,
          AVG(grade) as average_grade
        FROM grades 
        WHERE user_id = $1
      `, [user.id]);
      
      users.push({
        ...user,
        total_grades: parseInt(gradesStats.rows[0]?.total_grades || 0),
        average_grade: Math.round(gradesStats.rows[0]?.average_grade || 0)
      });
    }
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('❌ Erreur GET users:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

app.put('/api/admin/users/:id/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const validRoles = ['student', 'professor', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: `Rôle invalide. Doit être: ${validRoles.join(', ')}` });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, parseInt(id)]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ Rôle changé: ${result.rows[0].email} -> ${role}`);
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erreur change role:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.delete('/api/admin/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, name', [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    console.log(`✅ Utilisateur supprimé: ${result.rows[0].name}`);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur DELETE user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/admin/statistics', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'student' THEN 1 END) as students,
        COUNT(CASE WHEN role = 'professor' THEN 1 END) as professors,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins
      FROM users
    `);
    
    const lessons = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_published THEN 1 END) as published,
        SUM(views) as total_views,
        SUM(downloads) as total_downloads
      FROM lessons
    `);
    
    const quizzes = await pool.query(`
      SELECT 
        COUNT(*) as total,
        AVG(score) as avg_score
      FROM quiz_attempts
    `);
    
    const grades = await pool.query(`
      SELECT 
        AVG(grade) as average_grade,
        COUNT(*) as total_grades,
        COUNT(CASE WHEN grade >= 60 THEN 1 END) as passed,
        COUNT(CASE WHEN grade < 60 THEN 1 END) as failed
      FROM grades
    `);
    
    const files = await pool.query(`
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        COUNT(CASE WHEN file_type = 'html' THEN 1 END) as html_files,
        COUNT(CASE WHEN file_type = 'css' THEN 1 END) as css_files,
        COUNT(CASE WHEN file_type = 'javascript' THEN 1 END) as js_files
      FROM uploaded_files
    `);
    
    res.json({ 
      success: true, 
      statistics: { 
        users: users.rows[0], 
        lessons: lessons.rows[0], 
        quizzes: quizzes.rows[0],
        grades: grades.rows[0],
        files: files.rows[0]
      } 
    });
  } catch (error) {
    console.error('Erreur GET statistics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.get('/api/admin/reports', protect, authorize('admin'), async (req, res) => {
  try {
    const { type = 'activity' } = req.query;
    let reportData = {};
    
    if (type === 'students') {
      const students = await pool.query(`
        SELECT id, name, email, class_name, created_at, last_login,
               (SELECT AVG(grade) FROM grades WHERE user_id = users.id) as average_grade
        FROM users WHERE role = 'student' ORDER BY name
      `);
      reportData = { students: students.rows };
    } else if (type === 'professors') {
      const professors = await pool.query(`
        SELECT id, name, email, created_at,
               (SELECT COUNT(*) FROM lessons WHERE created_by = users.id) as lessons_created
        FROM users WHERE role = 'professor' ORDER BY name
      `);
      reportData = { professors: professors.rows };
    } else if (type === 'grades') {
      const grades = await pool.query(`
        SELECT 
          AVG(grade) as average, MIN(grade) as min, MAX(grade) as max, COUNT(*) as total,
          COUNT(CASE WHEN exam_type = 'quiz' THEN 1 END) as quizzes,
          COUNT(CASE WHEN exam_type = 'exam' THEN 1 END) as exams,
          COUNT(CASE WHEN grade >= 60 THEN 1 END) as passed,
          COUNT(CASE WHEN grade < 60 THEN 1 END) as failed
        FROM grades
      `);
      reportData = { grades: grades.rows[0] };
    } else if (type === 'activity') {
      const activity = await pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as registrations
        FROM users 
        GROUP BY DATE(created_at) 
        ORDER BY date DESC 
        LIMIT 30
      `);
      reportData = { activity: activity.rows };
    } else if (type === 'full') {
      const users = await pool.query('SELECT COUNT(*) as total FROM users');
      const lessons = await pool.query('SELECT COUNT(*) as total FROM lessons');
      const quizzes = await pool.query('SELECT COUNT(*) as total FROM quizzes');
      const grades = await pool.query('SELECT COUNT(*) as total FROM grades');
      const files = await pool.query('SELECT COUNT(*) as total FROM uploaded_files');
      reportData = { 
        users: users.rows[0].total, 
        lessons: lessons.rows[0].total, 
        quizzes: quizzes.rows[0].total,
        grades: grades.rows[0].total,
        files: files.rows[0].total,
        generated_at: new Date().toISOString()
      };
    }
    
    res.json({ success: true, reports: reportData });
  } catch (error) {
    console.error('Erreur GET reports:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES USERS ====================
app.get('/api/users/profile', protect, async (req, res) => {
  try {
    const user = await pool.query(`
      SELECT id, name, email, role, avatar, bio, class_name, school, created_at, last_login
      FROM users WHERE id = $1
    `, [req.user.id]);
    
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT CASE WHEN ul.completed_at IS NOT NULL THEN ul.lesson_id END) as completed_count,
        COUNT(DISTINCT CASE WHEN ul.is_favorite THEN ul.lesson_id END) as favorites_count,
        COALESCE(AVG(ul.score), 0) as average_score,
        (SELECT COALESCE(AVG(grade), 0) FROM grades WHERE user_id = $1) as average_grade,
        (SELECT COUNT(*) FROM grades WHERE user_id = $1) as total_grades
      FROM user_lessons ul
      WHERE ul.user_id = $1
    `, [req.user.id]);
    
    res.json({ success: true, user: { ...user.rows[0], stats: stats.rows[0] } });
  } catch (error) {
    console.error('Erreur GET profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.put('/api/users/profile', protect, async (req, res) => {
  try {
    const { name, bio, avatar, class_name, school } = req.body;
    
    const result = await pool.query(`
      UPDATE users SET 
        name = COALESCE($1, name), 
        bio = COALESCE($2, bio), 
        avatar = COALESCE($3, avatar),
        class_name = COALESCE($4, class_name),
        school = COALESCE($5, school)
      WHERE id = $6 
      RETURNING id, name, email, role, avatar, bio, class_name, school
    `, [name, bio, avatar, class_name, school, req.user.id]);
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Erreur UPDATE profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/users/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }
    
    const avatarUrl = `http://localhost:5000/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE users SET avatar = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    
    res.json({ success: true, avatar: avatarUrl });
  } catch (error) {
    console.error('Erreur upload avatar:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/users/lesson/:id/complete', protect, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    const { score } = req.body;
    
    const result = await pool.query(`
      INSERT INTO user_lessons (user_id, lesson_id, completed_at, score)
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET completed_at = NOW(), score = $3
      RETURNING *
    `, [req.user.id, lessonId, score || null]);
    
    res.json({ success: true, progress: result.rows[0] });
  } catch (error) {
    console.error('Erreur complete lesson:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

app.post('/api/users/lesson/:id/favorite', protect, async (req, res) => {
  try {
    const lessonId = parseInt(req.params.id);
    
    const result = await pool.query(`
      INSERT INTO user_lessons (user_id, lesson_id, is_favorite)
      VALUES ($1, $2, true)
      ON CONFLICT (user_id, lesson_id) 
      DO UPDATE SET is_favorite = NOT user_lessons.is_favorite
      RETURNING is_favorite
    `, [req.user.id, lessonId]);
    
    res.json({ success: true, is_favorite: result.rows[0].is_favorite });
  } catch (error) {
    console.error('Erreur favorite:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES UPLOAD ====================
// GET /api/upload/files - Récupérer tous les fichiers
app.get('/api/upload/files', protect, async (req, res) => {
  try {
    const { file_type, search, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT f.*, u.name as uploader_name, u.avatar as uploader_avatar,
             l.title as lesson_title
      FROM uploaded_files f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN lessons l ON f.lesson_id = l.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    if (file_type) {
      query += ` AND f.file_type = $${paramCount++}`;
      values.push(file_type);
    }
    if (search) {
      query += ` AND (f.original_name ILIKE $${paramCount++} OR f.filename ILIKE $${paramCount++})`;
      values.push(`%${search}%`, `%${search}%`);
    }
    
    if (req.user.role !== 'admin') {
      query += ` AND (f.is_public = true OR f.user_id = $${paramCount++})`;
      values.push(req.user.id);
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const result = await pool.query(query, values);
    
    // Compter le total
    const countQuery = await pool.query(`
      SELECT COUNT(*) as total FROM uploaded_files f
      WHERE ${req.user.role !== 'admin' ? '(f.is_public = true OR f.user_id = $1)' : '1=1'}
    `, req.user.role !== 'admin' ? [req.user.id] : []);
    
    // Statistiques par type
    const stats = await pool.query(`
      SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size
      FROM uploaded_files
      GROUP BY file_type
    `);
    
    res.json({ 
      success: true, 
      files: result.rows,
      stats: stats.rows,
      total: parseInt(countQuery.rows[0]?.total || 0),
      page: parseInt(page),
      totalPages: Math.ceil((countQuery.rows[0]?.total || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('Erreur GET files:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/upload/recent - Fichiers récents
app.get('/api/upload/recent', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, u.name as uploader_name
      FROM uploaded_files f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.is_public = true OR f.user_id = $1
      ORDER BY f.created_at DESC
      LIMIT 10
    `, [req.user.id]);
    
    res.json({ success: true, files: result.rows });
  } catch (error) {
    console.error('Erreur GET recent files:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/upload/file/:id - Récupérer un fichier spécifique
app.get('/api/upload/file/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const result = await pool.query(`
      SELECT f.*, u.name as uploader_name
      FROM uploaded_files f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `, [fileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    const file = result.rows[0];
    
    // Vérifier les permissions
    if (!file.is_public && file.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    
    // Lire le contenu du fichier
    if (fs.existsSync(file.file_path)) {
      const content = fs.readFileSync(file.file_path, 'utf8');
      file.content = content;
    }
    
    res.json({ success: true, file });
  } catch (error) {
    console.error('Erreur GET file:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/upload/preview/:id - Aperçu du fichier
app.get('/api/upload/preview/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const result = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    const file = result.rows[0];
    
    if (!file.is_public && file.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    
    if (fs.existsSync(file.file_path)) {
      const content = fs.readFileSync(file.file_path, 'utf8');
      
      // Pour les fichiers HTML, CSS, JS, on renvoie le contenu
      if (file.file_type === 'html' || file.file_type === 'css' || file.file_type === 'javascript') {
        res.setHeader('Content-Type', file.mime_type || 'text/plain');
        res.send(content);
      } else {
        res.json({ 
          success: true, 
          preview: content.substring(0, 5000),
          file_type: file.file_type,
          original_name: file.original_name
        });
      }
    } else {
      res.status(404).json({ success: false, message: 'Fichier physique non trouvé' });
    }
  } catch (error) {
    console.error('Erreur preview:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES FICHIERS (COMPLÈTES) ====================

// UPLOAD FICHIER (Professeur ou Admin)
app.post('/api/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    let fileType = 'other';
    
    // Détection du type de fichier
    const typeMap = {
      '.html': 'html', '.htm': 'html',
      '.css': 'css',
      '.js': 'javascript', '.mjs': 'javascript',
      '.sql': 'sql', '.db': 'database',
      '.json': 'json',
      '.txt': 'text', '.md': 'text', '.rtf': 'text',
      '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.webp': 'image', '.svg': 'image',
      '.mp4': 'video', '.avi': 'video', '.mov': 'video', '.mkv': 'video', '.webm': 'video',
      '.pdf': 'document',
      '.zip': 'archive', '.rar': 'archive', '.7z': 'archive', '.tar': 'archive', '.gz': 'archive',
      '.doc': 'document', '.docx': 'document',
      '.xls': 'spreadsheet', '.xlsx': 'spreadsheet',
      '.ppt': 'presentation', '.pptx': 'presentation',
      '.mp3': 'audio', '.wav': 'audio', '.ogg': 'audio'
    };
    
    fileType = typeMap[ext] || 'other';
    
    // Statut selon le rôle
    const status = req.user.role === 'admin' ? 'approved' : 'pending';
    
    const result = await pool.query(
      `INSERT INTO uploaded_files 
       (filename, original_name, file_path, file_size, mime_type, file_type, user_id, status, is_public, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       RETURNING *`,
      [req.file.filename, req.file.originalname, req.file.path, req.file.size, req.file.mimetype, 
       fileType, req.user.id, status, status === 'approved']
    );
    
    console.log(`✅ Fichier uploadé: ${req.file.originalname} - Type: ${fileType} - Statut: ${status}`);
    
    res.status(201).json({ 
      success: true, 
      file: result.rows[0],
      message: status === 'pending' ? 'Fichier en attente d\'approbation' : 'Fichier approuvé'
    });
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/files - Récupérer tous les fichiers (avec filtres)
app.get('/api/files', protect, async (req, res) => {
  try {
    const { file_type, search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    let query = `
      SELECT f.*, u.name as uploader_name, u.avatar as uploader_avatar, u.role as uploader_role,
             a.name as approved_by_name
      FROM uploaded_files f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN users a ON f.approved_by = a.id
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;
    
    // Filtres
    if (file_type && file_type !== 'all') {
      query += ` AND f.file_type = $${paramCount++}`;
      values.push(file_type);
    }
    
    if (search) {
      query += ` AND (f.original_name ILIKE $${paramCount++} OR f.filename ILIKE $${paramCount++})`;
      values.push(`%${search}%`, `%${search}%`);
    }
    
    if (status && status !== 'all') {
      query += ` AND f.status = $${paramCount++}`;
      values.push(status);
    }
    
    // Permissions par rôle
    if (req.user.role === 'admin') {
      // Admin voit tout
      query += ` AND 1=1`;
    } else if (req.user.role === 'professor') {
      // Professeur voit ses fichiers + fichiers approuvés
      query += ` AND (f.user_id = $${paramCount++} OR f.status = 'approved')`;
      values.push(req.user.id);
    } else {
      // Étudiant voit seulement les fichiers approuvés et publics
      query += ` AND f.status = 'approved' AND f.is_public = true`;
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    values.push(parseInt(limit), offset);
    
    const result = await pool.query(query, values);
    
    // Compter le total
    let countQuery = `
      SELECT COUNT(*) as total FROM uploaded_files f
      WHERE 1=1
    `;
    if (req.user.role === 'student') {
      countQuery += ` AND f.status = 'approved' AND f.is_public = true`;
    } else if (req.user.role === 'professor') {
      countQuery += ` AND (f.user_id = $1 OR f.status = 'approved')`;
    }
    
    const countResult = await pool.query(countQuery, req.user.role === 'professor' ? [req.user.id] : []);
    
    // Statistiques par type (seulement fichiers visibles)
    const statsQuery = `
      SELECT file_type, COUNT(*) as count, SUM(file_size) as total_size
      FROM uploaded_files f
      WHERE ${req.user.role === 'student' ? "status = 'approved' AND is_public = true" : 
              req.user.role === 'professor' ? "(user_id = $1 OR status = 'approved')" : "1=1"}
      GROUP BY file_type
    `;
    const stats = await pool.query(statsQuery, req.user.role === 'professor' ? [req.user.id] : []);
    
    res.json({ 
      success: true, 
      files: result.rows,
      stats: stats.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      totalPages: Math.ceil((countResult.rows[0]?.total || 0) / parseInt(limit))
    });
  } catch (error) {
    console.error('❌ Erreur GET files:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});


// backend/server.js - Route téléchargement corrigée
app.get('/api/files/download/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (file.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    // Vérifier les permissions
    if (file.rows[0].status !== 'approved' && req.user.role !== 'admin' && file.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Fichier non disponible' });
    }
    
    // Incrémenter le compteur de téléchargements (vérifier si colonne existe)
    try {
      await pool.query('UPDATE uploaded_files SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1', [fileId]);
    } catch (err) {
      // Si colonne n'existe pas, ne pas bloquer le téléchargement
      console.log('⚠️ Colonne downloads manquante, skip increment');
    }
    
    // Envoyer le fichier
    res.download(file.rows[0].file_path, file.rows[0].original_name);
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/files/pending - Fichiers en attente d'approbation (Admin seulement)
app.get('/api/files/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, u.name as uploader_name, u.email as uploader_email, u.role as uploader_role
      FROM uploaded_files f
      LEFT JOIN users u ON f.user_id = u.id
      WHERE f.status = 'pending'
      ORDER BY f.created_at ASC
    `);
    
    res.json({ success: true, pending_files: result.rows });
  } catch (error) {
    console.error('❌ Erreur GET pending files:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/files/:id/approve - Approuver un fichier (Admin seulement)
app.put('/api/files/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    const { approved, rejection_reason } = req.body;
    
    const status = approved ? 'approved' : 'rejected';
    
    const result = await pool.query(`
      UPDATE uploaded_files 
      SET status = $1, 
          approved_by = $2, 
          approved_at = NOW(),
          is_public = $3,
          rejection_reason = $4
      WHERE id = $5
      RETURNING *
    `, [status, req.user.id, approved, rejection_reason || null, fileId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    console.log(`✅ Fichier ${approved ? 'approuvé' : 'rejeté'}: ${result.rows[0].original_name}`);
    
    res.json({ 
      success: true, 
      file: result.rows[0],
      message: approved ? 'Fichier approuvé' : 'Fichier rejeté'
    });
  } catch (error) {
    console.error('❌ Erreur approbation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/files/:id - Supprimer un fichier
app.delete('/api/files/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (file.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    // Vérifier les permissions
    if (req.user.role !== 'admin' && file.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }
    
    // Supprimer le fichier physique
    if (fs.existsSync(file.rows[0].file_path)) {
      fs.unlinkSync(file.rows[0].file_path);
    }
    
    await pool.query('DELETE FROM uploaded_files WHERE id = $1', [fileId]);
    
    res.json({ success: true, message: 'Fichier supprimé' });
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/files/download/:id - Télécharger un fichier
app.get('/api/files/download/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (file.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    // Vérifier les permissions de téléchargement
    if (file.rows[0].status !== 'approved' && req.user.role !== 'admin' && file.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Fichier non disponible' });
    }
    
    // Incrémenter le compteur de téléchargements
    await pool.query(
      'UPDATE uploaded_files SET downloads = COALESCE(downloads, 0) + 1 WHERE id = $1',
      [fileId]
    );
    
    res.download(file.rows[0].file_path, file.rows[0].original_name);
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});



// ==================== ROUTES NOTES ET RAPPORTS ====================

// POST /api/grades - Ajouter/modifier une note (professeur/admin)
// Dans server.js - Remplacer la route POST /api/grades
app.post('/api/grades', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { 
      user_id, lesson_id, quiz_id, grade, max_grade, 
      exam_type, comment, feedback, subject, exam_name, 
      exam_date, coefficient 
    } = req.body;
    
    if (!user_id || grade === undefined) {
      return res.status(400).json({ success: false, message: 'Utilisateur et note requis' });
    }
    
    // Vérifier si l'étudiant existe
    const studentCheck = await pool.query('SELECT id, name, class_name FROM users WHERE id = $1 AND role = $2', [user_id, 'student']);
    if (studentCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }
    
    // Vérifier si une note existe déjà
    let result;
    const existingGrade = await pool.query(`
      SELECT id FROM grades WHERE user_id = $1 AND (lesson_id = $2 OR $2 IS NULL) AND (quiz_id = $3 OR $3 IS NULL)
    `, [user_id, lesson_id || null, quiz_id || null]);
    
    if (existingGrade.rows.length > 0) {
      // Mettre à jour la note existante
      result = await pool.query(`
        UPDATE grades 
        SET grade = $1, 
            max_grade = $2,
            comment = $3, 
            feedback = $4, 
            exam_type = $5,
            subject = $6,
            exam_name = $7,
            exam_date = $8,
            coefficient = $9,
            graded_by = $10,
            graded_at = CURRENT_TIMESTAMP
        WHERE id = $11
        RETURNING *
      `, [grade, max_grade || 100, comment || null, feedback || null, exam_type || 'exam',
          subject || null, exam_name || null, exam_date || new Date(), coefficient || 1,
          req.user.id, existingGrade.rows[0].id]);
    } else {
      // Insérer une nouvelle note
      result = await pool.query(`
        INSERT INTO grades (user_id, lesson_id, quiz_id, grade, max_grade, exam_type, comment, feedback, graded_by, subject, exam_name, exam_date, coefficient)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [user_id, lesson_id || null, quiz_id || null, grade, max_grade || 100, 
          exam_type || 'exam', comment || null, feedback || null, req.user.id, 
          subject || null, exam_name || null, exam_date || new Date(), coefficient || 1]);
    }
    
    console.log(`✅ Note attribuée: ${studentCheck.rows[0].name} = ${grade}/${max_grade || 100} (${exam_type || 'exam'})`);
    
    res.status(201).json({ 
      success: true, 
      message: `Note ${grade}/${max_grade || 100} attribuée à ${studentCheck.rows[0].name}`,
      grade: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur attribution note:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/grades/my-grades - Notes de l'étudiant connecté
app.get('/api/grades/my-grades', protect, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.*, 
             l.title as lesson_title, l.subject as lesson_subject,
             q.title as quiz_title,
             u.name as teacher_name,
             ROUND((g.grade / g.max_grade) * 100, 1) as percentage,
             CASE 
               WHEN (g.grade / g.max_grade) * 100 >= 90 THEN 'A+'
               WHEN (g.grade / g.max_grade) * 100 >= 80 THEN 'A'
               WHEN (g.grade / g.max_grade) * 100 >= 70 THEN 'B'
               WHEN (g.grade / g.max_grade) * 100 >= 60 THEN 'C'
               WHEN (g.grade / g.max_grade) * 100 >= 50 THEN 'D'
               ELSE 'F'
             END as letter_grade
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN quizzes q ON g.quiz_id = q.id
      LEFT JOIN users u ON g.graded_by = u.id
      WHERE g.user_id = $1
      ORDER BY g.exam_date DESC, g.graded_at DESC
    `, [req.user.id]);
    
    // Statistiques générales
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_exams,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average_percentage,
        MAX((g.grade / g.max_grade) * 100) as best_score,
        MIN((g.grade / g.max_grade) * 100) as worst_score,
        COUNT(CASE WHEN (g.grade / g.max_grade) * 100 >= 60 THEN 1 END) as passed,
        COUNT(CASE WHEN (g.grade / g.max_grade) * 100 < 60 THEN 1 END) as failed
      FROM grades g
      WHERE g.user_id = $1
    `, [req.user.id]);
    
    // Performance par matière
    const subjectStats = await pool.query(`
      SELECT 
        COALESCE(g.subject, l.subject, 'Général') as subject,
        COUNT(*) as exam_count,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average,
        MAX((g.grade / g.max_grade) * 100) as best,
        MIN((g.grade / g.max_grade) * 100) as worst
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      WHERE g.user_id = $1
      GROUP BY COALESCE(g.subject, l.subject, 'Général')
      ORDER BY average DESC
    `, [req.user.id]);
    
    res.json({ 
      success: true, 
      grades: result.rows,
      stats: stats.rows[0],
      subjectStats: subjectStats.rows
    });
  } catch (error) {
    console.error('❌ Erreur GET my-grades:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/grades/students/:id - Notes d'un étudiant spécifique (professeur/admin)
app.get('/api/grades/students/:id', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);
    
    const student = await pool.query('SELECT id, name, class_name, email FROM users WHERE id = $1', [studentId]);
    if (student.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Étudiant non trouvé' });
    }
    
    const grades = await pool.query(`
      SELECT g.*, 
             l.title as lesson_title,
             q.title as quiz_title,
             u.name as teacher_name,
             ROUND((g.grade / g.max_grade) * 100, 1) as percentage
      FROM grades g
      LEFT JOIN lessons l ON g.lesson_id = l.id
      LEFT JOIN quizzes q ON g.quiz_id = q.id
      LEFT JOIN users u ON g.graded_by = u.id
      WHERE g.user_id = $1
      ORDER BY g.exam_date DESC, g.graded_at DESC
    `, [studentId]);
    
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_exams,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average_percentage,
        MAX((g.grade / g.max_grade) * 100) as best_score,
        MIN((g.grade / g.max_grade) * 100) as worst_score,
        COUNT(CASE WHEN (g.grade / g.max_grade) * 100 >= 60 THEN 1 END) as passed,
        COUNT(CASE WHEN (g.grade / g.max_grade) * 100 < 60 THEN 1 END) as failed
      FROM grades g
      WHERE g.user_id = $1
    `, [studentId]);
    
    res.json({ 
      success: true, 
      student: student.rows[0],
      grades: grades.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET student grades:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/grades/report/my - Rapport complet de l'étudiant connecté
app.get('/api/grades/report/my', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Informations étudiant
    const student = await pool.query('SELECT id, name, class_name, school FROM users WHERE id = $1', [userId]);
    
    // Toutes les notes
    const grades = await pool.query(`
      SELECT g.*, 
             ROUND((g.grade / g.max_grade) * 100, 1) as percentage,
             CASE 
               WHEN (g.grade / g.max_grade) * 100 >= 90 THEN 'Excellent'
               WHEN (g.grade / g.max_grade) * 100 >= 80 THEN 'Très bien'
               WHEN (g.grade / g.max_grade) * 100 >= 70 THEN 'Bien'
               WHEN (g.grade / g.max_grade) * 100 >= 60 THEN 'Assez bien'
               WHEN (g.grade / g.max_grade) * 100 >= 50 THEN 'Passable'
               ELSE 'Insuffisant'
             END as appreciation
      FROM grades g
      WHERE g.user_id = $1
      ORDER BY g.exam_date DESC
    `, [userId]);
    
    // Moyenne générale
    const overall = await pool.query(`
      SELECT 
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as overall_average,
        COUNT(*) as total_exams,
        COUNT(DISTINCT CASE WHEN g.exam_type = 'quiz' THEN 1 END) as quiz_count,
        COUNT(DISTINCT CASE WHEN g.exam_type = 'exam' THEN 1 END) as exam_count,
        COUNT(DISTINCT CASE WHEN g.exam_type = 'oral' THEN 1 END) as oral_count,
        COUNT(DISTINCT CASE WHEN g.exam_type = 'homework' THEN 1 END) as homework_count
      FROM grades g
      WHERE g.user_id = $1
    `, [userId]);
    
    // Performance par matière
    const bySubject = await pool.query(`
      SELECT 
        COALESCE(g.subject, 'Général') as subject,
        COUNT(*) as exam_count,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average,
        ROUND(AVG(g.grade), 1) as raw_average,
        ROUND(AVG(g.max_grade), 0) as max_average
      FROM grades g
      WHERE g.user_id = $1
      GROUP BY COALESCE(g.subject, 'Général')
      ORDER BY average DESC
    `, [userId]);
    
    // Performance par type d'examen
    const byType = await pool.query(`
      SELECT 
        g.exam_type,
        COUNT(*) as count,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average
      FROM grades g
      WHERE g.user_id = $1
      GROUP BY g.exam_type
      ORDER BY average DESC
    `, [userId]);
    
    // Évolution des notes dans le temps
    const evolution = await pool.query(`
      SELECT 
        DATE_TRUNC('month', g.exam_date) as month,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as monthly_average,
        COUNT(*) as exam_count
      FROM grades g
      WHERE g.user_id = $1
      GROUP BY DATE_TRUNC('month', g.exam_date)
      ORDER BY month DESC
      LIMIT 6
    `, [userId]);
    
    res.json({ 
      success: true, 
      report: {
        student: student.rows[0],
        grades: grades.rows,
        overall: overall.rows[0],
        by_subject: bySubject.rows,
        by_type: byType.rows,
        evolution: evolution.rows,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erreur GET report:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/grades/report/class - Rapport de classe (professeur/admin)
app.get('/api/grades/report/class', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const { class_name, subject } = req.query;
    
    let query = `
      SELECT 
        u.id, u.name, u.class_name,
        COUNT(g.id) as total_exams,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as average,
        ROUND(AVG(g.grade), 1) as raw_average,
        MAX((g.grade / g.max_grade) * 100) as best,
        MIN((g.grade / g.max_grade) * 100) as worst
      FROM users u
      LEFT JOIN grades g ON u.id = g.user_id
      WHERE u.role = 'student'
    `;
    const values = [];
    let paramCount = 1;
    
    if (class_name) {
      query += ` AND u.class_name = $${paramCount++}`;
      values.push(class_name);
    }
    if (subject) {
      query += ` AND (g.subject = $${paramCount++} OR g.subject = $${paramCount-1})`;
      values.push(subject);
    }
    
    query += ` GROUP BY u.id, u.name, u.class_name ORDER BY average DESC`;
    
    const students = await pool.query(query, values);
    
    // Statistiques de la classe
    const classStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_students,
        ROUND(AVG((g.grade / g.max_grade) * 100), 1) as class_average,
        ROUND(AVG(CASE WHEN g.grade >= (g.max_grade * 0.6) THEN 1 ELSE 0 END) * 100, 1) as pass_rate
      FROM users u
      LEFT JOIN grades g ON u.id = g.user_id
      WHERE u.role = 'student'
      ${class_name ? 'AND u.class_name = $1' : ''}
    `, class_name ? [class_name] : []);
    
    res.json({ 
      success: true, 
      students: students.rows,
      classStats: classStats.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur GET class report:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES EXAMENS AVANCÉS ====================

// GET /api/professor/quizzes/:id/responses - Voir les réponses des étudiants
app.get('/api/professor/quizzes/:id/responses', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    // Vérifier que le quiz appartient au professeur
    const quizCheck = await pool.query(
      'SELECT * FROM quizzes WHERE id = $1 AND created_by = $2',
      [quizId, req.user.id]
    );
    
    if (quizCheck.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    
    const quiz = quizCheck.rows[0] || (await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId])).rows[0];
    
    // Récupérer toutes les tentatives des étudiants
    let responses;
    
    if (quiz.exam_type === 'exam' || quiz.exam_type === 'assignment') {
      // Pour les examens écrits
      responses = await pool.query(`
        SELECT ea.*, u.name as student_name, u.email as student_email, u.avatar as student_avatar,
               u.class_name, u.school
        FROM exam_answers ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.quiz_id = $1
        ORDER BY ea.submitted_at DESC
      `, [quizId]);
    } else {
      // Pour les quiz à choix multiples
      responses = await pool.query(`
        SELECT qa.*, u.name as student_name, u.email as student_email, u.avatar as student_avatar,
               u.class_name, u.school,
               (SELECT COUNT(*) FROM quiz_responses qr WHERE qr.attempt_id = qa.id) as answered_count
        FROM quiz_attempts qa
        JOIN users u ON qa.user_id = u.id
        WHERE qa.quiz_id = $1
        ORDER BY qa.completed_at DESC
      `, [quizId]);
    }
    
    // Statistiques
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT user_id) as total_students,
        AVG(score) as average_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        COUNT(CASE WHEN score >= (SELECT passing_score FROM quizzes WHERE id = $1) THEN 1 END) as passed_count
      FROM ${quiz.exam_type === 'exam' ? 'exam_answers' : 'quiz_attempts'}
      WHERE quiz_id = $1
    `, [quizId]);
    
    res.json({ 
      success: true, 
      quiz,
      responses: responses.rows,
      stats: stats.rows[0]
    });
  } catch (error) {
    console.error('❌ Erreur récupération réponses:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/professor/quizzes - Créer un quiz avec fichiers pour les questions
app.post('/api/professor/quizzes', protect, authorize('professor', 'admin'), upload.single('exam_file'), async (req, res) => {
  try {
    const { 
      title, description, subject, time_limit, passing_score, 
      exam_type, max_attempts, allow_retry, instructions, questions
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, message: 'Titre requis' });
    }
    
    let examFilePath = null;
    let examFileName = null;
    
    if (req.file && (exam_type === 'exam' || exam_type === 'assignment')) {
      examFilePath = req.file.path;
      examFileName = req.file.originalname;
    }
    
    // Parser les questions
    let parsedQuestions = [];
    if (questions) {
      try {
        parsedQuestions = typeof questions === 'string' ? JSON.parse(questions) : questions;
      } catch (e) {
        console.error('Erreur parsing questions:', e);
      }
    }
    
    const result = await pool.query(`
      INSERT INTO quizzes (title, description, subject, time_limit, passing_score, 
                          exam_type, max_attempts, allow_retry, exam_file_path, exam_file_name,
                          instructions, created_by, is_published, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true, NOW())
      RETURNING *
    `, [title, description || '', subject || '', time_limit || 30, passing_score || 60,
        exam_type || 'quiz', max_attempts || 1, allow_retry === 'true' || allow_retry === true, 
        examFilePath, examFileName, instructions || null, req.user.id]);
    
    const quizId = result.rows[0].id;
    
    // Ajouter les questions avec support des fichiers
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      
      // Déterminer le type de question
      const questionType = q.file_path ? 'file' : (q.type || 'multiple_choice');
      
      await pool.query(`
        INSERT INTO quiz_questions (
          quiz_id, question_text, question_type, options, correct_answer, points, order_index,
          question_file_path, question_file_name, question_file_type
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        quizId, 
        q.text || (q.file_path ? 'Voir le document ci-dessous' : ''),
        questionType,
        JSON.stringify(q.options || []),
        q.correctAnswer || '',
        q.points || 1,
        i,
        q.file_path || null,
        q.file_name || null,
        q.file_type || null
      ]);
    }
    
    console.log(`✅ Quiz créé: ${title} avec ${parsedQuestions.length} questions`);
    
    res.status(201).json({ 
      success: true, 
      quiz: result.rows[0],
      message: 'Quiz créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur création quiz:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur: ' + error.message });
  }
});

// GET /api/professor/quizzes/:id/responses/:userId - Voir la réponse détaillée d'un étudiant
app.get('/api/professor/quizzes/:id/responses/:userId', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    
    const quiz = await pool.query('SELECT * FROM quizzes WHERE id = $1', [quizId]);
    
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    let response;
    let questions;
    
    if (quiz.rows[0].exam_type === 'exam' || quiz.rows[0].exam_type === 'assignment') {
      // Récupérer la réponse de l'examen écrit
      response = await pool.query(`
        SELECT ea.*, u.name as student_name, u.email as student_email
        FROM exam_answers ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.quiz_id = $1 AND ea.user_id = $2
      `, [quizId, userId]);
      
      questions = await pool.query(`
        SELECT id, question_text, points, order_index
        FROM quiz_questions
        WHERE quiz_id = $1
        ORDER BY order_index
      `, [quizId]);
    } else {
      // Récupérer la tentative du quiz
      response = await pool.query(`
        SELECT qa.*, u.name as student_name, u.email as student_email
        FROM quiz_attempts qa
        JOIN users u ON qa.user_id = u.id
        WHERE qa.quiz_id = $1 AND qa.user_id = $2
        ORDER BY qa.completed_at DESC
        LIMIT 1
      `, [quizId, userId]);
      
      if (response.rows.length > 0) {
        // Récupérer les réponses détaillées
        const detailedResponses = await pool.query(`
          SELECT qr.*, qq.question_text, qq.correct_answer, qq.points
          FROM quiz_responses qr
          JOIN quiz_questions qq ON qr.question_id = qq.id
          WHERE qr.attempt_id = $1
          ORDER BY qq.order_index
        `, [response.rows[0].id]);
        
        response.rows[0].detailed_answers = detailedResponses.rows;
      }
      
      questions = await pool.query(`
        SELECT id, question_text, options, correct_answer, points, order_index
        FROM quiz_questions
        WHERE quiz_id = $1
        ORDER BY order_index
      `, [quizId]);
    }
    
    res.json({ 
      success: true, 
      quiz: quiz.rows[0],
      response: response.rows[0] || null,
      questions: questions.rows
    });
  } catch (error) {
    console.error('❌ Erreur récupération réponse détaillée:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/professor/quizzes/:id/grade/:userId - Noter un examen écrit
app.post('/api/professor/quizzes/:id/grade/:userId', protect, authorize('professor', 'admin'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { score, feedback, max_score } = req.body;
    
    if (score === undefined) {
      return res.status(400).json({ success: false, message: 'Score requis' });
    }
    
    const result = await pool.query(`
      UPDATE exam_answers
      SET score = $1, feedback = $2, graded_by = $3, graded_at = NOW()
      WHERE quiz_id = $4 AND user_id = $5
      RETURNING *
    `, [score, feedback || null, req.user.id, quizId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Réponse non trouvée' });
    }
    
    // Enregistrer la note dans grades
    await pool.query(`
      INSERT INTO grades (user_id, quiz_id, grade, max_grade, exam_type, graded_by, comment, feedback)
      VALUES ($1, $2, $3, $4, 'exam', $5, $6, $7)
      ON CONFLICT (user_id, quiz_id) 
      DO UPDATE SET grade = $3, graded_at = CURRENT_TIMESTAMP, feedback = $7
    `, [userId, quizId, score, max_score || 100, req.user.id, `Examen noté: ${score}/${max_score || 100}`, feedback]);
    
    console.log(`✅ Examen noté: étudiant ${userId} - Score: ${score}`);
    
    res.json({ success: true, message: 'Note enregistrée', grade: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur notation examen:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/quizzes/:id/submit-exam - Soumettre un examen écrit (fichier ou texte)
app.post('/api/quizzes/:id/submit-exam', protect, upload.single('answer_file'), async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    const { answer_text } = req.body;
    
    // Vérifier le nombre de tentatives
    const quiz = await pool.query('SELECT max_attempts, allow_retry, title FROM quizzes WHERE id = $1', [quizId]);
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    // Compter les tentatives existantes
    const attemptsCount = await pool.query(
      'SELECT COUNT(*) FROM exam_answers WHERE quiz_id = $1 AND user_id = $2',
      [quizId, req.user.id]
    );
    
    const maxAttempts = quiz.rows[0].max_attempts || 1;
    const allowRetry = quiz.rows[0].allow_retry;
    const currentAttempts = parseInt(attemptsCount.rows[0].count);
    
    if (!allowRetry && currentAttempts >= maxAttempts) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà soumis cet examen. Les tentatives multiples ne sont pas autorisées.' });
    }
    
    if (currentAttempts >= maxAttempts) {
      return res.status(400).json({ success: false, message: `Nombre maximum de tentatives atteint (${maxAttempts})` });
    }
    
    let answerFilePath = null;
    let answerFileName = null;
    
    if (req.file) {
      answerFilePath = req.file.path;
      answerFileName = req.file.originalname;
    }
    
    const result = await pool.query(`
      INSERT INTO exam_answers (quiz_id, user_id, answer_text, answer_file_path, answer_file_name, submitted_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `, [quizId, req.user.id, answer_text || null, answerFilePath, answerFileName]);
    
    console.log(`📝 Examen soumis: étudiant ${req.user.id} - Quiz ${quizId}`);
    
    res.json({ success: true, message: 'Examen soumis avec succès', submission: result.rows[0] });
  } catch (error) {
    console.error('❌ Erreur soumission examen:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/quizzes/:id/check-attempt - Vérifier si l'étudiant peut encore tenter le quiz
app.get('/api/quizzes/:id/check-attempt', protect, async (req, res) => {
  try {
    const quizId = parseInt(req.params.id);
    
    const quiz = await pool.query(
      'SELECT max_attempts, allow_retry, exam_type, time_limit FROM quizzes WHERE id = $1',
      [quizId]
    );
    
    if (quiz.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Quiz non trouvé' });
    }
    
    let attemptsCount = 0;
    
    if (quiz.rows[0].exam_type === 'exam') {
      const result = await pool.query(
        'SELECT COUNT(*) FROM exam_answers WHERE quiz_id = $1 AND user_id = $2',
        [quizId, req.user.id]
      );
      attemptsCount = parseInt(result.rows[0].count);
    } else {
      const result = await pool.query(
        'SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = $1 AND user_id = $2',
        [quizId, req.user.id]
      );
      attemptsCount = parseInt(result.rows[0].count);
    }
    
    const maxAttempts = quiz.rows[0].max_attempts || 1;
    const canAttempt = quiz.rows[0].allow_retry ? attemptsCount < maxAttempts : attemptsCount === 0;
    
    res.json({ 
      success: true, 
      can_attempt: canAttempt,
      attempts_count: attemptsCount,
      max_attempts: maxAttempts,
      allow_retry: quiz.rows[0].allow_retry,
      time_limit: quiz.rows[0].time_limit
    });
  } catch (error) {
    console.error('❌ Erreur vérification tentative:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== ROUTES DE PRÉVISUALISATION DE FICHIERS ====================

// GET /api/files/preview/:id - Prévisualiser un fichier
app.get('/api/files/preview/:id', protect, async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    
    const file = await pool.query('SELECT * FROM uploaded_files WHERE id = $1', [fileId]);
    
    if (file.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
    }
    
    const fileData = file.rows[0];
    
    // Vérifier les permissions
    if (fileData.status !== 'approved' && req.user.role !== 'admin' && fileData.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }
    
    const filePath = fileData.file_path;
    const ext = path.extname(fileData.original_name).toLowerCase();
    const mimeType = fileData.mime_type || getMimeType(ext);
    
    // Lire le fichier
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Fichier physique non trouvé' });
    }
    
    // Pour les fichiers texte, HTML, CSS, JS, etc. - renvoyer le contenu
    const textExtensions = ['.txt', '.html', '.htm', '.css', '.js', '.json', '.xml', '.md', '.csv', '.sql'];
    if (textExtensions.includes(ext)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return res.json({ 
        success: true, 
        type: 'text',
        content: content,
        fileName: fileData.original_name,
        fileSize: fileData.file_size,
        mimeType: mimeType
      });
    }
    
    // Pour les PDF - renvoyer l'URL
    if (ext === '.pdf') {
      return res.json({ 
        success: true, 
        type: 'pdf',
        url: `/uploads/${fileData.filename}`,
        fileName: fileData.original_name,
        fileSize: fileData.file_size
      });
    }
    
    // Pour les images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    if (imageExtensions.includes(ext)) {
      return res.json({ 
        success: true, 
        type: 'image',
        url: `/uploads/${fileData.filename}`,
        fileName: fileData.original_name,
        fileSize: fileData.file_size
      });
    }
    
    // Pour les vidéos
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
    if (videoExtensions.includes(ext)) {
      return res.json({ 
        success: true, 
        type: 'video',
        url: `/uploads/${fileData.filename}`,
        fileName: fileData.original_name,
        fileSize: fileData.file_size
      });
    }
    
    // Pour Excel, Word, PowerPoint - utiliser Google Docs Viewer ou Office Online
    const officeExtensions = ['.xls', '.xlsx', '.doc', '.docx', '.ppt', '.pptx'];
    if (officeExtensions.includes(ext)) {
      const fileUrl = `http://localhost:5000/uploads/${fileData.filename}`;
      const encodedUrl = encodeURIComponent(fileUrl);
      
      // Google Docs Viewer (gratuit, pas besoin d'API)
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
      
      return res.json({ 
        success: true, 
        type: 'office',
        viewerUrl: googleViewerUrl,
        downloadUrl: fileUrl,
        fileName: fileData.original_name,
        fileSize: fileData.file_size,
        ext: ext
      });
    }
    
    // Pour les archives (ZIP, RAR) - juste téléchargement
    const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz'];
    if (archiveExtensions.includes(ext)) {
      return res.json({ 
        success: true, 
        type: 'archive',
        downloadUrl: `/uploads/${fileData.filename}`,
        fileName: fileData.original_name,
        fileSize: fileData.file_size,
        message: 'Aperçu non disponible pour les archives. Téléchargez le fichier pour le consulter.'
      });
    }
    
    // Par défaut - téléchargement seulement
    return res.json({ 
      success: true, 
      type: 'download',
      downloadUrl: `/uploads/${fileData.filename}`,
      fileName: fileData.original_name,
      fileSize: fileData.file_size
    });
    
  } catch (error) {
    console.error('❌ Erreur preview:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour obtenir le MIME type
function getMimeType(ext) {
  const mimeTypes = {
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.htm': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// ==================== DÉMARRAGE ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('\n📋 Routes disponibles:');
  console.log('   🔐 AUTH: /api/auth/login, /api/auth/register, /api/auth/me');
  console.log('   📚 LESSONS: /api/lessons, /api/lessons/:id');
  console.log('   👤 USERS: /api/users/profile, /api/users/avatar');
  console.log('   📊 GRADES: /api/grades/my-grades, /api/grades/my-report');
  console.log('   👑 ADMIN: /api/admin/users, /api/admin/statistics, /api/admin/reports');
  console.log('   👨‍🏫 PROFESSOR: /api/professor/students, /api/professor/grades, /api/professor/analytics');
  console.log('   💬 FORUM: /api/forum/categories, /api/forum/topics');
  console.log('   📝 QUIZ: /api/quizzes, /api/quizzes/:id/attempt');
  console.log('   📁 UPLOAD: /api/upload/files');
  console.log('\n🔑 Comptes de test:');
  console.log('   admin@school.com / admin123 (Admin)');
  console.log('   professor@school.com / professor123 (Professeur)');
  console.log('   student@school.com / student123 (Étudiant)');
  console.log('='.repeat(60) + '\n');
});