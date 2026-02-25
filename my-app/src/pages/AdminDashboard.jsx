import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Upload, BookOpen, Users, Download, Trash2, Eye, 
  Code, X, FileText, Plus, Edit, Star, Filter 
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({ user, lessons, addLesson, deleteLesson }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('lessons');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    class: '',
    description: '',
    html_content: '',
    htmlFile: null,
    emoji: '📚'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Filtrer les leçons
  const filteredLessons = lessons.filter(lesson => 
    lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const totalDownloads = lessons.reduce((acc, l) => acc + (l.downloads || 0), 0);
  const totalViews = lessons.reduce((acc, l) => acc + (l.views || 0), 0);
  
  const stats = [
    { 
      icon: <BookOpen size={24} />, 
      label: 'Total Lessons', 
      value: lessons.length,
      color: '#646cff',
      bgColor: 'rgba(100, 108, 255, 0.1)'
    },
    { 
      icon: <Download size={24} />, 
      label: 'Total Downloads', 
      value: totalDownloads,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    { 
      icon: <Eye size={24} />, 
      label: 'Total Views', 
      value: totalViews,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    { 
      icon: <Users size={24} />, 
      label: 'Students', 
      value: '156',
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 Fichier sélectionné:', file.name, 'Taille:', file.size, 'bytes');
      setFormData({ ...formData, htmlFile: file });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('📤 Soumission du formulaire');
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      const lessonData = {
        title: formData.title,
        subject: formData.subject,
        class_level: formData.class,
        description: formData.description,
        emoji: formData.emoji
      };
      
      if (uploadMethod === 'file' && formData.htmlFile) {
        lessonData.htmlFile = formData.htmlFile;
      } else {
        lessonData.html_content = formData.html_content || '<div>Contenu par défaut</div>';
      }
      
      await addLesson(lessonData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setShowUploadModal(false);
        setFormData({ 
          title: '', subject: '', class: '', 
          description: '', html_content: '', 
          htmlFile: null, emoji: '📚' 
        });
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePreview = () => {
    if (!formData.htmlFile && !formData.html_content) return;
    
    const previewWindow = window.open('', '_blank');
    
    if (formData.htmlFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewWindow.document.write(`
          <html>
            <head>
              <title>Aperçu - ${formData.title}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: system-ui; background: #f5f5f5; }
                .preview-container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              </style>
            </head>
            <body>
              <div class="preview-container">
                ${e.target.result}
              </div>
            </body>
          </html>
        `);
      };
      reader.readAsText(formData.htmlFile);
    } else {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Aperçu - ${formData.title}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: system-ui; background: #f5f5f5; }
              .preview-container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            </style>
          </head>
          <body>
            <div class="preview-container">
              ${formData.html_content}
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className={`admin-dashboard ${isDark ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>! Manage your educational content here.</p>
        </div>
        <button 
          className="create-btn"
          onClick={() => setShowUploadModal(true)}
        >
          <Plus size={18} />
          <span>Create New Lesson</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-card-modern">
            <div className="stat-icon" style={{ background: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Filter size={18} className="search-icon" />
        <input
          type="text"
          id="search-lessons"
          name="search-lessons"
          placeholder="Search lessons by title or subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="search-count">{filteredLessons.length} lessons</span>
      </div>

      {/* Lessons Grid */}
      <div className="lessons-grid-modern">
        {filteredLessons.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>No lessons found</h3>
            <p>Get started by creating your first interactive lesson</p>
            <button 
              className="create-btn"
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={16} /> Create Lesson
            </button>
          </div>
        ) : (
          filteredLessons.map(lesson => (
            <div key={lesson.id} className="lesson-card-modern">
              <div className="lesson-card-header">
                <span className="lesson-emoji-large">{lesson.emoji || '📚'}</span>
                <div className="lesson-badges">
                  {lesson.downloads > 0 && (
                    <span className="badge download">
                      <Download size={12} /> {lesson.downloads}
                    </span>
                  )}
                  {lesson.rating > 0 && (
                    <span className="badge rating">
                      <Star size={12} /> {lesson.rating}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="lesson-card-body">
                <h3>{lesson.title}</h3>
                <p className="lesson-meta">
                  <span>{lesson.subject}</span> • <span>{lesson.class || 'All levels'}</span>
                </p>
                <p className="lesson-description">{lesson.description || 'No description'}</p>
              </div>
              
              <div className="lesson-card-footer">
                <button 
                  className="action-btn view" 
                  onClick={() => window.open(`/lesson/${lesson.id}`, '_blank')}
                  title="View lesson"
                >
                  <Eye size={16} />
                </button>
                <button 
                  className="action-btn edit"
                  title="Edit lesson"
                >
                  <Edit size={16} />
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this lesson?')) {
                      deleteLesson(lesson.id);
                    }
                  }}
                  title="Delete lesson"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className={`modal-content ${isDark ? 'dark' : 'light'}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Interactive Lesson</h2>
              <button 
                className="close-btn" 
                onClick={() => !isUploading && setShowUploadModal(false)}
                disabled={isUploading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="method-selector">
              <button 
                className={`method-btn ${uploadMethod === 'file' ? 'active' : ''}`}
                onClick={() => setUploadMethod('file')}
                disabled={isUploading}
              >
                <Upload size={18} /> Upload HTML File
              </button>
              <button 
                className={`method-btn ${uploadMethod === 'text' ? 'active' : ''}`}
                onClick={() => setUploadMethod('text')}
                disabled={isUploading}
              >
                <FileText size={18} /> Enter HTML Code
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="lesson-title">Title *</label>
                  <input
                    type="text"
                    id="lesson-title"
                    name="lesson-title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="e.g., Introduction to Waves"
                    disabled={isUploading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lesson-subject">Subject</label>
                  <select
                    id="lesson-subject"
                    name="lesson-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    disabled={isUploading}
                  >
                    <option value="">Select subject</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lesson-class">Class Level</label>
                  <select
                    id="lesson-class"
                    name="lesson-class"
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    disabled={isUploading}
                  >
                    <option value="">Select level</option>
                    <option value="Primary">Primary</option>
                    <option value="Middle School">Middle School</option>
                    <option value="High School">High School</option>
                    <option value="University">University</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="lesson-description">Description</label>
                  <textarea
                    id="lesson-description"
                    name="lesson-description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Describe what students will learn..."
                    disabled={isUploading}
                  />
                </div>

                {uploadMethod === 'file' ? (
                  <div className="form-group full-width">
                    <label htmlFor="file-upload">HTML File</label>
                    <div className="file-dropzone">
                      <input
                        type="file"
                        id="file-upload"
                        name="file-upload"
                        accept=".html,.htm"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload">
                        <Upload size={32} />
                        <span>{formData.htmlFile ? formData.htmlFile.name : 'Click to upload or drag and drop'}</span>
                        {formData.htmlFile && (
                          <span className="file-size">
                            ({(formData.htmlFile.size / 1024).toFixed(2)} KB)
                          </span>
                        )}
                        <small>HTML files only • No size limit</small>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="form-group full-width">
                    <label htmlFor="lesson-html">HTML Code</label>
                    <textarea
                      id="lesson-html"
                      name="lesson-html"
                      value={formData.html_content}
                      onChange={(e) => setFormData({...formData, html_content: e.target.value})}
                      rows="10"
                      placeholder="Paste your HTML code here..."
                      disabled={isUploading}
                      className="code-textarea"
                    />
                  </div>
                )}
              </div>

              {/* Preview Button */}
              {(formData.htmlFile || formData.html_content) && !isUploading && (
                <div className="preview-section">
                  <button 
                    type="button" 
                    className="preview-btn" 
                    onClick={handlePreview}
                  >
                    <Eye size={16} /> Preview Lesson
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p>{uploadProgress}% • Uploading lesson...</p>
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn" 
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={isUploading || !formData.title}
                >
                  {isUploading ? 'Uploading...' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}