// src/pages/CreateQuiz.jsx - Version corrigée
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft, Plus, Trash2, Upload, FileText } from 'lucide-react';
import { professorService } from '../services/api';
import './CreateQuiz.css';

export default function CreateQuiz() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [examType, setExamType] = useState('quiz'); // 'quiz', 'exam', 'assignment'
  const [examFile, setExamFile] = useState(null);
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    subject: '',
    time_limit: 30,
    passing_score: 60,
    max_attempts: 1,
    allow_retry: false,
    instructions: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1
  });

  const addQuestion = () => {
    if (!currentQuestion.text) {
      alert('Veuillez saisir une question');
      return;
    }
    if (!currentQuestion.correctAnswer) {
      alert('Veuillez indiquer la réponse correcte');
      return;
    }
    
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, { ...currentQuestion, id: Date.now() }]
    });
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    });
  };

  const removeQuestion = (index) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index)
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setExamFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quiz.title) {
      alert('Le titre est requis');
      return;
    }
    
    if (examType === 'quiz' && quiz.questions.length === 0) {
      alert('Ajoutez au moins une question');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', quiz.title);
      formData.append('description', quiz.description);
      formData.append('subject', quiz.subject);
      formData.append('time_limit', quiz.time_limit);
      formData.append('passing_score', quiz.passing_score);
      formData.append('max_attempts', quiz.max_attempts);
      formData.append('allow_retry', quiz.allow_retry);
      formData.append('exam_type', examType);
      formData.append('instructions', quiz.instructions);
      
      if (examFile) {
        formData.append('exam_file', examFile);
      }
      
      if (examType === 'quiz') {
        formData.append('questions', JSON.stringify(quiz.questions));
      }
      
      await professorService.createQuiz(formData);
      alert('✅ Quiz/Examen créé avec succès');
      navigate('/professor');
    } catch (error) {
      console.error('Erreur création:', error);
      alert('❌ Erreur lors de la création: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`create-quiz ${isDark ? 'dark' : 'light'}`}>
      <div className="create-quiz-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/professor')}>
            <ArrowLeft size={20} /> Retour
          </button>
          <h1>📝 Créer un quiz/examen</h1>
        </div>

        <form onSubmit={handleSubmit} className="quiz-form">
          {/* Type selector */}
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
            <button 
              type="button"
              className={`type-btn ${examType === 'assignment' ? 'active' : ''}`}
              onClick={() => setExamType('assignment')}
            >
              <FileText size={18} /> Devoir
            </button>
          </div>

          <div className="form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={quiz.title}
              onChange={(e) => setQuiz({...quiz, title: e.target.value})}
              placeholder="Ex: Examen final - Chapitre 3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Matière</label>
              <select value={quiz.subject} onChange={(e) => setQuiz({...quiz, subject: e.target.value})}>
                <option value="">Sélectionner</option>
                <option value="Mathématiques">Mathématiques</option>
                <option value="Physique">Physique</option>
                <option value="Chimie">Chimie</option>
                <option value="Biologie">Biologie</option>
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
                <option value="Histoire">Histoire</option>
                <option value="Informatique">Informatique</option>
              </select>
            </div>
            <div className="form-group">
              <label>Temps imparti (minutes)</label>
              <input
                type="number"
                value={quiz.time_limit}
                onChange={(e) => setQuiz({...quiz, time_limit: parseInt(e.target.value)})}
                min="1"
                max="300"
              />
              <small>0 = pas de limite</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Score de réussite (%)</label>
              <input
                type="number"
                value={quiz.passing_score}
                onChange={(e) => setQuiz({...quiz, passing_score: parseInt(e.target.value)})}
                min="0"
                max="100"
              />
            </div>
            <div className="form-group">
              <label>Nombre de tentatives max</label>
              <input
                type="number"
                value={quiz.max_attempts}
                onChange={(e) => setQuiz({...quiz, max_attempts: parseInt(e.target.value)})}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={quiz.allow_retry}
                onChange={(e) => setQuiz({...quiz, allow_retry: e.target.checked})}
              />
              <span>Autoriser les tentatives multiples (max {quiz.max_attempts})</span>
            </label>
            <small className="help-text">
              {!quiz.allow_retry ? 'Une seule tentative autorisée' : `${quiz.max_attempts} tentatives maximum`}
            </small>
          </div>

          <div className="form-group">
            <label>Instructions</label>
            <textarea
              value={quiz.instructions}
              onChange={(e) => setQuiz({...quiz, instructions: e.target.value})}
              rows="3"
              placeholder="Instructions détaillées pour les étudiants..."
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={quiz.description}
              onChange={(e) => setQuiz({...quiz, description: e.target.value})}
              rows="2"
              placeholder="Description brève du quiz/examen..."
            />
          </div>

          {(examType === 'exam' || examType === 'assignment') && (
            <div className="form-group">
              <label>Fichier de l'examen (PDF, Word, Excel, TXT)</label>
              <div className="file-dropzone">
                <input type="file" id="examFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileChange} />
                <label htmlFor="examFile">
                  <Upload size={32} />
                  <span>{examFile ? examFile.name : 'Cliquez pour uploader le fichier d\'examen'}</span>
                  <small>PDF, Word, Excel, TXT acceptés</small>
                </label>
              </div>
            </div>
          )}

          {examType === 'quiz' && (
            <>
              <hr />
              <h3>📝 Questions ({quiz.questions.length})</h3>
              
              <div className="questions-list">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} className="question-item">
                    <div className="question-info">
                      <span className="q-num">{idx + 1}.</span>
                      <span className="q-text">{q.text.substring(0, 60)}</span>
                      <span className="q-points">{q.points} pt(s)</span>
                    </div>
                    <button type="button" className="remove-q" onClick={() => removeQuestion(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="add-question-section">
                <h4>➕ Ajouter une question</h4>
                
                <div className="form-group">
                  <label>Texte de la question</label>
                  <input
                    type="text"
                    value={currentQuestion.text}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                    placeholder="Ex: Quel est le résultat de 2 + 2 ?"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="options-group">
                  <label>Options</label>
                  {currentQuestion.options.map((opt, idx) => (
                    <div key={idx} className="option-input">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx] = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOpts});
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                      <button
                        type="button"
                        className={`set-correct ${currentQuestion.correctAnswer === opt ? 'active' : ''}`}
                        onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: opt})}
                      >
                        {currentQuestion.correctAnswer === opt ? '✓' : 'Définir'}
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="btn-add-question" onClick={addQuestion}>
                  <Plus size={16} /> Ajouter la question
                </button>
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/professor')}>
              Annuler
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Création...' : `Créer ${examType === 'exam' ? 'l\'examen' : examType === 'assignment' ? 'le devoir' : 'le quiz'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}