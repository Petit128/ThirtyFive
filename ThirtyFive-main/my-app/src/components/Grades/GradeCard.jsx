// src/components/Grades/GradeCard.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function GradeCard({ grade }) {
  const { isDark } = useTheme();
  const percentage = (grade.grade / grade.max_grade) * 100;
  const gradeColor = percentage >= 80 ? '#4caf50' : percentage >= 60 ? '#ff9800' : '#f44336';

  return (
    <div className={`grade-card ${isDark ? 'dark' : 'light'}`}>
      <div className="grade-header">
        <h4>{grade.lesson_title || grade.quiz_title}</h4>
        <span className="grade-value" style={{ color: gradeColor }}>
          {grade.grade}/{grade.max_grade}
        </span>
      </div>
      
      <div className="grade-progress">
        <div 
          className="grade-progress-bar" 
          style={{ width: `${percentage}%`, backgroundColor: gradeColor }}
        />
      </div>
      
      <div className="grade-meta">
        <span>📅 {new Date(grade.graded_at).toLocaleDateString()}</span>
        {grade.teacher_name && <span>👨‍🏫 {grade.teacher_name}</span>}
      </div>
      
      {grade.comment && <p className="grade-comment">💬 {grade.comment}</p>}
    </div>
  );
}