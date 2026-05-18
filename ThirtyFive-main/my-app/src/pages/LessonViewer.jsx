// src/pages/LessonViewer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Download, Code, Heart, CheckCircle, Star } from 'lucide-react';
import { lessonService, userService } from '../services/api';
import './LessonViewer.css';

export default function LessonViewer({ lessons }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const loadLesson = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📖 Chargement leçon ID:', id);
        
        // Essayer de charger depuis l'API
        try {
          const response = await lessonService.getLesson(id);
          if (response.data?.lesson) {
            console.log('✅ Leçon chargée depuis API:', response.data.lesson.title);
            setLesson(response.data.lesson);
          } else {
            throw new Error('Pas de données API');
          }
        } catch (apiError) {
          console.log('⚠️ API non disponible, utilisation données locales');
          // Fallback vers les données locales
          const localLesson = lessons?.find(l => Number(l.id) === Number(id));
          if (localLesson) {
            setLesson(localLesson);
          } else {
            throw new Error('Leçon non trouvée');
          }
        }
      } catch (error) {
        console.error('❌ Erreur chargement:', error);
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
    navigate(-1);
  };

  const handleDownload = () => {
    if (!lesson) return;

    const content = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${lesson.title}</title>
    <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .content { margin-top: 20px; }
        ${lesson.css || ''}
    </style>
</head>
<body>
    <div class="container">
        <h1>${lesson.title}</h1>
        <div class="content">
            ${lesson.html_content || lesson.html || '<p>Contenu interactif</p>'}
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lesson.title.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = async () => {
    try {
      await userService.completeLesson(lesson.id);
      setIsCompleted(true);
      alert('✅ Leçon marquée comme terminée !');
    } catch (error) {
      console.error('Erreur complétion:', error);
    }
  };

  const handleFavorite = async () => {
    try {
      const res = await userService.toggleFavorite(lesson.id);
      setIsFavorite(res.data.is_favorite);
    } catch (error) {
      console.error('Erreur favori:', error);
    }
  };

  const handleRating = async (value) => {
    setRating(value);
    try {
      await lessonService.rateLesson(lesson.id, value);
      alert(`⭐ Merci pour votre note de ${value}/5 !`);
    } catch (error) {
      console.error('Erreur notation:', error);
    }
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
            onClick={handleFavorite}
            className={`header-btn ${isFavorite ? 'favorite' : ''}`}
          >
            <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} stroke={isFavorite ? '#ef4444' : 'currentColor'} />
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </button>
          
          <button 
            onClick={handleComplete}
            className={`header-btn ${isCompleted ? 'completed' : ''}`}
            disabled={isCompleted}
          >
            <CheckCircle size={18} />
            {isCompleted ? 'Terminé' : 'Marquer terminé'}
          </button>
          
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
        <div className="lesson-header">
          <span className="lesson-emoji">{lesson.emoji || '📚'}</span>
          <h1>{lesson.title}</h1>
        </div>
        
        <div className="lesson-meta">
          <span className="meta-item">{lesson.subject || 'Général'}</span>
          <span className="meta-item">{lesson.class_level || lesson.class || 'Tous niveaux'}</span>
          {lesson.downloads !== undefined && (
            <span className="meta-item">📥 {lesson.downloads} téléchargements</span>
          )}
          {lesson.views !== undefined && (
            <span className="meta-item">👁️ {lesson.views} vues</span>
          )}
          {lesson.rating > 0 && (
            <span className="meta-item">⭐ {lesson.rating}</span>
          )}
        </div>
        
        <p className="lesson-description">{lesson.description}</p>
        
        <div className="rating-section">
          <span>Note cette leçon :</span>
          <div className="stars">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                size={24}
                className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRating(star)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="simulation-container">
        {lesson.html_content ? (
          <iframe
            srcDoc={lesson.html_content}
            title={lesson.title}
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            className="simulation-iframe"
          />
        ) : lesson.file_path ? (
          <div className="file-content">
            <p>Fichier: {lesson.file_path}</p>
            <a href={`http://localhost:5000${lesson.file_path}`} download className="download-link">
              Télécharger le fichier
            </a>
          </div>
        ) : (
          <div className="no-content">
            <p>Aucun contenu interactif disponible</p>
            <p>Cette leçon est en cours de préparation.</p>
          </div>
        )}
      </div>

      {showCode && lesson.html_content && (
        <div className="code-panel">
          <h3>Code HTML</h3>
          <pre>{lesson.html_content}</pre>
        </div>
      )}
    </div>
  );
}