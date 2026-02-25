import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, user, allowedRole }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}