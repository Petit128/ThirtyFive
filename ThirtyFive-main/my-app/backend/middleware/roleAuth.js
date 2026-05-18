// Middleware pour vérifier l'authentification et autorisation
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'edulearn',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'petit',
});

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token manquant'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
};

// Middleware d'autorisation par rôle
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Accès refusé pour ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: `Accès réservé aux rôles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

// Fonction pour obtenir l'utilisateur complet
const getUser = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, avatar, bio FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    return null;
  }
};

module.exports = {
  authMiddleware,
  authorize,
  getUser,
  pool
};
