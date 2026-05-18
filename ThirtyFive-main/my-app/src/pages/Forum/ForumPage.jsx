// src/pages/Forum/ForumPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { forumService } from '../../services/api';
import { 
  MessageCircle, Lock, Pin, Eye, Heart, MessageSquare, 
  Plus, Search, X, Send, Users, Key, Copy, CheckCircle,
  ChevronRight, ChevronDown, AlertCircle, Flag, Bookmark,
  ThumbsUp, ThumbsDown, MoreVertical, RefreshCw, Trash2
} from 'lucide-react';
import './ForumPage.css';

export default function ForumPage() {
    const [showJoinWithCodeModal, setShowJoinWithCodeModal] = useState(false);
const [joinCode, setJoinCode] = useState('');
const [joiningCategory, setJoiningCategory] = useState(false);
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [selectedPrivateCategory, setSelectedPrivateCategory] = useState(null);
  const [inviteCode, setInviteCode] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newTopic, setNewTopic] = useState({
    title: '',
    content: '',
    is_private: false,
    invited_users: []
  });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    is_private: false,
    invite_emails: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchCategories();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await forumService.getCategories();
      setCategories(response.data.categories || []);
      if (response.data.categories?.length > 0 && !selectedCategory) {
        setSelectedCategory(response.data.categories[0]);
      }
      setError(null);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setError('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await forumService.getUsers?.() || { data: { users: [] } };
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Erreur chargement users:', err);
    }
  };

  const handleJoinWithCode = async () => {
  if (!joinCode.trim()) {
    setError('Code d\'invitation requis');
    return;
  }
  
  setJoiningCategory(true);
  try {
    // Chercher la catégorie avec ce code
    const response = await forumService.joinWithCode(joinCode.toUpperCase());
    if (response.data.success) {
      alert(`✅ Vous avez rejoint la catégorie "${response.data.category_name}"`);
      setShowJoinWithCodeModal(false);
      setJoinCode('');
      fetchCategories(); // Recharger les catégories
    }
  } catch (err) {
    console.error('Erreur jointure:', err);
    setError(err.response?.data?.message || 'Code invalide');
  } finally {
    setJoiningCategory(false);
  }
};

  const fetchTopics = async (categoryId) => {
    try {
      setLoading(true);
      const response = await forumService.getTopics(categoryId);
      setTopics(response.data.topics || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement topics:', err);
      if (err.response?.status === 403 && err.response?.data?.requires_invite) {
        setSelectedPrivateCategory({ id: categoryId });
        setShowJoinModal(true);
      } else {
        setError(err.response?.data?.message || 'Erreur chargement des sujets');
      }
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopic.title || !newTopic.content) {
      setError('Titre et contenu requis');
      return;
    }

    try {
      const topicData = {
        categoryId: selectedCategory.id,
        title: newTopic.title,
        content: newTopic.content,
        is_private: newTopic.is_private,
        invited_users: newTopic.invited_users.map(u => u.id)
      };
      await forumService.createTopic(topicData);
      setNewTopic({ title: '', content: '', is_private: false, invited_users: [] });
      setShowNewTopic(false);
      fetchTopics(selectedCategory.id);
    } catch (err) {
      console.error('Erreur création topic:', err);
      setError(err.response?.data?.message || 'Impossible de créer le topic');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      setError('Le nom de la catégorie est requis');
      return;
    }
    
    setCreatingCategory(true);
    try {
      const inviteEmailsList = newCategory.invite_emails
        .split(',')
        .map(email => email.trim())
        .filter(email => email);
      
      const response = await forumService.createCategory({
        name: newCategory.name,
        description: newCategory.description,
        is_private: newCategory.is_private,
        invite_emails: inviteEmailsList
      });
      
      if (response.data.success) {
        alert(response.data.message || 'Catégorie créée avec succès');
        setShowCreateCategoryModal(false);
        setNewCategory({ name: '', description: '', is_private: false, invite_emails: '' });
        fetchCategories();
      }
    } catch (err) {
      console.error('Erreur création catégorie:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setCreatingCategory(false);
    }
  };

  // === FONCTIONS DE SUPPRESSION (ADMIN ou PROPRIETAIRE) ===
  
  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?\n\nTous les sujets et messages seront également supprimés.`)) {
      try {
        await forumService.deleteCategory(categoryId);
        alert('✅ Catégorie supprimée');
        fetchCategories();
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(null);
        }
      } catch (err) {
        console.error('Erreur suppression catégorie:', err);
        alert('❌ ' + (err.response?.data?.message || 'Erreur lors de la suppression'));
      }
    }
  };

  const handleDeleteTopic = async (topicId, topicTitle, e) => {
    e.stopPropagation();
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le sujet "${topicTitle}" ?`)) {
      try {
        await forumService.deleteTopic(topicId);
        alert('✅ Sujet supprimé');
        if (selectedCategory) {
          fetchTopics(selectedCategory.id);
        }
      } catch (err) {
        console.error('Erreur suppression topic:', err);
        alert('❌ ' + (err.response?.data?.message || 'Erreur lors de la suppression'));
      }
    }
  };

  const handleJoinPrivateCategory = async () => {
    if (!inviteCode) {
      setError('Code d\'invitation requis');
      return;
    }

    try {
      await forumService.joinCategory(selectedPrivateCategory.id, inviteCode);
      setShowJoinModal(false);
      setInviteCode('');
      setSelectedPrivateCategory(null);
      fetchCategories();
      if (selectedPrivateCategory.id === selectedCategory?.id) {
        fetchTopics(selectedPrivateCategory.id);
      }
    } catch (err) {
      console.error('Erreur jointure:', err);
      setError(err.response?.data?.message || 'Code invalide');
    }
  };

  const handleCopyInviteLink = async (category) => {
    try {
      const response = await forumService.getInviteLink(category.id);
      const link = response.data.invite_link;
      await navigator.clipboard.writeText(link);
      alert('✅ Lien d\'invitation copié !');
    } catch (err) {
      console.error('Erreur copie lien:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await forumService.search(searchTerm);
      setSearchResults(response.data.results);
    } catch (err) {
      console.error('Erreur recherche:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const getCategoryIcon = (category) => {
    if (category.is_private) return <Lock size={18} />;
    if (category.icon === 'general') return <MessageCircle size={18} />;
    if (category.icon === 'help') return <AlertCircle size={18} />;
    if (category.icon === 'projects') return <Users size={18} />;
    return <MessageCircle size={18} />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'à l\'instant';
    if (diffHours < 24) return `il y a ${diffHours}h`;
    if (diffHours < 48) return 'hier';
    return date.toLocaleDateString('fr-FR');
  };

  const currentUser = getCurrentUser();

  return (
    <div className={`forum-page ${isDark ? 'dark' : 'light'}`}>
      <div className="forum-container">
        <div className="forum-header">
          <h1>💬 Forum de Discussion</h1>
          <div className="forum-search">
            <input
              type="text"
              placeholder="Rechercher dans le forum..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <RefreshCw size={18} className="spin" /> : <Search size={18} />}
            </button>
            {searchResults && (
              <button className="clear-search" onClick={() => { setSearchResults(null); setSearchTerm(''); }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Résultats de recherche */}
        {searchResults && (
          <div className="search-results">
            <h3>Résultats pour "{searchTerm}"</h3>
            {searchResults.topics?.length > 0 && (
              <div className="result-section">
                <h4>Sujets ({searchResults.topics.length})</h4>
                {searchResults.topics.map(topic => (
                  <div key={topic.id} className="result-item" onClick={() => navigate(`/forum/topic/${topic.id}`)}>
                    <span className="result-icon">📌</span>
                    <div className="result-content">
                      <span className="result-title">{topic.title}</span>
                      <span className="result-meta">par {topic.author_name} • {topic.category_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {searchResults.posts?.length > 0 && (
              <div className="result-section">
                <h4>Messages ({searchResults.posts.length})</h4>
                {searchResults.posts.map(post => (
                  <div key={post.id} className="result-item" onClick={() => navigate(`/forum/topic/${post.topic_id}`)}>
                    <span className="result-icon">💬</span>
                    <div className="result-content">
                      <span className="result-title">{post.topic_title}</span>
                      <span className="result-meta">{post.content.substring(0, 100)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!searchResults && (
          <div className="forum-layout">
            {/* Sidebar - Catégories */}
            <div className="categories-panel">
              <div className="categories-header">
                <h2>Catégories</h2>
                <button 
                  className="btn-refresh" 
                  onClick={fetchCategories}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                </button>
              </div>
              
              {categories.map((category) => {
                const canDeleteCategory = currentUser?.role === 'admin' || category.created_by === currentUser?.id;
                
                return (
                  <div key={category.id} className="category-wrapper">
                    <button
                      className={`category-btn ${selectedCategory?.id === category.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span className="category-icon">{getCategoryIcon(category)}</span>
                      <span className="category-name">{category.name}</span>
                      <span className="topic-count">{category.topic_count || 0}</span>
                    </button>
                    
                    {canDeleteCategory && (
                      <button 
                        className="delete-category-btn"
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        title="Supprimer la catégorie"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    
                    {category.is_private && category.created_by === currentUser?.id && (
                      <button 
                        className="invite-btn"
                        onClick={() => handleCopyInviteLink(category)}
                        title="Copier le lien d'invitation"
                      >
                        <Key size={14} />
                      </button>
                    )}
                    
                    {category.is_private && !category.is_member && category.created_by !== currentUser?.id && (
                      <button 
                        className="join-btn"
                        onClick={() => {
                          setSelectedPrivateCategory(category);
                          setShowJoinModal(true);
                        }}
                        title="Rejoindre avec un code"
                      >
                        <Users size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              
              <button 
                className="create-category-btn"
                onClick={() => setShowCreateCategoryModal(true)}
              >
                <Plus size={16} /> Nouvelle catégorie
              </button>

            
                <button 
                className="join-with-code-btn"
                onClick={() => setShowJoinWithCodeModal(true)}
                >
                <Key size={16} /> Rejoindre avec un code
                </button>
            </div>

            {/* Topics Panel */}
            <div className="topics-panel">
              {selectedCategory ? (
                <>
                  <div className="topics-header">
                    <div>
                      <h2>{selectedCategory.name}</h2>
                      {selectedCategory.description && (
                        <p className="category-description">{selectedCategory.description}</p>
                      )}
                    </div>
                    <button
                      className="btn-new-topic"
                      onClick={() => setShowNewTopic(!showNewTopic)}
                    >
                      <Plus size={18} /> Nouveau sujet
                    </button>
                  </div>

                  {showNewTopic && (
                    <form className="new-topic-form" onSubmit={handleCreateTopic}>
                      <input
                        type="text"
                        placeholder="Titre du sujet"
                        value={newTopic.title}
                        onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                        required
                      />
                      <textarea
                        placeholder="Contenu du message..."
                        value={newTopic.content}
                        onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                        required
                        rows="5"
                      />
                      
                      <div className="privacy-options">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={newTopic.is_private}
                            onChange={(e) => setNewTopic({ ...newTopic, is_private: e.target.checked })}
                          />
                          <Lock size={14} />
                          <span>Topic privé (visible seulement pour les invités)</span>
                        </label>
                      </div>
                      
                      {newTopic.is_private && (
                        <div className="invite-users">
                          <label>Inviter des utilisateurs (par email)</label>
                          <div className="invite-input">
                            <input
                              type="text"
                              placeholder="email@exemple.com"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && e.target.value) {
                                  const user = users.find(u => u.email === e.target.value);
                                  if (user && !newTopic.invited_users.find(u => u.id === user.id)) {
                                    setNewTopic({
                                      ...newTopic,
                                      invited_users: [...newTopic.invited_users, user]
                                    });
                                    e.target.value = '';
                                  }
                                }
                              }}
                            />
                          </div>
                          <div className="invited-list">
                            {newTopic.invited_users.map(user => (
                              <span key={user.id} className="invited-badge">
                                {user.name}
                                <button type="button" onClick={() => {
                                  setNewTopic({
                                    ...newTopic,
                                    invited_users: newTopic.invited_users.filter(u => u.id !== user.id)
                                  });
                                }}>
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="form-actions">
                        <button type="submit" className="btn-primary">Publier</button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowNewTopic(false)}
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="topics-list">
                    {loading ? (
                      <div className="loading-topics">
                        <div className="loading-spinner"></div>
                        <p>Chargement des sujets...</p>
                      </div>
                    ) : topics.length > 0 ? (
                      topics.map((topic) => {
                        const canDeleteTopic = currentUser?.role === 'admin' || topic.user_id === currentUser?.id;
                        
                        return (
                          <div 
                            key={topic.id} 
                            className={`topic-card ${topic.is_pinned ? 'pinned' : ''} ${topic.is_locked ? 'locked' : ''}`}
                          >
                            <div 
                              className="topic-main"
                              onClick={() => navigate(`/forum/topic/${topic.id}`)}
                              style={{ flex: 1, cursor: 'pointer' }}
                            >
                              <div className="topic-header">
                                <div className="topic-title">
                                  {topic.is_pinned && <Pin size={14} className="pin-icon" />}
                                  {topic.is_locked && <Lock size={14} className="lock-icon" />}
                                  {topic.is_private && <Lock size={14} className="private-icon" />}
                                  <h3>{topic.title}</h3>
                                </div>
                                <span className="topic-author">par {topic.author_name}</span>
                              </div>
                              
                              <div className="topic-stats">
                                <span className="topic-replies">
                                  <MessageSquare size={14} /> {topic.reply_count || 0} réponses
                                </span>
                                <span className="topic-views">
                                  <Eye size={14} /> {topic.views || 0} vues
                                </span>
                                {topic.like_count > 0 && (
                                  <span className="topic-likes">
                                    <Heart size={14} /> {topic.like_count}
                                  </span>
                                )}
                              </div>
                              
                              <div className="topic-footer">
                                <span className="topic-date">
                                  Dernière activité: {formatDate(topic.last_activity)}
                                </span>
                                {topic.unread_count > 0 && (
                                  <span className="unread-badge">{topic.unread_count} nouveau{x}</span>
                                )}
                              </div>
                            </div>
                            
                            {canDeleteTopic && (
                              <button 
                                className="delete-topic-btn"
                                onClick={(e) => handleDeleteTopic(topic.id, topic.title, e)}
                                title="Supprimer le sujet"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-topics">
                        <MessageCircle size={48} />
                        <p>Aucun sujet dans cette catégorie</p>
                        <button className="btn-new-topic" onClick={() => setShowNewTopic(true)}>
                          <Plus size={16} /> Créer le premier sujet
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="no-category-selected">
                  <MessageCircle size={48} />
                  <p>Sélectionnez une catégorie pour voir les sujets</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal pour rejoindre avec un code d'invitation */}
{showJoinWithCodeModal && (
  <div className="modal-overlay" onClick={() => !joiningCategory && setShowJoinWithCodeModal(false)}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h2>🔑 Rejoindre une catégorie privée</h2>
        <button onClick={() => setShowJoinWithCodeModal(false)} disabled={joiningCategory}>
          <X size={20} />
        </button>
      </div>
      <p className="modal-description">
        Entrez le code d'invitation que vous avez reçu pour rejoindre une catégorie privée.
      </p>
      <div className="invite-code-input">
        <input
          type="text"
          placeholder="Ex: ABC12345"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={8}
          autoFocus
          disabled={joiningCategory}
        />
        <button onClick={handleJoinWithCode} disabled={joiningCategory}>
          <Key size={16} /> {joiningCategory ? 'Connexion...' : 'Rejoindre'}
        </button>
      </div>
      <button 
        className="close-modal" 
        onClick={() => setShowJoinWithCodeModal(false)}
        disabled={joiningCategory}
      >
        Annuler
      </button>
    </div>
  </div>
)}

      {/* Modal pour créer une nouvelle catégorie */}
      {showCreateCategoryModal && (
        <div className="modal-overlay" onClick={() => !creatingCategory && setShowCreateCategoryModal(false)}>
          <div className="modal modal-create-category" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📁 Créer une catégorie</h2>
              <button onClick={() => setShowCreateCategoryModal(false)} disabled={creatingCategory}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Nom de la catégorie *</label>
                <input
                  type="text"
                  placeholder="Ex: Mathématiques, Programmation, etc."
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                  disabled={creatingCategory}
                />
              </div>
              
              <div className="form-group">
                <label>Description (optionnelle)</label>
                <textarea
                  placeholder="Décrivez le but de cette catégorie..."
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  rows="3"
                  disabled={creatingCategory}
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newCategory.is_private}
                    onChange={(e) => setNewCategory({...newCategory, is_private: e.target.checked})}
                    disabled={creatingCategory}
                  />
                  <Lock size={14} />
                  <span>Catégorie privée</span>
                </label>
                <small className="help-text">Les catégories privées nécessitent un code d'invitation pour y accéder</small>
              </div>
              
              {newCategory.is_private && (
                <div className="form-group">
                  <label>Inviter des utilisateurs (emails séparés par des virgules)</label>
                  <input
                    type="text"
                    placeholder="exemple@email.com, autre@email.com"
                    value={newCategory.invite_emails}
                    onChange={(e) => setNewCategory({...newCategory, invite_emails: e.target.value})}
                    disabled={creatingCategory}
                  />
                  <small>Les utilisateurs invités pourront rejoindre la catégorie sans code</small>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateCategoryModal(false)} disabled={creatingCategory}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit" disabled={creatingCategory}>
                  {creatingCategory ? 'Création...' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}