import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Upload, FileText, Code, Save, X } from 'lucide-react';
import { professorService } from '../services/api';
import './CreateLesson.css';

export default function CreateLesson({ addLesson }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [uploadMethod, setUploadMethod] = useState('file');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    class_level: '',
    emoji: '📚',
    html_content: '',
    htmlFile: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, htmlFile: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Le titre est requis');
      return;
    }
    
    setLoading(true);
    try {
      let lessonData;
      
      if (uploadMethod === 'file' && formData.htmlFile) {
        lessonData = {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          class_level: formData.class_level,
          emoji: formData.emoji,
          htmlFile: formData.htmlFile
        };
      } else {
        lessonData = {
          title: formData.title,
          description: formData.description,
          subject: formData.subject,
          class_level: formData.class_level,
          emoji: formData.emoji,
          html_content: formData.html_content || '<div>Contenu interactif</div>'
        };
      }
      
      await addLesson(lessonData);
      alert('✅ Leçon créée avec succès');
      navigate('/professor');
    } catch (error) {
      console.error('Erreur création:', error);
      alert('❌ Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`create-lesson ${isDark ? 'dark' : 'light'}`}>
      <div className="create-lesson-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/professor')}>
            <ArrowLeft size={20} /> Retour
          </button>
          <h1>📝 Créer une nouvelle leçon</h1>
        </div>

        <form onSubmit={handleSubmit} className="lesson-form">
          <div className="method-selector">
            <button 
              type="button"
              className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
              onClick={() => setUploadMethod('file')}
            >
              <Upload size={18} /> Upload HTML
            </button>
            <button 
              type="button"
              className={`method-btn ${uploadMethod === 'code' ? 'active' : ''}`}
              onClick={() => setUploadMethod('code')}
            >
              <Code size={18} /> Écrire le code
            </button>
          </div>

          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Ex: Introduction aux vagues"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Matière</label>
              <select value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})}>
                <option value="">Sélectionner</option>
                <option value="Mathématiques">Mathématiques</option>
                <option value="Physique">Physique</option>
                <option value="Chimie">Chimie</option>
                <option value="Biologie">Biologie</option>
                <option value="Informatique">Informatique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Niveau</label>
              <select value={formData.class_level} onChange={(e) => setFormData({...formData, class_level: e.target.value})}>
                <option value="">Sélectionner</option>
                <option value="Primaire">Primaire</option>
                <option value="Collège">Collège</option>
                <option value="Lycée">Lycée</option>
                <option value="Université">Université</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="3"
              placeholder="Décrivez ce que les étudiants vont apprendre..."
            />
          </div>

          {uploadMethod === 'file' ? (
            <div className="form-group">
              <label>Fichier HTML</label>
              <div className="file-dropzone">
                <input type="file" id="htmlFile" accept=".html,.htm" onChange={handleFileChange} />
                <label htmlFor="htmlFile">
                  <Upload size={32} />
                  <span>{formData.htmlFile ? formData.htmlFile.name : 'Cliquez pour uploader un fichier HTML'}</span>
                  {formData.htmlFile && (
                    <span className="file-size">({(formData.htmlFile.size / 1024).toFixed(2)} KB)</span>
                  )}
                </label>
              </div>
            </div>
          ) : (
            <div className="form-group">
              <label>Code HTML</label>
              <textarea
                value={formData.html_content}
                onChange={(e) => setFormData({...formData, html_content: e.target.value})}
                rows="10"
                placeholder="<div>Votre contenu HTML ici...</div>"
                className="code-editor"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/professor')}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer la leçon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}