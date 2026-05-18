// src/components/FileLibrary.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/api';
import { fileServiceAxios } from '../services/api';
import FileViewer from './FileViewer'; // AJOUTER CET IMPORT

import { 
  File, Download, Trash2, Search, X, Upload,
  FileText, FileCode, FileJson, Database,
  Image, Video, FileArchive, FileSpreadsheet,
  Clock, User, HardDrive, RefreshCw, CheckCircle,
  XCircle, Eye, EyeOff, AlertCircle, Shield
} from 'lucide-react';
import './FileLibrary.css';

export default function FileLibrary({ userRole = 'student', canUpload = true, canApprove = false }) {
  const { isDark } = useTheme();
  const [files, setFiles] = useState([]);
  const [stats, setStats] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // AJOUTER CET ÉTAT POUR LA PRÉVISUALISATION
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    loadFiles();
    if (canApprove) {
      loadPendingFiles();
    }
  }, [selectedType, activeTab]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = { page: 1, limit: 50 };
      if (selectedType !== 'all') params.file_type = selectedType;
      if (activeTab === 'my') params.user_filter = 'me';
      
      const response = await apiService.getFiles(params);
      setFiles(response.data.files || []);
      setStats(response.data.stats || []);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement fichiers:', err);
      setError('Impossible de charger les fichiers');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingFiles = async () => {
    try {
      const response = await apiService.getPendingFiles();
      setPendingFiles(response.data.pending_files || []);
    } catch (err) {
      console.error('Erreur chargement fichiers en attente:', err);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fileServiceAxios.downloadFile(fileId);
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('❌ Erreur lors du téléchargement: ' + (error.response?.data?.message || error.message));
    }
  };

  // AJOUTER CETTE FONCTION POUR LA PRÉVISUALISATION
  const handlePreview = (file) => {
    setPreviewFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Sélectionnez un fichier');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await apiService.uploadFile(formData);
      if (response.data.success) {
        alert(response.data.message || 'Fichier uploadé avec succès');
        setShowUploadModal(false);
        setUploadFile(null);
        loadFiles();
        if (canApprove) loadPendingFiles();
      }
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (fileId, approved, rejectionReason = '') => {
    try {
      await apiService.approveFile(fileId, approved, rejectionReason);
      alert(approved ? '✅ Fichier approuvé' : '❌ Fichier rejeté');
      loadPendingFiles();
      loadFiles();
    } catch (err) {
      console.error('Erreur approbation:', err);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (window.confirm(`Supprimer "${fileName}" ?`)) {
      try {
        await apiService.deleteFile(fileId);
        loadFiles();
        if (canApprove) loadPendingFiles();
      } catch (err) {
        console.error('Erreur suppression:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      'html': <FileCode size={24} />,
      'css': <FileCode size={24} />,
      'javascript': <FileCode size={24} />,
      'sql': <Database size={24} />,
      'json': <FileJson size={24} />,
      'text': <FileText size={24} />,
      'image': <Image size={24} />,
      'video': <Video size={24} />,
      'document': <FileText size={24} />,
      'archive': <FileArchive size={24} />,
      'spreadsheet': <FileSpreadsheet size={24} />,
      'presentation': <FileText size={24} />,
      'audio': <FileText size={24} />
    };
    return icons[fileType] || <File size={24} />;
  };

  const getFileTypeLabel = (fileType) => {
    const labels = {
      'html': 'HTML', 'css': 'CSS', 'javascript': 'JavaScript',
      'sql': 'SQL', 'json': 'JSON', 'text': 'Texte',
      'image': 'Image', 'video': 'Vidéo', 'document': 'Document',
      'archive': 'Archive', 'spreadsheet': 'Tableur',
      'presentation': 'Présentation', 'audio': 'Audio',
      'other': 'Autre'
    };
    return labels[fileType] || fileType;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') {
      return <span className="status-badge approved"><CheckCircle size={12} /> Approuvé</span>;
    } else if (status === 'pending') {
      return <span className="status-badge pending"><Clock size={12} /> En attente</span>;
    } else {
      return <span className="status-badge rejected"><XCircle size={12} /> Rejeté</span>;
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

  const filteredFiles = files.filter(file => 
    file.original_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSize = stats.reduce((acc, s) => acc + (s.total_size || 0), 0);
  const currentUser = getCurrentUser();

  return (
    <div className={`file-library ${isDark ? 'dark' : 'light'}`}>
      <div className="file-library-header">
        <div>
          <h2>📁 Bibliothèque de fichiers</h2>
          <p className="subtitle">Tous les fichiers partagés sur la plateforme</p>
        </div>
        <div className="header-actions">
          <div className="file-stats-summary">
            <span><HardDrive size={16} /> {formatFileSize(totalSize)}</span>
            <span><File size={16} /> {files.length} fichiers</span>
          </div>
          {canUpload && (
            <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
              <Upload size={18} /> Upload
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="library-tabs">
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          Tous les fichiers
        </button>
        {canApprove && (
          <button className={`tab ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            <Clock size={14} /> En attente ({pendingFiles.length})
          </button>
        )}
        <button className={`tab ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
          Mes fichiers
        </button>
      </div>

      {/* Filtres */}
      <div className="file-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')}>
              <X size={16} />
            </button>
          )}
        </div>
        
        <div className="type-filters">
          <button 
            className={`type-filter ${selectedType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            Tous
          </button>
          {stats.filter(s => s.count > 0).map(stat => (
            <button 
              key={stat.file_type}
              className={`type-filter ${selectedType === stat.file_type ? 'active' : ''}`}
              onClick={() => setSelectedType(stat.file_type)}
            >
              {getFileTypeLabel(stat.file_type)} ({stat.count})
            </button>
          ))}
        </div>
        
        <button className="refresh-btn" onClick={loadFiles} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {/* Fichiers en attente (Admin) */}
      {activeTab === 'pending' && canApprove && (
        <div className="pending-section">
          <h3>Fichiers en attente d'approbation</h3>
          {pendingFiles.length === 0 ? (
            <div className="empty-state">
              <CheckCircle size={48} />
              <p>Aucun fichier en attente</p>
            </div>
          ) : (
            <div className="pending-grid">
              {pendingFiles.map(file => (
                <div key={file.id} className="pending-card">
                  <div className="pending-info">
                    <div className="file-icon-small">{getFileIcon(file.file_type)}</div>
                    <div>
                      <div className="file-name">{file.original_name}</div>
                      <div className="file-meta">
                        <span><User size={12} /> {file.uploader_name}</span>
                        <span><Clock size={12} /> {new Date(file.created_at).toLocaleDateString()}</span>
                        <span>{formatFileSize(file.file_size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pending-actions">
                    <button className="approve-btn" onClick={() => handleApprove(file.id, true)}>
                      <CheckCircle size={16} /> Approuver
                    </button>
                    <button className="reject-btn" onClick={() => {
                      const reason = prompt('Raison du rejet (optionnelle):');
                      handleApprove(file.id, false, reason);
                    }}>
                      <XCircle size={16} /> Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Liste des fichiers */}
      {loading ? (
        <div className="loading-files">
          <div className="loading-spinner"></div>
          <p>Chargement des fichiers...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-files">
          <File size={48} />
          <p>Aucun fichier trouvé</p>
          {canUpload && <small>Utilisez le bouton "Upload" pour ajouter des fichiers</small>}
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map(file => (
            <div key={file.id} className="file-card">
              <div className="file-icon">
                {getFileIcon(file.file_type)}
              </div>
              <div className="file-info">
                <div className="file-name" title={file.original_name}>
                  {file.original_name}
                </div>
                <div className="file-meta">
                  <span className="file-type">{getFileTypeLabel(file.file_type)}</span>
                  <span className="file-size">{formatFileSize(file.file_size)}</span>
                  {getStatusBadge(file.status)}
                </div>
                <div className="file-details">
                  <span><User size={12} /> {file.uploader_name || 'Inconnu'}</span>
                  <span><Clock size={12} /> {new Date(file.created_at).toLocaleDateString()}</span>
                  {file.downloads > 0 && <span>📥 {file.downloads}</span>}
                </div>
              </div>
              <div className="file-actions">
                {/* AJOUTER LE BOUTON APERÇU */}
                {file.status === 'approved' && (
                  <button 
                    className="preview-btn"
                    onClick={() => handlePreview(file)}
                    title="Aperçu"
                  >
                    <Eye size={18} />
                  </button>
                )}
                {file.status === 'approved' && (
                  <button 
                    className="download-btn"
                    onClick={() => handleDownload(file.id, file.original_name)}
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </button>
                )}
                {(userRole === 'admin' || file.user_id === currentUser?.id) && (
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(file.id, file.original_name)}
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal upload-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📤 Upload de fichier</h2>
              <button onClick={() => setShowUploadModal(false)} disabled={uploading}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="upload-zone">
                <input
                  type="file"
                  id="fileUpload"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  disabled={uploading}
                />
                <label htmlFor="fileUpload" className="upload-label">
                  <Upload size={48} />
                  <span>{uploadFile ? uploadFile.name : 'Cliquez ou glissez un fichier'}</span>
                  {uploadFile && (
                    <small>{formatFileSize(uploadFile.size)}</small>
                  )}
                  <small className="file-info-text">
                    Tous les types de fichiers sont acceptés (max 2GB)
                  </small>
                </label>
              </div>
              
              {canApprove && (
                <div className="upload-info">
                  <Shield size={14} />
                  <small>En tant qu'admin, ce fichier sera directement approuvé</small>
                </div>
              )}
              
              {userRole === 'professor' && (
                <div className="upload-info">
                  <Clock size={14} />
                  <small>Le fichier sera visible après approbation par un administrateur</small>
                </div>
              )}
              
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowUploadModal(false)} disabled={uploading}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit" disabled={uploading || !uploadFile}>
                  {uploading ? 'Upload...' : 'Uploader'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AJOUTER LE MODAL DE PRÉVISUALISATION */}
      {previewFile && (
        <FileViewer
          fileId={previewFile.id}
          fileName={previewFile.original_name}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}