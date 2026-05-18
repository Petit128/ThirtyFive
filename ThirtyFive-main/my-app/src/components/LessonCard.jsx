import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Play, CheckCircle, Clock } from 'lucide-react';
import './LessonCard.css';

export default function LessonCard({ lesson }) {
  const { isDark } = useTheme();

  return (
    <div className={`lesson-card ${isDark ? 'dark' : 'light'} ${lesson.completed ? 'completed' : ''}`}>
      <div className="lesson-image">
        <span className="lesson-emoji">{lesson.image || '📚'}</span>
        {lesson.completed && <CheckCircle className="completed-badge" size={24} />}
      </div>
      <div className="lesson-content">
        <h3>{lesson.title}</h3>
        <p className="lesson-meta">
          <span className="lesson-class">{lesson.class}</span>
          <span className="lesson-subject">{lesson.subject}</span>
        </p>
        <div className="lesson-footer">
          <span className="lesson-duration">
            <Clock size={16} /> {lesson.duration || '15 min'}
          </span>
          <button className="play-lesson-btn">
            <Play size={16} /> {lesson.completed ? 'Review' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}