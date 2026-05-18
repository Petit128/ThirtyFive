// backend/middleware/auth.js (unifié)
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware d'authentification
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token manquant'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, name, email, role, avatar, bio, permissions, school, class_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!result.rows[0]) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};

// Middleware d'autorisation par rôle
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non authentifié'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Accès refusé - Nécessite le rôle: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware pour vérifier les permissions spécifiques
const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Non authentifié' });
    }

    const permissions = req.user.permissions || [];
    if (!permissions.includes(permission) && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `Permission '${permission}' requise`
      });
    }

    next();
  };
};

module.exports = { protect, authorize, hasPermission };