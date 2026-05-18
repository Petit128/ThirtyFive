// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, user, allowedRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si allowedRole est un tableau, vérifier si le rôle de l'utilisateur est dans le tableau
  if (allowedRole) {
    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];
    if (!roles.includes(user.role)) {
      // Rediriger vers la page appropriée selon le rôle
      if (user.role === 'admin') {
        return <Navigate to="/admin" replace />;
      }
      if (user.role === 'professor') {
        return <Navigate to="/professor" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}