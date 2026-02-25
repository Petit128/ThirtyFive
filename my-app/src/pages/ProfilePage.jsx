import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  User, Mail, BookOpen, Clock, Award, Download, Eye,
  Edit2, Save, X, Camera, Calendar, CheckCircle, Star,
  MapPin, Link as LinkIcon, Github, Twitter, Settings,
  LogOut, Shield, Moon, Sun, Bell, Volume2, Languages
} from 'lucide-react';
import { userService } from '../services/api';
import './ProfilePage.css';

export default function ProfilePage({ user: initialUser, setUser }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState(initialUser);
  const [stats, setStats] = useState({
    completedLessons: 0,
    favoritesCount: 0,
    totalMinutes: 0,
    averageScore: 0,
    streak: 7,
    rank: 'Apprenti'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'settings', 'activity'
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    bio: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    loadUserProfile();
    loadAchievements();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const response = await userService.getProfile();
      const userData = response.data.user;
      
      setProfile(userData);
      setEditedProfile({
        name: userData.name || '',
        bio: userData.bio || '',
        location: userData.location || '',
        website: userData.website || '',
        github: userData.github || '',
        twitter: userData.twitter || '',
        avatar: userData.avatar || ''
      });
      
      if (userData.stats) {
        setStats({
          completedLessons: userData.stats.completed_count || 0,
          favoritesCount: userData.stats.favorites_count || 0,
          totalMinutes: userData.stats.total_minutes || 0,
          averageScore: userData.stats.average_score || 0,
          streak: userData.stats.streak || 7,
          rank: userData.stats.rank || 'Apprenti'
        });
      }
      
      // Activité récente simulée
      setRecentActivity([
        { id: 1, type: 'completed', lesson: 'Wave Simulator', date: '2024-02-24', score: 85 },
        { id: 2, type: 'favorite', lesson: 'Fraction Builder', date: '2024-02-23' },
        { id: 3, type: 'downloaded', lesson: 'Solar System', date: '2024-02-22' },
        { id: 4, type: 'started', lesson: 'Circuit Lab', date: '2024-02-21' },
      ]);
      
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAchievements = () => {
    setAchievements([
      { id: 1, name: 'Premier pas', icon: '🌱', description: 'Complétez votre première leçon', unlocked: true, date: '2024-02-01' },
      { id: 2, name: 'Apprenti', icon: '📚', description: 'Complétez 5 leçons', unlocked: true, date: '2024-02-10' },
      { id: 3, name: 'Expert', icon: '🏆', description: 'Complétez 20 leçons', unlocked: stats.completedLessons >= 20, progress: Math.min(100, (stats.completedLessons / 20) * 100) },
      { id: 4, name: 'Rapide', icon: '⚡', description: 'Obtenez 3 scores parfaits', unlocked: false, progress: 66 },
      { id: 5, name: 'Social', icon: '🤝', description: 'Partagez 5 leçons', unlocked: false, progress: 40 },
      { id: 6, name: 'Collectionneur', icon: '🎯', description: 'Ajoutez 10 favoris', unlocked: stats.favoritesCount >= 10, progress: Math.min(100, (stats.favoritesCount / 10) * 100) },
    ]);
  };

  const handleEdit = () => {
    setEditedProfile({
      name: profile.name || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      github: profile.github || '',
      twitter: profile.twitter || '',
      avatar: profile.avatar || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Simuler la progression
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 20, 90));
      }, 200);
      
      const response = await userService.updateProfile(editedProfile);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      const updatedUser = response.data.user;
      setProfile(updatedUser);
      setUser(updatedUser);
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setTimeout(() => {
        setIsEditing(false);
        setUploadProgress(0);
        setSaving(false);
      }, 500);
      
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      alert('Erreur lors de la mise à jour du profil');
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setUploadProgress(0);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedProfile({ ...editedProfile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarGenerate = () => {
    const colors = ['646cff', '10b981', 'f59e0b', 'ef4444', '8b5cf6', 'ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const name = editedProfile.name || profile.name || 'User';
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=256&bold=true&length=2&font-size=0.60`;
    setEditedProfile({ ...editedProfile, avatar });
  };

  const getRankColor = (rank) => {
    const colors = {
      'Apprenti': '#10b981',
      'Initié': '#f59e0b',
      'Expert': '#8b5cf6',
      'Maître': '#ec4899',
      'Légende': '#ef4444'
    };
    return colors[rank] || '#646cff';
  };

  if (loading) {
    return (
      <div className={`profile-page ${isDark ? 'dark' : 'light'}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-page ${isDark ? 'dark' : 'light'}`}>
      <div className="profile-container">
        {/* Header avec navigation */}
        <div className="profile-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Retour
          </button>
          
          <div className="header-tabs">
            <button 
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={18} /> Profil
            </button>
            <button 
              className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <Clock size={18} /> Activité
            </button>
            <button 
              className={`tab-btn ${activeTab === 'achievements' ? 'active' : ''}`}
              onClick={() => setActiveTab('achievements')}
            >
              <Award size={18} /> Succès
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} /> Paramètres
            </button>
          </div>

          {!isEditing && activeTab === 'profile' && (
            <button className="edit-profile-btn" onClick={handleEdit}>
              <Edit2 size={18} /> Modifier
            </button>
          )}
        </div>

        {/* Contenu principal */}
        <div className="profile-content">
          {/* Colonne de gauche - Avatar et infos */}
          <div className="profile-left">
            <div className="avatar-card">
              <div className="avatar-container">
                <img 
                  src={isEditing ? editedProfile.avatar : profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=646cff&color=fff&size=256&bold=true`}
                  alt={profile?.name}
                  className="profile-avatar"
                />
                {isEditing && (
                  <div className="avatar-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <button className="avatar-action-btn" onClick={handleAvatarClick} title="Upload photo">
                      <Camera size={18} />
                    </button>
                    <button className="avatar-action-btn" onClick={handleAvatarGenerate} title="Générer avatar">
                      <Shield size={18} />
                    </button>
                  </div>
                )}
              </div>

              <div className="user-info">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({...editedProfile, name: e.target.value})}
                    placeholder="Votre nom"
                    className="edit-name-input"
                  />
                ) : (
                  <h2>{profile?.name}</h2>
                )}
                
                <div className="user-badges">
                  <span className={`role-badge ${profile?.role}`}>
                    {profile?.role === 'admin' ? '👑 Administrateur' : '👨‍🎓 Étudiant'}
                  </span>
                  <span className="rank-badge" style={{ background: getRankColor(stats.rank) }}>
                    {stats.rank}
                  </span>
                </div>

                <div className="user-email">
                  <Mail size={16} />
                  <span>{profile?.email}</span>
                </div>

                <div className="user-joined">
                  <Calendar size={16} />
                  <span>Membre depuis {new Date(profile?.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}</span>
                </div>
              </div>

              {!isEditing && (
                <div className="user-stats-mini">
                  <div className="mini-stat">
                    <BookOpen size={16} />
                    <span>{stats.completedLessons} leçons</span>
                  </div>
                  <div className="mini-stat">
                    <Clock size={16} />
                    <span>{Math.floor(stats.totalMinutes / 60)}h {stats.totalMinutes % 60}m</span>
                  </div>
                  <div className="mini-stat">
                    <Star size={16} />
                    <span>{stats.averageScore}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bio section */}
            {(profile?.bio || isEditing) && (
              <div className="bio-card">
                <h3>À propos</h3>
                {isEditing ? (
                  <textarea
                    value={editedProfile.bio}
                    onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                    placeholder="Parlez-nous de vous..."
                    rows="4"
                    className="bio-textarea"
                  />
                ) : (
                  <p className="bio-text">{profile?.bio}</p>
                )}
              </div>
            )}

            {/* Social links */}
            {(profile?.location || profile?.website || profile?.github || profile?.twitter || isEditing) && (
              <div className="social-card">
                <h3>Liens</h3>
                <div className="social-links">
                  {isEditing ? (
                    <>
                      <div className="social-input">
                        <MapPin size={16} />
                        <input
                          type="text"
                          value={editedProfile.location}
                          onChange={(e) => setEditedProfile({...editedProfile, location: e.target.value})}
                          placeholder="Ville, Pays"
                        />
                      </div>
                      <div className="social-input">
                        <LinkIcon size={16} />
                        <input
                          type="url"
                          value={editedProfile.website}
                          onChange={(e) => setEditedProfile({...editedProfile, website: e.target.value})}
                          placeholder="https://votre-site.com"
                        />
                      </div>
                      <div className="social-input">
                        <Github size={16} />
                        <input
                          type="text"
                          value={editedProfile.github}
                          onChange={(e) => setEditedProfile({...editedProfile, github: e.target.value})}
                          placeholder="username"
                        />
                      </div>
                      <div className="social-input">
                        <Twitter size={16} />
                        <input
                          type="text"
                          value={editedProfile.twitter}
                          onChange={(e) => setEditedProfile({...editedProfile, twitter: e.target.value})}
                          placeholder="@username"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {profile?.location && (
                        <a href="#" className="social-link">
                          <MapPin size={16} />
                          <span>{profile.location}</span>
                        </a>
                      )}
                      {profile?.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="social-link">
                          <LinkIcon size={16} />
                          <span>{profile.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      )}
                      {profile?.github && (
                        <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="social-link">
                          <Github size={16} />
                          <span>{profile.github}</span>
                        </a>
                      )}
                      {profile?.twitter && (
                        <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="social-link">
                          <Twitter size={16} />
                          <span>{profile.twitter}</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne de droite - Contenu selon l'onglet */}
          <div className="profile-right">
            {activeTab === 'profile' && (
              <>
                {/* Stats principales */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(100, 108, 255, 0.1)', color: '#646cff' }}>
                      <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.completedLessons}</span>
                      <span className="stat-label">Leçons complétées</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                      <Clock size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.streak} jours</span>
                      <span className="stat-label">Série en cours</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                      <Star size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.averageScore}%</span>
                      <span className="stat-label">Score moyen</span>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                      <Award size={24} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.favoritesCount}</span>
                      <span className="stat-label">Favoris</span>
                    </div>
                  </div>
                </div>

                {/* Activité récente */}
                <div className="recent-activity">
                  <h3>Activité récente</h3>
                  <div className="activity-list">
                    {recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <div className="activity-icon">
                          {activity.type === 'completed' && <CheckCircle size={20} style={{ color: '#10b981' }} />}
                          {activity.type === 'favorite' && <Star size={20} style={{ color: '#f59e0b' }} />}
                          {activity.type === 'downloaded' && <Download size={20} style={{ color: '#646cff' }} />}
                          {activity.type === 'started' && <Eye size={20} style={{ color: '#8b5cf6' }} />}
                        </div>
                        <div className="activity-details">
                          <span className="activity-lesson">{activity.lesson}</span>
                          <span className="activity-type">
                            {activity.type === 'completed' && `Terminé avec ${activity.score}%`}
                            {activity.type === 'favorite' && 'Ajouté aux favoris'}
                            {activity.type === 'downloaded' && 'Téléchargé'}
                            {activity.type === 'started' && 'Commencé'}
                          </span>
                        </div>
                        <span className="activity-date">{new Date(activity.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'achievements' && (
              <div className="achievements-grid">
                {achievements.map(achievement => (
                  <div key={achievement.id} className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-info">
                      <h4>{achievement.name}</h4>
                      <p>{achievement.description}</p>
                      {achievement.progress !== undefined && !achievement.unlocked && (
                        <div className="achievement-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${achievement.progress}%` }} />
                          </div>
                          <span>{achievement.progress}%</span>
                        </div>
                      )}
                      {achievement.unlocked && achievement.date && (
                        <span className="achievement-date">Obtenu le {new Date(achievement.date).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-panel">
                <h3>Préférences</h3>
                
                <div className="settings-group">
                  <div className="setting-item">
                    <div className="setting-info">
                      <Moon size={20} />
                      <div>
                        <span className="setting-name">Thème sombre</span>
                        <span className="setting-desc">Basculer entre le mode clair et sombre</span>
                      </div>
                    </div>
                    <button 
                      className={`theme-toggle-setting ${isDark ? 'dark' : 'light'}`}
                      onClick={toggleTheme}
                    >
                      {isDark ? <Sun size={16} /> : <Moon size={16} />}
                      <span>{isDark ? 'Clair' : 'Sombre'}</span>
                    </button>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <Bell size={20} />
                      <div>
                        <span className="setting-name">Notifications</span>
                        <span className="setting-desc">Recevoir des alertes</span>
                      </div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <Volume2 size={20} />
                      <div>
                        <span className="setting-name">Sons</span>
                        <span className="setting-desc">Effets sonores</span>
                      </div>
                    </div>
                    <label className="switch">
                      <input type="checkbox" />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <Languages size={20} />
                      <div>
                        <span className="setting-name">Langue</span>
                        <span className="setting-desc">Français</span>
                      </div>
                    </div>
                    <select className="language-select">
                      <option>Français</option>
                      <option>English</option>
                      <option>Español</option>
                    </select>
                  </div>
                </div>

                <h3>Actions</h3>
                <div className="settings-group">
                  <button className="danger-btn" onClick={() => navigate('/logout')}>
                    <LogOut size={18} /> Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barre de progression pour la sauvegarde */}
        {saving && (
          <div className="save-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
            </div>
            <p>Sauvegarde en cours... {uploadProgress}%</p>
          </div>
        )}

        {/* Boutons d'édition en bas */}
        {isEditing && (
          <div className="edit-actions-bottom">
            <button className="cancel-edit-btn" onClick={handleCancel}>
              <X size={18} /> Annuler
            </button>
            <button className="save-edit-btn" onClick={handleSave} disabled={saving}>
              <Save size={18} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}