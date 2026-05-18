// src/pages/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, Clock, Award, Search, Filter, Grid, List, Star, TrendingUp, FolderOpen } from 'lucide-react';
import { lessonService } from '../services/api';
import './UserDashboard.css';
import FileLibrary from '../components/FileLibrary';

export default function UserDashboard({ user, lessons: initialLessons }) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' ou 'files'
  const [lessons, setLessons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [subjects, setSubjects] = useState([]);
  const [classLevels, setClassLevels] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const response = await lessonService.getLessons();
      const lessonsData = response.data.lessons || [];
      setLessons(lessonsData);
      
      const uniqueSubjects = [...new Set(lessonsData.map(l => l.subject).filter(Boolean))];
      const uniqueClasses = [...new Set(lessonsData.map(l => l.class_level || l.class).filter(Boolean))];
      const uniqueFileTypes = [...new Set(lessonsData.map(l => l.file_type).filter(Boolean))];
      
      setSubjects(uniqueSubjects);
      setClassLevels(uniqueClasses);
      setFileTypes(uniqueFileTypes);
    } catch (error) {
      console.error('Erreur chargement leçons:', error);
      setLessons(initialLessons || []);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    navigate(`/lesson/${lesson.id}`);
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchSearch = !searchTerm || 
      lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = !selectedSubject || lesson.subject === selectedSubject;
    const matchClass = !selectedClass || (lesson.class_level || lesson.class) === selectedClass;
    const matchFileType = !selectedFileType || lesson.file_type === selectedFileType;
    return matchSearch && matchSubject && matchClass && matchFileType;
  });

  const totalLessons = lessons.length;
  const averageRating = lessons.length > 0 
    ? (lessons.reduce((acc, l) => acc + (l.rating || 0), 0) / lessons.length).toFixed(1)
    : 0;

  return (
    <div className={`dashboard ${isDark ? 'dark' : 'light'}`}>
      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
        >
          <BookOpen size={18} /> Leçons
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FolderOpen size={18} /> Bibliothèque
        </button>
      </div>

      {activeTab === 'lessons' ? (
        <>
          <div className="welcome-section">
            <div className="welcome-text">
              <h1>Bienvenue, {user?.name || 'Étudiant'}! 👋</h1>
              <p>Explorez des leçons interactives et apprenez à votre rythme</p>
            </div>
            <div className="stats-cards">
              <div className="stat-card">
                <BookOpen size={24} />
                <div>
                  <span className="stat-value">{totalLessons}</span>
                  <span className="stat-label">Leçons disponibles</span>
                </div>
              </div>
              <div className="stat-card">
                <Award size={24} />
                <div>
                  <span className="stat-value">{averageRating}★</span>
                  <span className="stat-label">Note moyenne</span>
                </div>
              </div>
              <div className="stat-card">
                <TrendingUp size={24} />
                <div>
                  <span className="stat-value">100%</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
            </div>
          </div>

          <div className="filters-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Rechercher une leçon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <Filter size={18} />
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Toutes les matières</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Tous niveaux</option>
                {classLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              
              <select value={selectedFileType} onChange={(e) => setSelectedFileType(e.target.value)}>
                <option value="">Tous types</option>
                <option value="html">📄 HTML</option>
                <option value="css">🎨 CSS</option>
                <option value="javascript">⚡ JavaScript</option>
                <option value="document">📑 Document</option>
                <option value="video">🎥 Vidéo</option>
                <option value="image">🖼️ Image</option>
              </select>
            </div>
            
            <div className="view-toggle">
              <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                <Grid size={18} />
              </button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                <List size={18} />
              </button>
            </div>
          </div>

          <section className="lessons-section">
            <h2>📚 Leçons disponibles ({filteredLessons.length})</h2>
            
            {loading ? (
              <div className="loading-state">Chargement des leçons...</div>
            ) : filteredLessons.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <h3>Aucune leçon trouvée</h3>
                <p>Essayez de modifier votre recherche ou revenez plus tard</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="lessons-grid">
                {filteredLessons.map(lesson => (
                  <div key={lesson.id} className="lesson-card" onClick={() => handleLessonClick(lesson)}>
                    <div className="lesson-card-header">
                      <span className="lesson-emoji">{lesson.emoji || '📚'}</span>
                      {lesson.file_type && (
                        <span className="file-type-badge">
                          {lesson.file_type === 'html' && '📄 HTML'}
                          {lesson.file_type === 'css' && '🎨 CSS'}
                          {lesson.file_type === 'javascript' && '⚡ JS'}
                          {lesson.file_type === 'document' && '📑 PDF'}
                          {lesson.file_type === 'video' && '🎥 Vidéo'}
                        </span>
                      )}
                    </div>
                    <div className="lesson-card-body">
                      <h3>{lesson.title}</h3>
                      <div className="lesson-meta">
                        <span>{lesson.subject}</span>
                        <span>{lesson.class_level || lesson.class}</span>
                        {lesson.duration && <span>⏱️ {lesson.duration} min</span>}
                      </div>
                      <p className="lesson-description">{lesson.description?.substring(0, 100)}...</p>
                      <div className="lesson-footer">
                        <div className="lesson-stats">
                          <span>⭐ {lesson.rating || 'Nouveau'}</span>
                          <span>👁️ {lesson.views || 0}</span>
                          <span>📥 {lesson.downloads || 0}</span>
                        </div>
                        <button className="play-btn">Commencer</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="lessons-list">
                {filteredLessons.map(lesson => (
                  <div key={lesson.id} className="lesson-list-item" onClick={() => handleLessonClick(lesson)}>
                    <span className="list-emoji">{lesson.emoji || '📚'}</span>
                    <div className="list-info">
                      <h4>{lesson.title}</h4>
                      <p>{lesson.subject} • {lesson.class_level || lesson.class}</p>
                    </div>
                    <div className="list-stats">
                      <span>⭐ {lesson.rating || 'Nouveau'}</span>
                    </div>
                    <button className="play-btn">Voir</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="files-section">
          <FileLibrary userRole="student" canUpload={false} canApprove={false} />
        </div>
      )}
    </div>
  );
}