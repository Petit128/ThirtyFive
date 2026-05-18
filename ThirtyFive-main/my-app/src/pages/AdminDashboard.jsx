// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Upload, BookOpen, Users, Download, Trash2, Eye, 
  X, FileText, Plus, Edit, Star, Filter, 
  Shield, UserCog, CheckCircle, XCircle, BarChart3,
  FileSpreadsheet, Database, Clock, AlertCircle, RefreshCw,
  Mail, Bell, Settings, LogOut, Menu, ChevronRight, FolderOpen
} from 'lucide-react';
import { adminService, userService, lessonService, professorService } from '../services/api';
import FileLibrary from '../components/FileLibrary';
import './AdminDashboard.css';

export default function AdminDashboard({ user, lessons: initialLessons, addLesson, deleteLesson }) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('lessons');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [searchTerm, setSearchTerm] = useState('');
  const [lessons, setLessons] = useState(initialLessons || []);
  const [users, setUsers] = useState([]);
  const [pendingLessons, setPendingLessons] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [reports, setReports] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Load data on component mount and tab change
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await adminService.getUsers();
        setUsers(res.data.users);
      } else if (activeTab === 'pending') {
        const res = await adminService.getLessons();
        setPendingLessons(res.data.lessons.filter(l => !l.approved));
      } else if (activeTab === 'statistics') {
        const res = await adminService.getStatistics();
        setStatistics(res.data.statistics);
      } else if (activeTab === 'reports') {
        const res = await adminService.getReports();
        setReports(res.data.reports);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter lessons
  const filteredLessons = lessons.filter(lesson => 
    lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
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
      label: 'Users', 
      value: users.length || statistics?.users?.total || 0,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)'
    },
  ];

  // Handle user role change
  const handleChangeRole = async (userId, newRole) => {
    try {
      await adminService.changeUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert(`✅ Rôle changé pour l'utilisateur`);
    } catch (error) {
      console.error('Error changing role:', error);
      alert('❌ Erreur lors du changement de rôle');
    }
  };

  // Handle lesson approval
  const handleApproveLesson = async (lessonId, approved) => {
    try {
      await adminService.approveLesson(lessonId, approved);
      setPendingLessons(pendingLessons.filter(l => l.id !== lessonId));
      alert(`✅ Leçon ${approved ? 'approuvée' : 'refusée'}`);
    } catch (error) {
      console.error('Error approving lesson:', error);
      alert('❌ Erreur lors de l\'approbation');
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📁 Fichier sélectionné:', file.name);
      setFormData({ ...formData, htmlFile: file });
    }
  };

  // Handle lesson submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        alert('✅ Utilisateur supprimé');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('❌ Erreur lors de la suppression');
      }
    }
  };

  // Generate report
  const handleGenerateReport = async (type) => {
    try {
      const res = await adminService.getReports(type);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${type}-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('❌ Erreur lors de la génération du rapport');
    }
  };

  return (
    <div className={`admin-dashboard ${isDark ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1>📊 Admin Dashboard</h1>
          <p>Welcome back, <strong>{user?.name}</strong>! Manage your platform here.</p>
        </div>
        <div className="header-actions">
          <button 
            className="create-btn"
            onClick={() => setShowUploadModal(true)}
          >
            <Plus size={18} />
            <span>Create Lesson</span>
          </button>
        </div>
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

      {/* Tabs */}
      <div className="admin-tabs">
        <button className={activeTab === 'lessons' ? 'active' : ''} onClick={() => setActiveTab('lessons')}>
          <BookOpen size={18} /> Lessons
        </button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
          <Users size={18} /> Users
        </button>
        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
          <Clock size={18} /> Pending
        </button>
        <button className={activeTab === 'statistics' ? 'active' : ''} onClick={() => setActiveTab('statistics')}>
          <BarChart3 size={18} /> Statistics
        </button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
          <FileSpreadsheet size={18} /> Reports
        </button>
        <button className={activeTab === 'files' ? 'active' : ''} onClick={() => setActiveTab('files')}>
          <FolderOpen size={18} /> Files
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* LESSONS TAB */}
        {activeTab === 'lessons' && (
          <>
            <div className="search-bar">
              <Filter size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search lessons by title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-count">{filteredLessons.length} lessons</span>
            </div>

            <div className="lessons-grid-modern">
              {filteredLessons.length === 0 ? (
                <div className="empty-state">
                  <BookOpen size={48} />
                  <h3>No lessons found</h3>
                  <p>Get started by creating your first interactive lesson</p>
                  <button className="create-btn" onClick={() => setShowUploadModal(true)}>
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
                      <button className="action-btn view" onClick={() => window.open(`/lesson/${lesson.id}`, '_blank')}>
                        <Eye size={16} />
                      </button>
                      <button className="action-btn delete" onClick={() => deleteLesson(lesson.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="users-panel">
            <div className="panel-header">
              <h2>👥 User Management</h2>
              <button className="refresh-btn" onClick={loadData}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
            
            {isLoading ? (
              <div className="loading-state">Loading users...</div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Change Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div className="user-info">
                            <img src={u.avatar || '/default-avatar.png'} alt={u.name} className="user-avatar" />
                            <span>{u.name}</span>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <span className={`role-badge role-${u.role}`}>{u.role}</span>
                        </td>
                        <td>
                          <select 
                            className="role-select"
                            defaultValue={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          >
                            <option value="student">Student</option>
                            <option value="professor">Professor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <div className="user-actions">
                            <button className="icon-btn" onClick={() => {
                              setSelectedUser(u);
                              setShowUserModal(true);
                            }}>
                              <Shield size={16} />
                            </button>
                            <button className="icon-btn delete" onClick={() => handleDeleteUser(u.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* PENDING LESSONS TAB */}
        {activeTab === 'pending' && (
          <div className="pending-panel">
            <div className="panel-header">
              <h2>⏳ Pending Approvals</h2>
            </div>
            
            {pendingLessons.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} color="#10b981" />
                <h3>No pending lessons</h3>
                <p>All lessons have been reviewed</p>
              </div>
            ) : (
              <div className="pending-lessons-list">
                {pendingLessons.map(lesson => (
                  <div key={lesson.id} className="pending-lesson-card">
                    <div className="pending-lesson-info">
                      <span className="lesson-emoji">{lesson.emoji || '📚'}</span>
                      <div>
                        <h4>{lesson.title}</h4>
                        <p>Created by: {lesson.created_by_name || 'Unknown'}</p>
                        <small>{lesson.created_at && new Date(lesson.created_at).toLocaleDateString()}</small>
                      </div>
                    </div>
                    <div className="pending-lesson-actions">
                      <button className="approve-btn" onClick={() => handleApproveLesson(lesson.id, true)}>
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button className="reject-btn" onClick={() => handleApproveLesson(lesson.id, false)}>
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STATISTICS TAB */}
        {activeTab === 'statistics' && statistics && (
          <div className="statistics-panel">
            <div className="stats-grid-large">
              <div className="stat-card-large">
                <div className="stat-header">
                  <Users size={24} /> Users
                </div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Total:</span>
                    <strong>{statistics.users?.total || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Students:</span>
                    <strong>{statistics.users?.students || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Professors:</span>
                    <strong>{statistics.users?.professors || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Admins:</span>
                    <strong>{statistics.users?.admins || 0}</strong>
                  </div>
                </div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-header">
                  <BookOpen size={24} /> Lessons
                </div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Total:</span>
                    <strong>{statistics.lessons?.total || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Approved:</span>
                    <strong>{statistics.lessons?.approved || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Pending:</span>
                    <strong>{statistics.lessons?.pending || 0}</strong>
                  </div>
                </div>
              </div>
              
              <div className="stat-card-large">
                <div className="stat-header">
                  <FileText size={24} /> Quizzes
                </div>
                <div className="stat-details">
                  <div className="stat-item">
                    <span>Total:</span>
                    <strong>{statistics.quizzes?.total || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Average Grade:</span>
                    <strong>{Math.round(statistics.grades?.average_grade || 0)}%</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="reports-panel">
            <div className="panel-header">
              <h2>📊 Generate Reports</h2>
            </div>
            <div className="reports-grid">
              <button className="report-card" onClick={() => handleGenerateReport('students')}>
                <Users size={32} />
                <h3>Student Report</h3>
                <p>Export all student data</p>
              </button>
              <button className="report-card" onClick={() => handleGenerateReport('grades')}>
                <BarChart3 size={32} />
                <h3>Grades Report</h3>
                <p>Export grades statistics</p>
              </button>
              <button className="report-card" onClick={() => handleGenerateReport('activity')}>
                <Clock size={32} />
                <h3>Activity Report</h3>
                <p>Export user activity log</p>
              </button>
              <button className="report-card" onClick={() => handleGenerateReport('full')}>
                <Database size={32} />
                <h3>Full Backup</h3>
                <p>Complete system backup</p>
              </button>
            </div>
            
            {reports && reports.activity && (
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {reports.activity.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="activity-item">
                      <span className="activity-date">{item.date}</span>
                      <span className="activity-count">{item.logins} logins</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FILES TAB - Utilisation du composant FileLibrary */}
        {activeTab === 'files' && (
          <div className="files-panel">
            <FileLibrary userRole="admin" canUpload={true} canApprove={true} />
          </div>
        )}
      </div>

      {/* User Permissions Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className={`modal-content ${isDark ? 'dark' : 'light'}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Permissions - {selectedUser.name}</h2>
              <button className="close-btn" onClick={() => setShowUserModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="permissions-list">
              <label className="permission-item">
                <input type="checkbox" defaultChecked={selectedUser.permissions?.includes('create_lesson')} />
                <span>Create Lessons</span>
              </label>
              <label className="permission-item">
                <input type="checkbox" defaultChecked={selectedUser.permissions?.includes('create_quiz')} />
                <span>Create Quizzes</span>
              </label>
              <label className="permission-item">
                <input type="checkbox" defaultChecked={selectedUser.permissions?.includes('manage_forum')} />
                <span>Manage Forum</span>
              </label>
              <label className="permission-item">
                <input type="checkbox" defaultChecked={selectedUser.permissions?.includes('view_analytics')} />
                <span>View Analytics</span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={() => setShowUserModal(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Lesson Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !isUploading && setShowUploadModal(false)}>
          <div className={`modal-content ${isDark ? 'dark' : 'light'}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Interactive Lesson</h2>
              <button className="close-btn" onClick={() => !isUploading && setShowUploadModal(false)} disabled={isUploading}>
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
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="e.g., Introduction to Waves"
                    disabled={isUploading}
                  />
                </div>

                <div className="form-group">
                  <label>Subject</label>
                  <select
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
                  <label>Class Level</label>
                  <select
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
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    placeholder="Describe what students will learn..."
                    disabled={isUploading}
                  />
                </div>

                {uploadMethod === 'file' ? (
                  <div className="form-group full-width">
                    <label>HTML File</label>
                    <div className="file-dropzone">
                      <input
                        type="file"
                        id="file-upload"
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
                    <label>HTML Code</label>
                    <textarea
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

              {isUploading && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p>{uploadProgress}% • Uploading lesson...</p>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={isUploading || !formData.title}>
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