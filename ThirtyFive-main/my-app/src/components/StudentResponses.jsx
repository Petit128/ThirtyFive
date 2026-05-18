// src/components/StudentResponses.jsx - Version refondue
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Eye, Download, CheckCircle, XCircle, Clock, 
  User, Mail, Calendar, FileText, Award, 
  TrendingUp, Search, Filter, ChevronDown, ChevronUp,
  Star, BarChart3, ThumbsUp, AlertCircle
} from 'lucide-react';
import { professorService } from '../services/api';
import './StudentResponses.css';

export default function StudentResponses({ quizId, quizTitle, examType }) {
  const { isDark } = useTheme();
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('submitted_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    loadResponses();
  }, [quizId]);

  const loadResponses = async () => {
    setLoading(true);
    try {
      const res = await professorService.getQuizResponses(quizId);
      setResponses(res.data.responses || []);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
    } finally {
      setLoading(false);
    }
  };

  // src/components/StudentResponses.jsx
const handleGrade = async (userId, score, feedback) => {
  try {
    // Assurez-vous que quizId est défini
    if (!quizId) {
      console.error('❌ quizId manquant');
      alert('Erreur: ID du quiz manquant');
      return;
    }
    
    console.log('📝 Tentative de notation:', { quizId, userId, score, feedback });
    
    // URL CORRIGÉE: /api/professor/quizzes/:id/grade/:userId
    const response = await professorService.gradeExam(quizId, userId, { score, feedback });
    
    console.log('✅ Réponse:', response.data);
    alert('✅ Note enregistrée avec succès');
    loadResponses(); // Recharger les réponses
    setSelectedResponse(null);
  } catch (error) {
    console.error('❌ Erreur détaillée:', error);
    console.error('Response:', error.response?.data);
    alert('❌ Erreur lors de la notation: ' + (error.response?.data?.message || error.message));
  }
};

  const getScoreColor = (score) => {
    if (score === null) return '#94a3b8';
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score === null) return 'Non noté';
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Très bien';
    if (score >= 60) return 'Satisfaisant';
    if (score >= 40) return 'Insuffisant';
    return 'À améliorer';
  };

  const getStatusIcon = (score) => {
    if (score === null) return <Clock size={14} />;
    if (score >= 60) return <CheckCircle size={14} />;
    return <XCircle size={14} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredResponses = responses.filter(response => {
    const matchesSearch = response.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         response.student_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'graded' && response.score !== null) ||
      (filterStatus === 'pending' && response.score === null);
    return matchesSearch && matchesStatus;
  });

  const sortedResponses = [...filteredResponses].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'student_name') {
      aVal = a.student_name;
      bVal = b.student_name;
    }
    if (sortField === 'score') {
      aVal = a.score ?? -1;
      bVal = b.score ?? -1;
    }
    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  const totalStudents = responses.length;
  const gradedCount = responses.filter(r => r.score !== null).length;
  const averageScore = stats?.average_score || 
    (responses.length > 0 
      ? Math.round(responses.reduce((acc, r) => acc + (r.score || 0), 0) / responses.filter(r => r.score !== null).length)
      : 0);
  const passRate = stats?.passed_count ? Math.round((stats.passed_count / totalStudents) * 100) : 0;

  if (loading) {
    return (
      <div className="student-responses-loading">
        <div className="loading-spinner"></div>
        <p>Chargement des réponses...</p>
      </div>
    );
  }

  return (
    <div className={`student-responses ${isDark ? 'dark' : 'light'}`}>
      {/* En-tête avec statistiques */}
      <div className="responses-header">
        <div className="header-title">
          <h3>📋 Réponses des étudiants</h3>
          <p className="quiz-name">{quizTitle}</p>
        </div>
        <div className="stats-badges">
          <div className="stat-badge">
            <span className="stat-icon">📊</span>
            <span className="stat-value">{Math.round(averageScore)}%</span>
            <span className="stat-label">Moyenne</span>
          </div>
          <div className="stat-badge">
            <span className="stat-icon">✅</span>
            <span className="stat-value">{Math.round(passRate)}%</span>
            <span className="stat-label">Réussite</span>
          </div>
          <div className="stat-badge">
            <span className="stat-icon">📝</span>
            <span className="stat-value">{gradedCount}/{totalStudents}</span>
            <span className="stat-label">Notés</span>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="responses-filters">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un étudiant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="clear-search">
              ✕
            </button>
          )}
        </div>
        
        <div className="filter-select">
          <Filter size={18} />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tous les statuts</option>
            <option value="graded">Notés</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Tableau des réponses */}
      <div className="responses-table-wrapper">
        <table className="responses-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('student_name')}>
                Étudiant
                {sortField === 'student_name' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th className="sortable" onClick={() => handleSort('submitted_at')}>
                Date de soumission
                {sortField === 'submitted_at' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th className="sortable" onClick={() => handleSort('score')}>
                Score
                {sortField === 'score' && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
              </th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedResponses.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-row">
                  <div className="empty-state">
                    <FileText size={48} />
                    <p>Aucune réponse trouvée</p>
                    <small>Essayez de modifier vos filtres</small>
                  </div>
                </td>
              </tr>
            ) : (
              sortedResponses.map((response) => (
                <React.Fragment key={response.id}>
                  <tr className={`response-row ${response.score === null ? 'pending' : ''}`}>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          <img 
                            src={response.student_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(response.student_name)}&background=646cff&color=fff`} 
                            alt={response.student_name}
                          />
                        </div>
                        <div className="student-details">
                          <div className="student-name">{response.student_name}</div>
                          <div className="student-email">{response.student_email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        <span>{formatDate(response.submitted_at || response.completed_at)}</span>
                      </div>
                    </td>
                    <td>
                      {response.score !== null ? (
                        <div className="score-pill" style={{ background: getScoreColor(response.score) }}>
                          {response.score}%
                        </div>
                      ) : (
                        <div className="score-pill pending">—</div>
                      )}
                    </td>
                    <td>
                      <div className={`status-badge ${response.score === null ? 'pending' : (response.score >= 60 ? 'passed' : 'failed')}`}>
                        {getStatusIcon(response.score)}
                        <span>
                          {response.score === null ? 'En attente' : (response.score >= 60 ? 'Réussi' : 'Échec')}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn view"
                          onClick={() => setSelectedResponse(response)}
                          title="Voir la copie"
                        >
                          <Eye size={16} />
                        </button>
                        {response.answer_file_path && (
                          <a 
                            href={`http://localhost:5000/${response.answer_file_path}`} 
                            download 
                            className="action-btn download"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </a>
                        )}
                        <button 
                          className={`action-btn expand ${expandedRows[response.id] ? 'active' : ''}`}
                          onClick={() => toggleRowExpand(response.id)}
                          title="Détails"
                        >
                          {expandedRows[response.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[response.id] && (
                    <tr className="expanded-row">
                      <td colSpan="5">
                        <div className="expanded-content">
                          <div className="expanded-section">
                            <strong>✏️ Réponse</strong>
                            <p>{response.answer_text || 'Aucune réponse texte fournie'}</p>
                          </div>
                          {response.feedback && (
                            <div className="expanded-section feedback">
                              <strong>💬 Feedback</strong>
                              <p>{response.feedback}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de notation améliorée */}
      {selectedResponse && (
        <div className="modal-overlay" onClick={() => setSelectedResponse(null)}>
          <div className="grading-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-info">
                <div className="student-avatar-large">
                  <img 
                    src={selectedResponse.student_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedResponse.student_name)}&background=646cff&color=fff&size=128`} 
                    alt={selectedResponse.student_name}
                  />
                </div>
                <div>
                  <h3>{selectedResponse.student_name}</h3>
                  <p className="student-email-modal">{selectedResponse.student_email}</p>
                </div>
              </div>
              <button className="close-modal" onClick={() => setSelectedResponse(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Informations de soumission */}
              <div className="submission-card">
                <div className="submission-row">
                  <span className="submission-label">Date de soumission</span>
                  <span className="submission-value">{formatDate(selectedResponse.submitted_at || selectedResponse.completed_at)}</span>
                </div>
                {selectedResponse.score !== null && (
                  <div className="submission-row">
                    <span className="submission-label">Note actuelle</span>
                    <span className="submission-value score-value" style={{ color: getScoreColor(selectedResponse.score) }}>
                      {selectedResponse.score}% - {getScoreLabel(selectedResponse.score)}
                    </span>
                  </div>
                )}
              </div>

              {/* Réponse de l'étudiant */}
              <div className="answer-card">
                <div className="answer-header">
                  <FileText size={18} />
                  <span>Réponse de l'étudiant</span>
                </div>
                {selectedResponse.answer_text ? (
                  <div className="answer-text">
                    <p>{selectedResponse.answer_text}</p>
                  </div>
                ) : (
                  <div className="answer-empty">
                    <p>Aucune réponse texte fournie</p>
                  </div>
                )}
                
                {selectedResponse.answer_file_path && (
                  <div className="answer-file">
                    <a href={`http://localhost:5000/${selectedResponse.answer_file_path}`} download>
                      📎 Télécharger le fichier joint : {selectedResponse.answer_file_name}
                    </a>
                  </div>
                )}
              </div>

              {/* Formulaire de notation */}
              <div className="grading-card">
                <div className="grading-header">
                  <Award size={18} />
                  <span>Notation</span>
                </div>
                <div className="grading-form">
                  <div className="form-group">
                    <label>Note (sur 100)</label>
                    <input
                      type="number"
                      id="gradeScore"
                      min="0"
                      max="100"
                      defaultValue={selectedResponse.score || 0}
                      className="score-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Commentaire</label>
                    <textarea
                      id="gradeFeedback"
                      rows="3"
                      defaultValue={selectedResponse.feedback || ''}
                      placeholder="Ajoutez un commentaire personnalisé pour l'étudiant..."
                      className="feedback-input"
                    />
                  </div>
                  <button 
                    className="submit-btn"
                    onClick={() => {
                      const score = document.getElementById('gradeScore').value;
                      const feedback = document.getElementById('gradeFeedback').value;
                      if (score && !isNaN(score)) {
                        handleGrade(selectedResponse.user_id, parseInt(score), feedback);
                      } else {
                        alert('Veuillez entrer une note valide');
                      }
                    }}
                  >
                    <Award size={16} />
                    Enregistrer la note
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}