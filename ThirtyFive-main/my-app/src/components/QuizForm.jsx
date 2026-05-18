// src/components/QuizForm.jsx - Version avec upload de fichiers pour questions
import React, { useState } from 'react';
import { Plus, Trash2, X, Upload, Eye } from 'lucide-react';
import { fileServiceAxios } from '../services/api';

export default function QuizForm({ onSubmit, initialData = null }) {
  const [quiz, setQuiz] = useState(initialData || {
    title: '',
    description: '',
    subject: '',
    time_limit: 30,
    passing_score: 60,
    difficulty: 'medium',
    questions: []
  });
  
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: 1,
    questionFile: null,
    questionFileName: '',
    questionFilePreview: null
  });
  
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleQuestionFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fileServiceAxios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setCurrentQuestion({
        ...currentQuestion,
        questionFile: response.data.file,
        questionFileName: file.name,
        questionFilePreview: URL.createObjectURL(file)
      });
    } catch (error) {
      console.error('Erreur upload fichier question:', error);
      alert('Erreur lors de l\'upload du fichier');
    } finally {
      setUploadingFile(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.text && !currentQuestion.questionFile) {
      alert('Veuillez saisir une question ou ajouter un fichier');
      return;
    }
    
    const newQuestion = {
      id: Date.now(),
      text: currentQuestion.text || 'Voir le fichier ci-dessous',
      type: currentQuestion.questionFile ? 'file' : currentQuestion.type,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      points: currentQuestion.points,
      file_path: currentQuestion.questionFile?.file_path,
      file_name: currentQuestion.questionFileName,
      file_type: currentQuestion.questionFile?.file_type
    };
    
    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion]
    });
    
    setCurrentQuestion({
      text: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1,
      questionFile: null,
      questionFileName: '',
      questionFilePreview: null
    });
  };

  const removeQuestion = (index) => {
    setQuiz({
      ...quiz,
      questions: quiz.questions.filter((_, i) => i !== index)
    });
  };

  const updateQuestionOption = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quiz.questions.length === 0) {
      alert('Ajoutez au moins une question');
      return;
    }
    onSubmit(quiz);
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <div className="form-group">
        <label>Titre du quiz *</label>
        <input
          type="text"
          value={quiz.title}
          onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
          required
          placeholder="Ex: Examen final - Chapitre 3"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Matière</label>
          <select value={quiz.subject} onChange={(e) => setQuiz({ ...quiz, subject: e.target.value })}>
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
          <label>Difficulté</label>
          <select value={quiz.difficulty} onChange={(e) => setQuiz({ ...quiz, difficulty: e.target.value })}>
            <option value="beginner">Débutant</option>
            <option value="medium">Intermédiaire</option>
            <option value="advanced">Avancé</option>
            <option value="expert">Expert</option>
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Temps limite (minutes)</label>
          <input
            type="number"
            value={quiz.time_limit}
            onChange={(e) => setQuiz({ ...quiz, time_limit: parseInt(e.target.value) })}
            min="1"
            max="180"
          />
        </div>
        <div className="form-group">
          <label>Score de réussite (%)</label>
          <input
            type="number"
            value={quiz.passing_score}
            onChange={(e) => setQuiz({ ...quiz, passing_score: parseInt(e.target.value) })}
            min="0"
            max="100"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={quiz.description}
          onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
          rows="3"
          placeholder="Instructions pour les étudiants..."
        />
      </div>

      <hr />

      <h3>📝 Questions ({quiz.questions.length})</h3>

      {/* Liste des questions existantes */}
      <div className="questions-list">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="question-item">
            <div className="question-header">
              <span className="question-num">Q{idx + 1}</span>
              <span className="question-text-preview">
                {q.type === 'file' ? `📎 ${q.file_name || 'Fichier joint'}` : q.text.substring(0, 60)}
              </span>
              <button type="button" className="remove-q" onClick={() => removeQuestion(idx)}>
                <Trash2 size={16} />
              </button>
            </div>
            <div className="question-details">
              <span>Type: {q.type === 'file' ? '📄 Fichier' : q.type === 'multiple_choice' ? 'QCM' : 'Texte'}</span>
              <span>Points: {q.points}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Ajouter une nouvelle question */}
      <div className="add-question">
        <h4>➕ Nouvelle question</h4>
        
        {/* Upload de fichier pour la question */}
        <div className="form-group">
          <label>Ou uploader un fichier comme question</label>
          <div className="file-dropzone">
            <input
              type="file"
              id="questionFile"
              onChange={handleQuestionFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.txt,.html,.css,.js"
              disabled={uploadingFile}
            />
            <label htmlFor="questionFile" className="upload-label">
              <Upload size={24} />
              <span>{currentQuestion.questionFileName || 'Cliquez pour uploader un fichier'}</span>
              {uploadingFile && <small>Upload en cours...</small>}
            </label>
          </div>
          {currentQuestion.questionFilePreview && (
            <div className="file-preview">
              <img src={currentQuestion.questionFilePreview} alt="Aperçu" className="file-thumb" />
              <button onClick={() => setCurrentQuestion({...currentQuestion, questionFile: null, questionFileName: '', questionFilePreview: null})}>
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label>Texte de la question (optionnel si fichier)</label>
          <input
            type="text"
            value={currentQuestion.text}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
            placeholder="Ex: Répondez aux questions basées sur le fichier ci-dessus"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Type de question</label>
            <select
              value={currentQuestion.type}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
              disabled={currentQuestion.questionFile !== null}
            >
              <option value="multiple_choice">QCM (Choix multiples)</option>
              <option value="true_false">Vrai/Faux</option>
              <option value="text">Réponse courte</option>
              <option value="file">Question basée sur fichier</option>
            </select>
          </div>
          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={currentQuestion.points}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
              min="1"
              max="10"
            />
          </div>
        </div>

        {currentQuestion.type === 'multiple_choice' && !currentQuestion.questionFile && (
          <div className="options-group">
            <label>Options de réponse</label>
            {currentQuestion.options.map((opt, idx) => (
              <div key={idx} className="option-input">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateQuestionOption(idx, e.target.value)}
                  placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                />
                <button
                  type="button"
                  className="set-correct"
                  onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: opt })}
                >
                  {currentQuestion.correctAnswer === opt ? '✓ Réponse' : 'Définir'}
                </button>
              </div>
            ))}
          </div>
        )}

        {currentQuestion.type === 'true_false' && !currentQuestion.questionFile && (
          <div className="truefalse-group">
            <label>Réponse correcte</label>
            <div className="tf-options">
              <button
                type="button"
                className={currentQuestion.correctAnswer === 'Vrai' ? 'active' : ''}
                onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'Vrai' })}
              >
                Vrai
              </button>
              <button
                type="button"
                className={currentQuestion.correctAnswer === 'Faux' ? 'active' : ''}
                onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 'Faux' })}
              >
                Faux
              </button>
            </div>
          </div>
        )}

        {currentQuestion.type === 'text' && !currentQuestion.questionFile && (
          <div className="form-group">
            <label>Réponse correcte (mot-clé)</label>
            <input
              type="text"
              value={currentQuestion.correctAnswer}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
              placeholder="Ex: 4"
            />
          </div>
        )}

        <button type="button" className="btn-add-question" onClick={addQuestion}>
          <Plus size={16} /> Ajouter la question
        </button>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit">
          {initialData ? 'Mettre à jour' : 'Créer le quiz'}
        </button>
      </div>
    </form>
  );
}