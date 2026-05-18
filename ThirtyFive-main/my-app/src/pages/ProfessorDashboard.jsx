// src/pages/ProfessorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Plus, Edit, Trash2, Users, FileText, BarChart3, 
  BookOpen, Upload, Save, X, Eye, CheckCircle, 
  Download, Search, Filter, Star, MessageCircle, 
  Settings, Award, TrendingUp, Calendar, PieChart,
  FileUp, FolderOpen, Image, Video, FileArchive, Code
} from 'lucide-react';
import { professorService, gradeService, quizService, forumService } from '../services/api';
import FileLibrary from '../components/FileLibrary';
import './ProfessorDashboard.css';
import StudentResponses from '../components/StudentResponses';
import { examService } from '../services/api';

export default function ProfessorDashboard({ user }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResponsesModal, setShowResponsesModal] = useState(false);
const [selectedQuizForResponses, setSelectedQuizForResponses] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  // Form states
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    user_id: '',
    lesson_id: '',
    grade: '',
    max_grade: 100,
    comment: '',
    feedback: '',
    exam_type: 'exam'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'students') {
        const res = await professorService.getStudents();
        setStudents(res.data.students || []);
      } else if (activeTab === 'analytics') {
        const res = await professorService.getAnalytics();
        setAnalytics(res.data.analytics);
      } else if (activeTab === 'lessons') {
        const res = await professorService.getMyLessons();
        setLessons(res.data.lessons || []);
      } else if (activeTab === 'quizzes') {
        const res = await professorService.getMyQuizzes();
        setQuizzes(res.data.quizzes || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentGrades = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await professorService.getStudentGrades(student.id);
      setStudentGrades(res.data.grades || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!gradeForm.user_id || !gradeForm.grade) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }
    
    try {
      await gradeService.addGrade({
        user_id: parseInt(gradeForm.user_id),
        lesson_id: gradeForm.lesson_id ? parseInt(gradeForm.lesson_id) : null,
        grade: parseInt(gradeForm.grade),
        max_grade: parseInt(gradeForm.max_grade),
        comment: gradeForm.comment,
        feedback: gradeForm.feedback,
        exam_type: gradeForm.exam_type
      });
      
      alert('✅ Note attribuée avec succès');
      setShowGradeModal(false);
      setGradeForm({ user_id: '', lesson_id: '', grade: '', max_grade: 100, comment: '', feedback: '', exam_type: 'exam' });
      
      if (selectedStudent) {
        const res = await professorService.getStudentGrades(selectedStudent.id);
        setStudentGrades(res.data.grades);
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      alert('❌ Erreur lors de l\'attribution de la note');
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return '#2ecc71';
    if (grade >= 75) return '#3498db';
    if (grade >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (

    <div className={`professor-dashboard ${isDark ? 'dark' : 'light'}`}>
      <div className="dashboard-header">
        <div>
          <h1>👨‍🏫 Tableau de bord Professeur</h1>
          <p>Bienvenue, {user?.name} ! Gérez vos étudiants, notes et contenus</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/professor/lessons/new')}>
            <Plus size={18} /> Nouvelle leçon
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
          <Users size={18} /> Étudiants
        </button>
        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={18} /> Analyses
        </button>
        <button className={activeTab === 'lessons' ? 'active' : ''} onClick={() => setActiveTab('lessons')}>
          <BookOpen size={18} /> Leçons
        </button>
        <button className={activeTab === 'quizzes' ? 'active' : ''} onClick={() => setActiveTab('quizzes')}>
          <FileText size={18} /> Quiz
        </button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>
          <FolderOpen size={18} /> Fichiers
        </button>
      </div>

      {/* ÉTUDIANTS - refonte tableau */}
      {activeTab === 'students' && (
        <div className="tab-panel">
          <div className="panel-header">
            <h2>📚 Liste des étudiants</h2>
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Rechercher un étudiant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Classe</th>
                  <th>Moyenne</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id}>
                    <td>
                      <img
                        src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=646cff&color=fff`}
                        alt={student.name}
                        className="student-avatar-table"
                        style={{ width: 40, height: 40, borderRadius: '50%' }}
                      />
                    </td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.class_name || 'Non assigné'}</td>
                    <td style={{ color: student.average_grade ? getGradeColor(student.average_grade) : '#888' }}>
                      {student.average_grade ? `${Math.round(student.average_grade)}%` : '—'}
                    </td>
                    <td>
                      <button onClick={() => handleViewStudentGrades(student)} className="btn-view">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => {
                        setGradeForm({ ...gradeForm, user_id: student.id });
                        setShowGradeModal(true);
                      }} className="btn-grade">
                        <Award size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="empty-students">
                <FileText size={48} />
                <p>Aucun étudiant trouvé</p>
              </div>
            )}
          </div>

          {/* Modal des notes d'un étudiant (inchangé) */}
          {selectedStudent && (
            <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>📋 Notes de {selectedStudent.name}</h2>
                  <button onClick={() => setSelectedStudent(null)}><X size={20} /></button>
                </div>
                <div className="student-stats">
                  <div className="stat">
                    <span className="stat-label">Moyenne</span>
                    <span className="stat-value" style={{ color: getGradeColor(studentGrades.reduce((acc, g) => acc + g.grade, 0) / (studentGrades.length || 1)) }}>
                      {Math.round(studentGrades.reduce((acc, g) => acc + g.grade, 0) / (studentGrades.length || 1))}%
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total évaluations</span>
                    <span className="stat-value">{studentGrades.length}</span>
                  </div>
                </div>
                <div className="grades-list">
                  {studentGrades.map(grade => (
                    <div key={grade.id} className="grade-item">
                      <div className="grade-info">
                        <span className="grade-title">{grade.lesson_title || grade.quiz_title || 'Examen'}</span>
                        <span className="grade-subject">{grade.lesson_subject || ''}</span>
                      </div>
                      <div className="grade-score" style={{ color: getGradeColor(grade.grade) }}>
                        {grade.grade}/{grade.max_grade}
                      </div>
                      <div className="grade-date">{new Date(grade.graded_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
                <button className="btn-add-grade" onClick={() => {
                  setGradeForm({ ...gradeForm, user_id: selectedStudent.id });
                  setShowGradeModal(true);
                  setSelectedStudent(null);
                }}>
                  <Plus size={16} /> Ajouter une note
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ANALYSES */}
      {activeTab === 'analytics' && analytics && (
        <div className="tab-panel">
          <h2>📊 Analyses de performances</h2>
          
          <div className="analytics-grid">
            <div className="stat-card">
              <h3><TrendingUp size={20} /> Moyenne générale</h3>
              <div className="stat-value" style={{ color: getGradeColor(analytics.classStats?.avg_score || 0) }}>
                {Math.round(analytics.classStats?.avg_score || 0)}%
              </div>
            </div>
            <div className="stat-card">
              <h3><Award size={20} /> Meilleure note</h3>
              <div className="stat-value" style={{ color: '#2ecc71' }}>
                {Math.round(analytics.classStats?.max_score || 0)}%
              </div>
            </div>
            <div className="stat-card">
              <h3><CheckCircle size={20} /> Taux de réussite</h3>
              <div className="stat-value">
                {analytics.classStats?.total_grades > 0 
                  ? Math.round((analytics.classStats.passed_count / analytics.classStats.total_grades) * 100) 
                  : 0}%
              </div>
            </div>
            <div className="stat-card">
              <h3><Users size={20} /> Étudiants</h3>
              <div className="stat-value">{analytics.classStats?.total_students || 0}</div>
            </div>
          </div>

          <div className="analytics-section">
            <h3>🏆 Top 10 des étudiants</h3>
            <div className="ranking-list">
              {analytics.topStudents?.map((student, idx) => (
                <div key={student.id} className="ranking-item">
                  <span className="rank">#{idx + 1}</span>
                  <span className="name">{student.name}</span>
                  <span className="class">{student.class_name}</span>
                  <span className="grade" style={{ color: getGradeColor(student.avg_grade) }}>
                    {Math.round(student.avg_grade)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="analytics-section">
            <h3>📈 Performance par matière</h3>
            <div className="subject-grid">
              {analytics.subjectPerformance?.map(subject => (
                <div key={subject.subject} className="subject-card">
                  <span className="subject-name">{subject.subject}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${subject.avg_grade}%`, backgroundColor: getGradeColor(subject.avg_grade) }} />
                  </div>
                  <span className="subject-grade">{Math.round(subject.avg_grade)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LEÇONS */}
      {activeTab === 'lessons' && (
        <div className="tab-panel">
          <div className="panel-header">
            <h2>📚 Mes leçons</h2>
            <button className="btn-primary" onClick={() => navigate('/professor/lessons/new')}>
              <Plus size={18} /> Créer une leçon
            </button>
          </div>
          
          <div className="lessons-grid">
            {lessons.map(lesson => (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-emoji">{lesson.emoji || '📚'}</div>
                <h3>{lesson.title}</h3>
                <p className="lesson-meta">
                  <span>{lesson.subject}</span> • <span>{lesson.class_level}</span>
                </p>
                <p className="lesson-description">{lesson.description?.substring(0, 100)}...</p>
                <div className="lesson-stats">
                  <span>👁️ {lesson.views || 0} vues</span>
                  <span>📥 {lesson.downloads || 0} téléchargements</span>
                </div>
                <div className="lesson-actions">
                  <button onClick={() => navigate(`/lesson/${lesson.id}`)}><Eye size={16} /> Voir</button>
                  <button className="delete" onClick={() => {
                    if (window.confirm('Supprimer cette leçon ?')) {
                      professorService.deleteLesson(lesson.id).then(() => loadData());
                    }
                  }}><Trash2 size={16} /> Suppr</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUIZ */}
{activeTab === 'quizzes' && (
  <div className="tab-panel">
    <div className="panel-header">
      <h2>📝 Mes quiz/examens</h2>
      <button className="btn-primary" onClick={() => navigate('/professor/quizzes/new')}>
        <Plus size={18} /> Créer un quiz/examen
      </button>
    </div>
    
    <div className="quizzes-grid">
      {quizzes.map(quiz => (
        <div key={quiz.id} className="quiz-card">
          <div className="quiz-header-info">
            <h3>{quiz.title}</h3>
            <span className={`exam-type-badge ${quiz.exam_type || 'quiz'}`}>
              {quiz.exam_type === 'exam' ? '📝 Examen écrit' : quiz.exam_type === 'assignment' ? '📄 Devoir' : '🎯 Quiz'}
            </span>
          </div>
          <p className="quiz-description">{quiz.description}</p>
          <div className="quiz-stats">
            <span>⏱️ {quiz.time_limit} min</span>
            <span>🎯 {quiz.passing_score}% requis</span>
            <span>📊 {quiz.attempts_count || 0} tentatives</span>
            <span>🔄 {quiz.allow_retry ? `Max ${quiz.max_attempts} tentatives` : 'Une seule tentative'}</span>
          </div>
          <div className="quiz-actions">
            <button className="btn-responses" onClick={() => {
              setSelectedQuizForResponses(quiz);
              setShowResponsesModal(true);
            }}>
              <Eye size={16} /> Voir réponses ({quiz.attempts_count || 0})
            </button>
            <button className="delete" onClick={() => {
              if (window.confirm('Supprimer ce quiz ?')) {
                professorService.deleteQuiz(quiz.id).then(() => loadData());
              }
            }}><Trash2 size={16} /> Supprimer</button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{showResponsesModal && selectedQuizForResponses && (
  <div className="modal-overlay" onClick={() => setShowResponsesModal(false)}>
    <div className="modal modal-large" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>📋 Réponses - {selectedQuizForResponses.title}</h2>
        <button onClick={() => setShowResponsesModal(false)}><X size={20} /></button>
      </div>
      <StudentResponses 
        quizId={selectedQuizForResponses.id} 
        quizTitle={selectedQuizForResponses.title}
        examType={selectedQuizForResponses.exam_type || 'quiz'}
      />
    </div>
  </div>
)}

      {/* FICHIERS - Utilisation du composant FileLibrary */}
      {activeTab === 'files' && (
        <div className="tab-panel">
          <FileLibrary userRole="professor" canUpload={true} canApprove={false} />
        </div>
      )}

      {/* MODAL AJOUT NOTE */}
      {showGradeModal && (
        <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📝 Attribuer une note</h2>
              <button onClick={() => setShowGradeModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddGrade}>
              <div className="form-group">
                <label>Étudiant</label>
                <select value={gradeForm.user_id} onChange={e => setGradeForm({...gradeForm, user_id: e.target.value})} required>
                  <option value="">Sélectionner un étudiant</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Type d'examen</label>
                <select value={gradeForm.exam_type} onChange={e => setGradeForm({...gradeForm, exam_type: e.target.value})}>
                  <option value="exam">Examen</option>
                  <option value="quiz">Quiz</option>
                  <option value="homework">Devoir</option>
                  <option value="project">Projet</option>
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Note obtenue</label>
                  <input type="number" value={gradeForm.grade} onChange={e => setGradeForm({...gradeForm, grade: e.target.value})} required min="0" max={gradeForm.max_grade} />
                </div>
                <div className="form-group">
                  <label>Note maximale</label>
                  <input type="number" value={gradeForm.max_grade} onChange={e => setGradeForm({...gradeForm, max_grade: e.target.value})} required min="1" />
                </div>
              </div>
              
              <div className="form-group">
                <label>Commentaire</label>
                <textarea value={gradeForm.comment} onChange={e => setGradeForm({...gradeForm, comment: e.target.value})} placeholder="Ex: Examen final - Chapitre 3" rows="2" />
              </div>
              
              <div className="form-group">
                <label>Feedback (optionnel)</label>
                <textarea value={gradeForm.feedback} onChange={e => setGradeForm({...gradeForm, feedback: e.target.value})} placeholder="Retour personnalisé pour l'étudiant..." rows="3" />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowGradeModal(false)}>Annuler</button>
                <button type="submit" className="btn-submit">Attribuer la note</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}