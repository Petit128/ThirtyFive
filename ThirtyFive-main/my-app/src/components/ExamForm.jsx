import React, { useState } from 'react';
import { Upload, FileText, Clock, Lock, Unlock } from 'lucide-react';

export default function ExamForm({ onSubmit, loading }) {
  const [examType, setExamType] = useState('quiz');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    time_limit: 60,
    passing_score: 60,
    max_attempts: 1,
    allow_retry: false,
    instructions: '',
    exam_file: null,
    questions: []
  });

  const handleFileChange = (e) => {
    setFormData({ ...formData, exam_file: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('subject', formData.subject);
    submitData.append('time_limit', formData.time_limit);
    submitData.append('passing_score', formData.passing_score);
    submitData.append('max_attempts', formData.max_attempts);
    submitData.append('allow_retry', formData.allow_retry);
    submitData.append('exam_type', examType);
    submitData.append('instructions', formData.instructions);
    
    if (formData.exam_file) {
      submitData.append('exam_file', formData.exam_file);
    }
    
    if (examType === 'quiz') {
      submitData.append('questions', JSON.stringify(formData.questions));
    }
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="exam-form">
      <div className="exam-type-selector">
        <button 
          type="button"
          className={`type-btn ${examType === 'quiz' ? 'active' : ''}`}
          onClick={() => setExamType('quiz')}
        >
          <FileText size={18} /> Quiz à choix multiples
        </button>
        <button 
          type="button"
          className={`type-btn ${examType === 'exam' ? 'active' : ''}`}
          onClick={() => setExamType('exam')}
        >
          <Upload size={18} /> Examen écrit
        </button>
      </div>

      <div className="form-group">
        <label>Titre *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
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
            <option value="Français">Français</option>
            <option value="Anglais">Anglais</option>
          </select>
        </div>
        <div className="form-group">
          <label>Temps imparti (minutes)</label>
          <input
            type="number"
            value={formData.time_limit}
            onChange={(e) => setFormData({...formData, time_limit: parseInt(e.target.value)})}
            min="1"
            max="300"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Score de réussite (%)</label>
          <input
            type="number"
            value={formData.passing_score}
            onChange={(e) => setFormData({...formData, passing_score: parseInt(e.target.value)})}
            min="0"
            max="100"
          />
        </div>
        <div className="form-group">
          <label>Nombre de tentatives max</label>
          <input
            type="number"
            value={formData.max_attempts}
            onChange={(e) => setFormData({...formData, max_attempts: parseInt(e.target.value)})}
            min="1"
            max="10"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.allow_retry}
            onChange={(e) => setFormData({...formData, allow_retry: e.target.checked})}
          />
          <span>Autoriser les tentatives multiples ({formData.max_attempts} max)</span>
        </label>
      </div>

      <div className="form-group">
        <label>Instructions</label>
        <textarea
          value={formData.instructions}
          onChange={(e) => setFormData({...formData, instructions: e.target.value})}
          rows="4"
          placeholder="Instructions détaillées pour les étudiants..."
        />
      </div>

      {examType === 'exam' && (
        <div className="form-group">
          <label>Fichier de l'examen (PDF, Word, Excel, TXT)</label>
          <div className="file-dropzone">
            <input type="file" id="examFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileChange} />
            <label htmlFor="examFile">
              <Upload size={32} />
              <span>{formData.exam_file ? formData.exam_file.name : 'Cliquez pour uploader le fichier d\'examen'}</span>
              <small>PDF, Word, Excel, TXT acceptés</small>
            </label>
          </div>
        </div>
      )}

      <button type="submit" className="btn-submit" disabled={loading}>
        {loading ? 'Création...' : `Créer ${examType === 'exam' ? 'l\'examen' : 'le quiz'}`}
      </button>
    </form>
  );
}