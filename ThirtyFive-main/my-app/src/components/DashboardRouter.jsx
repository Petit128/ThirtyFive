// src/components/DashboardRouter.jsx (nouveau fichier)
import React from 'react';
import { Navigate } from 'react-router-dom';
import UserDashboard from '../pages/UserDashboard';
import AdminDashboard from '../pages/AdminDashboard';
import ProfessorDashboard from '../pages/ProfessorDashboard';

export default function DashboardRouter({ user, lessons, addLesson, deleteLesson }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'admin':
      return (
        <AdminDashboard 
          user={user} 
          lessons={lessons} 
          addLesson={addLesson} 
          deleteLesson={deleteLesson} 
        />
      );
    case 'professor':
      return <ProfessorDashboard user={user} />;
    case 'student':
    case 'user':
    default:
      return <UserDashboard user={user} lessons={lessons} />;
  }
}