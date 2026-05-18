// src/pages/Quiz/QuizPage.jsx - Version avec fichiers visibles
import React, { useState, useEffect } from 'react';
import { quizService, examService } from '../../services/api';
import FileViewer from '../../components/FileViewer';
import { Eye, Download, FileText, Maximize2 } from 'lucide-react';
import './QuizPage.css';

const QuizPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [examAnswer, setExamAnswer] = useState('');
  const [examFile, setExamFile] = useState(null);
  const [submittingExam, setSubmittingExam] = useState(false);
  
  const [previewFile, setPreviewFile] = useState(null);
  const [examFilePreview, setExamFilePreview] = useState(null);
  const [fullscreenQuestion, setFullscreenQuestion] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (quizStarted && timeLeft === 0) {
      alert('⏰ Temps écoulé ! Soumission automatique...');
      if (selectedQuiz?.exam_type === 'exam') {
        handleSubmitExam();
      } else {
        handleSubmitQuiz();
      }
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizzes();
      setQuizzes(response.data.quizzes || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement quiz:', err);
      setError('Impossible de charger les quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    try {
      const checkResponse = await examService.checkAttempt(quiz.id);
      if (!checkResponse.data.can_attempt) {
        alert(`Vous ne pouvez plus tenter ce quiz. Tentatives: ${checkResponse.data.attempts_count}/${checkResponse.data.max_attempts}`);
        return;
      }
      
      setSelectedQuiz(quiz);
      setQuizStarted(true);
      setTimeLeft(quiz.time_limit * 60);
      setAnswers({});
      setExamAnswer('');
      setExamFile(null);
      setResult(null);
      setError(null);
      
      if (quiz.exam_type !== 'exam') {
        const response = await quizService.getQuiz(quiz.id);
        console.log('📋 Quiz chargé:', response.data.quiz);
        console.log('📎 Questions avec fichiers:', response.data.quiz.questions.filter(q => q.has_file));
        setSelectedQuiz(response.data.quiz);
      }
    } catch (err) {
      console.error('Erreur démarrage:', err);
      setError('Impossible de démarrer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length !== selectedQuiz.questions?.length) {
      alert(`Veuillez répondre à toutes les questions`);
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await quizService.submitAttempt(selectedQuiz.id, answers);
      setResult(response.data);
      setSelectedQuiz(null);
      setQuizStarted(false);
      fetchQuizzes();
    } catch (err) {
      console.error('Erreur soumission:', err);
      setError('Impossible de soumettre: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!examAnswer && !examFile) {
      alert('Veuillez fournir une réponse (texte ou fichier)');
      return;
    }
    
    try {
      setSubmittingExam(true);
      const formData = new FormData();
      if (examAnswer) formData.append('answer_text', examAnswer);
      if (examFile) formData.append('answer_file', examFile);
      
      await examService.submitExam(selectedQuiz.id, formData);
      alert('✅ Examen soumis avec succès');
      setSelectedQuiz(null);
      setQuizStarted(false);
      fetchQuizzes();
    } catch (err) {
      console.error('Erreur soumission examen:', err);
      setError('Impossible de soumettre: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingExam(false);
    }
  };

  // Fonction pour afficher une question avec fichier
  const renderQuestionFile = (question) => {
    if (!question.has_file && !question.question_file_path) return null;
    
    const fileUrl = question.file_url || `http://localhost:5000${question.question_file_path}`;
    const fileName = question.file_name || question.question_file_name || 'Document joint';
    
    return (
      <div className="question-file-container">
        <div className="question-file-header">
          <span className="file-badge">📎 Document joint</span>
          <span className="file-name">{fileName}</span>
          <div className="file-actions">
            <a href={fileUrl} download className="file-action-btn download">
              <Download size={14} /> Télécharger
            </a>
            <button 
              className="file-action-btn fullscreen"
              onClick={() => setFullscreenQuestion({ fileUrl, fileName })}
            >
              <Maximize2 size={14} /> Agrandir
            </button>
          </div>
        </div>
        
        <div className="file-preview-content">
          {fileUrl.endsWith('.pdf') && (
            <embed src={fileUrl} type="application/pdf" className="preview-embed" />
          )}
          
          {fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && (
            <img src={fileUrl} alt="Question" className="preview-image" />
          )}
          
          {fileUrl.match(/\.(txt|html|htm|css|js|json|xml|md)$/i) && (
            <iframe src={fileUrl} title="Contenu" className="preview-iframe" />
          )}
          
          {!fileUrl.endsWith('.pdf') && 
           !fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|txt|html|htm|css|js|json|xml|md)$/i) && (
            <div className="preview-placeholder-small">
              <FileText size={48} />
              <p>Aperçu non disponible pour ce type de fichier</p>
              <a href={fileUrl} download className="download-btn">Télécharger le fichier</a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="loading-spinner"></div>
          <p>Chargement des quiz...</p>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="quiz-page">
        <div className="quiz-container">
          <div className="result-card">
            <div className="result-header">
              <span className="result-icon">{result.passed ? '🏆' : '📚'}</span>
              <h2>{result.passed ? 'Félicitations !' : 'Quiz terminé'}</h2>
            </div>
            <div className="result-score">
              <div className="score-circle" style={{ 
                background: `conic-gradient(#4caf50 ${result.score * 3.6}deg, #e0e0e0 0deg)`
              }}>
                <span className="score-value">{result.score}%</span>
              </div>
            </div>
            <div className="result-details">
              <p>Score: {result.score}%</p>
              <p>Points: {result.earned_points}/{result.total_points}</p>
              <p>Statut: {result.passed ? '✅ Réussi' : '❌ Échec'}</p>
            </div>
            <button className="btn-close-result" onClick={() => setResult(null)}>
              Retour aux quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedQuiz) {
    // EXAMEN ÉCRIT
    if (selectedQuiz.exam_type === 'exam' || selectedQuiz.exam_type === 'assignment') {
      return (
        <div className="quiz-page">
          <div className="quiz-container">
            <div className="quiz-header">
              <div>
                <h2>{selectedQuiz.title}</h2>
                <p className="quiz-description">{selectedQuiz.description}</p>
              </div>
              <div className="timer">
                ⏱️ Temps restant: {formatTime(timeLeft)}
              </div>
            </div>

            <div className="exam-content">
              {selectedQuiz.exam_file_path && (
                <div className="exam-file">
                  <h3>📄 Document de l'examen</h3>
                  <div className="exam-file-actions">
                    <a href={`http://localhost:5000${selectedQuiz.exam_file_path}`} download className="download-exam-link">
                      <Download size={16} /> Télécharger le sujet
                    </a>
                    <button 
                      className="preview-exam-btn"
                      onClick={() => setPreviewFile({
                        url: `http://localhost:5000${selectedQuiz.exam_file_path}`,
                        fileName: selectedQuiz.exam_file_name
                      })}
                    >
                      <Eye size={16} /> Aperçu
                    </button>
                  </div>
                  
                  {selectedQuiz.exam_file_path.endsWith('.pdf') && (
                    <div className="pdf-preview-container">
                      <embed src={`http://localhost:5000${selectedQuiz.exam_file_path}#toolbar=0`} type="application/pdf" className="pdf-embed" />
                    </div>
                  )}
                  
                  {(selectedQuiz.exam_file_path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                    <div className="image-preview-container">
                      <img src={`http://localhost:5000${selectedQuiz.exam_file_path}`} alt="Aperçu du sujet" className="image-embed" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="exam-instructions">
                <h3>📝 Instructions</h3>
                <p>{selectedQuiz.instructions || 'Aucune instruction spécifique.'}</p>
              </div>
              
              <div className="exam-answer">
                <h3>✏️ Votre réponse</h3>
                <textarea
                  value={examAnswer}
                  onChange={(e) => setExamAnswer(e.target.value)}
                  rows="10"
                  placeholder="Écrivez votre réponse ici..."
                />
                
                <div className="file-upload">
                  <label>Ou déposez un fichier:</label>
                  <input type="file" onChange={(e) => setExamFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip" />
                  {examFile && (
                    <div className="selected-file">
                      <span className="file-name">📎 {examFile.name}</span>
                      <button 
                        className="preview-attachment-btn"
                        onClick={() => {
                          const url = URL.createObjectURL(examFile);
                          setExamFilePreview({ url: url, fileName: examFile.name });
                        }}
                      >
                        <Eye size={14} /> Aperçu
                      </button>
                    </div>
                  )}
                </div>
                
                <button className="btn-submit-exam" onClick={handleSubmitExam} disabled={submittingExam}>
                  {submittingExam ? 'Soumission...' : 'Soumettre l\'examen'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Modal preview */}
          {(examFilePreview || previewFile) && (
            <div className="modal-overlay" onClick={() => { setExamFilePreview(null); setPreviewFile(null); }}>
              <div className="preview-modal" onClick={e => e.stopPropagation()}>
                <div className="preview-modal-header">
                  <h3>Aperçu: {(examFilePreview?.fileName || previewFile?.fileName) || 'Fichier'}</h3>
                  <button onClick={() => { setExamFilePreview(null); setPreviewFile(null); }}>✕</button>
                </div>
                <div className="preview-modal-content">
                  {(examFilePreview?.url || previewFile?.url) && (
                    (examFilePreview?.url || previewFile?.url).endsWith('.pdf') ? (
                      <iframe src={examFilePreview?.url || previewFile?.url} title="Aperçu PDF" className="preview-iframe" />
                    ) : (examFilePreview?.url || previewFile?.url).match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={examFilePreview?.url || previewFile?.url} alt="Aperçu" className="preview-image" />
                    ) : (examFilePreview?.url || previewFile?.url).match(/\.(txt|html|css|js|json|xml)$/i) ? (
                      <iframe src={examFilePreview?.url || previewFile?.url} title="Aperçu texte" className="preview-iframe" />
                    ) : (
                      <div className="preview-placeholder">
                        <FileText size={48} />
                        <p>Aperçu non disponible pour ce type de fichier</p>
                        <a href={examFilePreview?.url || previewFile?.url} download className="download-btn">Télécharger</a>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // QUIZ À CHOIX MULTIPLES avec support des questions-fichiers
    if (selectedQuiz.questions && selectedQuiz.questions.length > 0) {
      const question = selectedQuiz.questions[currentQuestion];
      
      return (
        <div className="quiz-page">
          <div className="quiz-container">
            <div className="quiz-header">
              <div>
                <h2>{selectedQuiz.title}</h2>
                <p className="quiz-description">{selectedQuiz.description}</p>
              </div>
              <div className="quiz-info-header">
                <div className="timer">⏱️ {formatTime(timeLeft)}</div>
                <div className="quiz-progress">Question {currentQuestion + 1} / {selectedQuiz.questions.length}</div>
              </div>
            </div>

            <div className="quiz-content">
              <div className="question-section">
                {/* AFFICHAGE DU FICHIER SI LA QUESTION EN A UN */}
                {renderQuestionFile(question)}
                
                {/* TEXTE DE LA QUESTION */}
                {question.question_text && (
                  <h3 className="question-text">{question.question_text}</h3>
                )}
                
                {/* OPTIONS DE RÉPONSE */}
                {question.type === 'multiple_choice' && question.options && question.options.length > 0 && (
                  <div className="options">
                    {question.options.map((option, index) => (
                      <label key={index} className={`option ${answers[question.id] === option ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name={`question_${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={() => setAnswers({...answers, [question.id]: option})}
                        />
                        <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                        <span className="option-text">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                
                {question.type === 'true_false' && (
                  <div className="options truefalse-options">
                    <label className={`option ${answers[question.id] === 'Vrai' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value="Vrai"
                        checked={answers[question.id] === 'Vrai'}
                        onChange={() => setAnswers({...answers, [question.id]: 'Vrai'})}
                      />
                      <span>✅ Vrai</span>
                    </label>
                    <label className={`option ${answers[question.id] === 'Faux' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={`question_${question.id}`}
                        value="Faux"
                        checked={answers[question.id] === 'Faux'}
                        onChange={() => setAnswers({...answers, [question.id]: 'Faux'})}
                      />
                      <span>❌ Faux</span>
                    </label>
                  </div>
                )}
                
                {question.type === 'text' && (
                  <div className="text-answer">
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) => setAnswers({...answers, [question.id]: e.target.value})}
                      placeholder="Écrivez votre réponse ici..."
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <div className="quiz-footer">
                <div className="navigation">
                  <button className="btn-nav" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0}>
                    ← Précédent
                  </button>
                  {currentQuestion === selectedQuiz.questions.length - 1 ? (
                    <button className="btn-submit" onClick={handleSubmitQuiz} disabled={submitting}>
                      {submitting ? 'Soumission...' : '✓ Soumettre le quiz'}
                    </button>
                  ) : (
                    <button className="btn-nav" onClick={() => setCurrentQuestion(Math.min(selectedQuiz.questions.length - 1, currentQuestion + 1))}>
                      Suivant →
                    </button>
                  )}
                </div>
                <div className="answered-count">
                  {Object.keys(answers).length} / {selectedQuiz.questions.length} questions répondues
                </div>
              </div>
            </div>
          </div>
          
          {/* Modal plein écran pour les fichiers */}
          {fullscreenQuestion && (
            <div className="modal-overlay" onClick={() => setFullscreenQuestion(null)}>
              <div className="preview-modal fullscreen-modal" onClick={e => e.stopPropagation()}>
                <div className="preview-modal-header">
                  <h3>{fullscreenQuestion.fileName || 'Document'}</h3>
                  <div className="fullscreen-actions">
                    <a href={fullscreenQuestion.fileUrl} download className="download-fullscreen-btn">
                      <Download size={18} /> Télécharger
                    </a>
                    <button onClick={() => setFullscreenQuestion(null)}>✕</button>
                  </div>
                </div>
                <div className="preview-modal-content fullscreen-content">
                  {fullscreenQuestion.fileUrl && fullscreenQuestion.fileUrl.endsWith('.pdf') && (
                    <iframe src={fullscreenQuestion.fileUrl} title="PDF" className="fullscreen-iframe" />
                  )}
                  {fullscreenQuestion.fileUrl && fullscreenQuestion.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                    <img src={fullscreenQuestion.fileUrl} alt="Agrandi" className="fullscreen-image" />
                  )}
                  {fullscreenQuestion.fileUrl && fullscreenQuestion.fileUrl.match(/\.(txt|html|css|js|json|xml)$/i) && (
                    <iframe src={fullscreenQuestion.fileUrl} title="Texte" className="fullscreen-iframe" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="quiz-page">
      <div className="quiz-container">
        <h1>📝 Quiz et Examens</h1>

        {error && <div className="error-message">{error}</div>}

        <div className="quizzes-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h3>{quiz.title}</h3>
                <span className={`type-badge ${quiz.exam_type || 'quiz'}`}>
                  {quiz.exam_type === 'exam' ? '📝 Examen' : quiz.exam_type === 'assignment' ? '📄 Devoir' : '🎯 Quiz'}
                </span>
              </div>

              <p className="quiz-description">{quiz.description || 'Testez vos connaissances'}</p>

              <div className="quiz-info">
                <span>❓ {quiz.question_count || 0} questions</span>
                <span>⏱️ {quiz.time_limit || 30} min</span>
                <span>🎯 {quiz.passing_score || 60}% requis</span>
                <span>🔄 {quiz.max_attempts || 1} tentative(s)</span>
              </div>

              <div className="quiz-stats">
                {quiz.your_score !== null ? (
                  <div className="score">Votre score: <strong>{quiz.your_score}%</strong></div>
                ) : (
                  <div className="not-attempted">Pas encore tenté</div>
                )}
              </div>

              <button className="btn-start-quiz" onClick={() => handleStartQuiz(quiz)}>
                {quiz.your_score !== null ? '📖 Retenter' : '▶️ Commencer'}
              </button>
            </div>
          ))}
        </div>

        {quizzes.length === 0 && !loading && (
          <div className="no-quizzes">
            <p>Aucun quiz ou examen disponible pour le moment</p>
            <button className="btn-refresh" onClick={fetchQuizzes}>🔄 Actualiser</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;