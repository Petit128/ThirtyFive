import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, Clock, Award, Search, Filter } from 'lucide-react';
import LessonCard from '../components/LessonCard';
import './UserDashboard.css';

export default function UserDashboard({ user, lessons }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLessons = lessons.filter(lesson => 
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`dashboard ${isDark ? 'dark' : 'light'}`}>
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p>Ready to learn something new today?</p>
        </div>
        <div className="stats-cards">
          <div className="stat-card">
            <BookOpen size={24} />
            <div>
              <span className="stat-value">{lessons.length}</span>
              <span className="stat-label">Lessons</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={24} />
            <div>
              <span className="stat-value">5</span>
              <span className="stat-label">Hours</span>
            </div>
          </div>
          <div className="stat-card">
            <Award size={24} />
            <div>
              <span className="stat-value">3</span>
              <span className="stat-label">Awards</span>
            </div>
          </div>
        </div>
      </div>

      <div className="search-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={20} />
          <select>
            <option>All Subjects</option>
            <option>Math</option>
            <option>Science</option>
            <option>Physics</option>
          </select>
        </div>
      </div>

      <section className="lessons-section">
        <h2>Available Lessons</h2>
        <div className="lessons-grid">
          {filteredLessons.map(lesson => (
            <div key={lesson.id} onClick={() => navigate(`/lesson/${lesson.id}`)}>
              <LessonCard lesson={lesson} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}