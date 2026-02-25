import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Play, Download, Star, Maximize2, Code, Eye } from 'lucide-react';
import './InteractiveLessonCard.css';

export default function InteractiveLessonCard({ lesson, onView }) {
  const { isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = () => {
    // Create a downloadable HTML file with the interactive content
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>${lesson.title}</title>
    <style>
        body { font-family: Arial; margin: 0; padding: 20px; background: #f0f0f0; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .simulation { margin: 20px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
        ${lesson.css || ''}
    </style>
</head>
<body>
    <div class="container">
        <h1>${lesson.title}</h1>
        <div class="simulation">
            ${lesson.html || '<div>Interactive content here</div>'}
        </div>
        <script>
            ${lesson.js || '// Interactive JavaScript'}
        </script>
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

  return (
    <div 
      className={`interactive-card ${isDark ? 'dark' : 'light'} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-preview">
        {lesson.preview ? (
          <div dangerouslySetInnerHTML={{ __html: lesson.preview }} />
        ) : (
          <div className="preview-placeholder">
            <span className="preview-emoji">{lesson.emoji || '🎮'}</span>
            <span className="preview-text">Interactive</span>
          </div>
        )}
        
        {isHovered && (
          <div className="preview-overlay">
            <button onClick={() => onView(lesson)} className="overlay-btn">
              <Eye size={20} /> View
            </button>
            <button onClick={handleDownload} className="overlay-btn">
              <Download size={20} /> Download
            </button>
          </div>
        )}
      </div>

      <div className="card-info">
        <h3>{lesson.title}</h3>
        <p className="card-subject">{lesson.subject} • {lesson.class}</p>
        
        <div className="card-meta">
          <span className="card-type">
            <Code size={14} /> Interactive
          </span>
          <span className="card-rating">
            <Star size={14} /> {lesson.rating || '4.5'}
          </span>
        </div>

        <div className="card-actions">
          <button onClick={() => onView(lesson)} className="action-btn primary">
            <Play size={16} /> Launch
          </button>
          <button onClick={handleDownload} className="action-btn secondary">
            <Download size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}