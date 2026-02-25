import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Download, Code } from 'lucide-react';
import { lessonService } from '../services/api';
import './LessonViewer.css';

export default function LessonViewer({ lessons }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📖 Chargement leçon avec ID:', id);
        
        const lessonId = parseInt(id);
        
        if (isNaN(lessonId)) {
          throw new Error('ID invalide');
        }

        // Chercher dans les leçons locales d'abord
        const localLesson = lessons.find(l => Number(l.id) === lessonId);
        if (localLesson) {
          console.log('✅ Leçon trouvée en local:', localLesson.title);
          setLesson(localLesson);
        }
        
        // Essayer de charger depuis le backend
        try {
          const response = await lessonService.getLesson(lessonId);
          console.log('✅ Leçon chargée depuis le backend:', response.data.lesson.title);
          setLesson(response.data.lesson);
        } catch (backendError) {
          console.log('⚠️ Pas de données backend, utilisation des données locales');
          if (!localLesson) {
            throw new Error('Leçon non trouvée');
          }
        }
        
      } catch (error) {
        console.error('❌ Erreur chargement leçon:', error);
        setError('Leçon non trouvée');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadLesson();
    }
  }, [id, lessons]);

  const handleGoBack = () => {
    // Retourner à la page précédente ou au dashboard
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleDownload = () => {
    if (!lesson) return;

    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>${lesson.title}</title>
    <meta charset="UTF-8">
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5; }
        .lesson-container { max-width: 1000px; margin: 0 auto; background: white; border-radius: 10px; padding: 20px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <div class="lesson-container">
        <h1>${lesson.title}</h1>
        <p>${lesson.description || ''}</p>
        <div class="simulation">
            ${lesson.html_content || lesson.html || ''}
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`lesson-viewer ${isDark ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de la leçon...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className={`lesson-viewer ${isDark ? 'dark' : 'light'}`}>
        <div className="error-container">
          <h2>❌ Leçon non trouvée</h2>
          <p>ID recherché: {id}</p>
          <p>Leçons disponibles: {lessons.map(l => l.id).join(', ')}</p>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            <ArrowLeft size={20} /> Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`lesson-viewer ${isDark ? 'dark' : 'light'}`}>
      <div className="viewer-header">
        <button onClick={handleGoBack} className="back-btn">
          <ArrowLeft size={20} /> Retour
        </button>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowCode(!showCode)} 
            className={`header-btn ${showCode ? 'active' : ''}`}
          >
            <Code size={18} /> {showCode ? 'Cacher le code' : 'Voir le code'}
          </button>
          <button onClick={handleDownload} className="header-btn download-btn">
            <Download size={18} /> Télécharger
          </button>
        </div>
      </div>

      <div className="lesson-info">
        <h1>{lesson.title}</h1>
        <div className="lesson-meta">
          <span className="meta-item">{lesson.subject || 'Général'}</span>
          <span className="meta-item">{lesson.class_level || lesson.class || 'Tous niveaux'}</span>
          {lesson.downloads !== undefined && (
            <span className="meta-item">📥 {lesson.downloads}</span>
          )}
          {lesson.rating > 0 && (
            <span className="meta-item">⭐ {lesson.rating}</span>
          )}
        </div>
        <p className="lesson-description">{lesson.description}</p>
      </div>

      <div className="simulation-container">
        {lesson.html_content ? (
          <iframe
            srcDoc={lesson.html_content}
            title={lesson.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
            className="simulation-iframe"
          />
        ) : (
          <div className="no-content">
            <p>Aucun contenu interactif disponible</p>
          </div>
        )}
      </div>

      {showCode && (
        <div className="code-panel">
          <h3>Code HTML</h3>
          <pre>{lesson.html_content || 'Aucun code disponible'}</pre>
        </div>
      )}
    </div>
  );
}