// src/pages/Grades/GradesPage.jsx - Version corrigée
import React, { useState, useEffect } from 'react';
import { gradeService } from '../../services/api';
import './GradesPage.css';

const GradesPage = () => {
  const [grades, setGrades] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('grades');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchGrades();
    fetchReport();
  }, []);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement des notes...');
      const response = await gradeService.getMyGrades();
      console.log('✅ Notes reçues:', response.data);
      setGrades(response.data.grades || []);
      setStats(response.data.stats || null);
      setError(null);
    } catch (err) {
      console.error('❌ Erreur lors du chargement des notes:', err);
      setError('Impossible de charger vos notes: ' + (err.response?.data?.message || err.message));
      
      // Données de test
      setGrades([
        {
          id: 1,
          lesson_title: 'Introduction aux waves',
          grade: 85,
          max_grade: 100,
          percentage: 85,
          letter_grade: 'B',
          graded_at: new Date().toISOString(),
          teacher_name: 'Prof. Martin'
        },
        {
          id: 2,
          quiz_title: 'Quiz Mathématiques',
          grade: 92,
          max_grade: 100,
          percentage: 92,
          letter_grade: 'A',
          graded_at: new Date().toISOString(),
          teacher_name: 'Prof. Bernard'
        }
      ]);
      setStats({
        total_exams: 2,
        average_percentage: 88.5,
        best_score: 92,
        worst_score: 85,
        passed: 2,
        failed: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      console.log('📈 Chargement du rapport...');
      const response = await gradeService.getMyReport();
      console.log('✅ Rapport reçu:', response.data);
      setReport(response.data.report || {});
    } catch (err) {
      console.error('❌ Erreur lors du chargement du rapport:', err);
      // Données de test
      setReport({
        overall: { overall_average: 88.5, total_exams: 2, passed_count: 2, failed_count: 0 },
        by_subject: [
          { subject: 'Mathématiques', average: 92, exam_count: 1 },
          { subject: 'Physique', average: 85, exam_count: 1 }
        ],
        by_type: [
          { exam_type: 'quiz', average: 92, count: 1 },
          { exam_type: 'exam', average: 85, count: 1 }
        ]
      });
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#2ecc71';
    if (percentage >= 80) return '#3498db';
    if (percentage >= 70) return '#f39c12';
    if (percentage >= 60) return '#e74c3c';
    return '#95a5a6';
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Très bien';
    if (percentage >= 70) return 'Bien';
    if (percentage >= 60) return 'Satisfaisant';
    return 'À améliorer';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  if (loading && grades.length === 0) {
    return (
      <div className="grades-page">
        <div className="grades-container">
          <div className="loading-spinner"></div>
          <p>Chargement de vos résultats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grades-page">
      <div className="grades-container">
        <h1>📊 Mes Résultats</h1>

        {error && <div className="error-message">{error}</div>}

        {/* Stats rapides */}
        {stats && (
          <div className="quick-stats">
            <div className="quick-stat">
              <span className="stat-icon">📈</span>
              <div>
                <span className="stat-value">{Math.round(stats.average_percentage || 0)}%</span>
                <span className="stat-label">Moyenne générale</span>
              </div>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">🏆</span>
              <div>
                <span className="stat-value">{stats.best_score || 0}%</span>
                <span className="stat-label">Meilleure note</span>
              </div>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">✅</span>
              <div>
                <span className="stat-value">{stats.passed || 0}</span>
                <span className="stat-label">Réussites</span>
              </div>
            </div>
            <div className="quick-stat">
              <span className="stat-icon">📝</span>
              <div>
                <span className="stat-value">{stats.total_exams || 0}</span>
                <span className="stat-label">Examens</span>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            📋 Mes Notes
          </button>
          <button
            className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            📈 Rapport détaillé
          </button>
        </div>

        {/* Grades Tab */}
        {activeTab === 'grades' && (
          <div className="grades-section">
            {grades.length > 0 ? (
              <div className="grades-grid">
                {grades.map((grade) => {
                  const percentage = grade.percentage || (grade.grade / grade.max_grade) * 100;
                  const color = getGradeColor(percentage);
                  
                  return (
                    <div key={grade.id} className="grade-card">
                      <div className="grade-header">
                        <div>
                          <h3>{grade.lesson_title || grade.quiz_title || 'Examen'}</h3>
                          <span className="grade-subject">{grade.lesson_subject || grade.subject || 'Général'}</span>
                        </div>
                        <span className="grade-type">
                          {grade.exam_type === 'quiz' ? '📝 Quiz' : grade.exam_type === 'exam' ? '📚 Examen' : '📄 Devoir'}
                        </span>
                      </div>

                      <div className="grade-display">
                        <div className="grade-circle" style={{ borderColor: color }}>
                          <div className="grade-value" style={{ color: color }}>
                            {Math.round(percentage)}%
                          </div>
                          <div className="grade-letter">{getLetterGrade(percentage)}</div>
                          <div className="grade-raw">{grade.grade}/{grade.max_grade}</div>
                        </div>
                      </div>

                      <div className="grade-info">
                        <div className="grade-label" style={{ color: color }}>
                          {getGradeLabel(percentage)}
                        </div>
                        <div className="grade-date">
                          📅 {new Date(grade.graded_at || grade.created_at).toLocaleDateString('fr-FR')}
                        </div>
                        {grade.teacher_name && (
                          <div className="grade-teacher">
                            👨‍🏫 {grade.teacher_name}
                          </div>
                        )}
                      </div>

                      {grade.comment && (
                        <div className="grade-feedback">
                          <strong>💬 Commentaire:</strong>
                          <p>{grade.comment}</p>
                        </div>
                      )}
                      
                      {grade.feedback && (
                        <div className="grade-feedback">
                          <strong>📝 Feedback:</strong>
                          <p>{grade.feedback}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-grades">
                <span className="empty-icon">📭</span>
                <p>Aucune note disponible pour le moment</p>
                <small>Les notes apparaîtront ici après avoir complété des quiz ou examens</small>
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="report-section">
            {report && report.overall ? (
              <>
                {/* Vue d'ensemble */}
                <div className="report-overview">
                  <div className="overall-score">
                    <div className="score-circle-large" style={{
                      background: `conic-gradient(#4caf50 ${(report.overall?.overall_average || 0) * 3.6}deg, #e0e0e0 0deg)`
                    }}>
                      <span className="score-value">{Math.round(report.overall?.overall_average || 0)}%</span>
                    </div>
                    <h3>Moyenne générale</h3>
                  </div>
                  <div className="overall-stats">
                    <div className="stat-item">
                      <span className="stat-icon">📝</span>
                      <div>
                        <strong>{report.overall?.total_exams || 0}</strong>
                        <small>Examens passés</small>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">✅</span>
                      <div>
                        <strong>{report.overall?.passed_count || 0}</strong>
                        <small>Réussis</small>
                      </div>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">❌</span>
                      <div>
                        <strong>{report.overall?.failed_count || 0}</strong>
                        <small>Échecs</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance par matière */}
                {report.by_subject && report.by_subject.length > 0 && (
                  <div className="report-section-card">
                    <h3>📚 Performance par matière</h3>
                    <div className="subject-performance">
                      {report.by_subject.map((subject, idx) => (
                        <div key={idx} className="subject-item">
                          <div className="subject-header">
                            <span className="subject-name">{subject.subject}</span>
                            <span className="subject-score" style={{ color: getGradeColor(subject.average) }}>
                              {Math.round(subject.average)}%
                            </span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${subject.average}%`, backgroundColor: getGradeColor(subject.average) }}
                            />
                          </div>
                          <div className="subject-stats">
                            <span>{subject.exam_count} examen(s)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance par type d'examen */}
                {report.by_type && report.by_type.length > 0 && (
                  <div className="report-section-card">
                    <h3>📊 Performance par type</h3>
                    <div className="type-performance">
                      {report.by_type.map((type, idx) => (
                        <div key={idx} className="type-card">
                          <span className="type-icon">
                            {type.exam_type === 'quiz' ? '📝' : type.exam_type === 'exam' ? '📚' : '📄'}
                          </span>
                          <div>
                            <div className="type-name">{type.exam_type === 'quiz' ? 'Quiz' : type.exam_type === 'exam' ? 'Examen' : 'Devoir'}</div>
                            <div className="type-score" style={{ color: getGradeColor(type.average) }}>
                              {Math.round(type.average)}% moyenne
                            </div>
                            <div className="type-count">{type.count} tentative(s)</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-report">
                <span className="empty-icon">📊</span>
                <p>Rapport non disponible pour le moment</p>
                <small>Complétez plus d'examens pour générer un rapport détaillé</small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradesPage;