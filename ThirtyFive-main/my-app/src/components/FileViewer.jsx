// src/components/FileViewer.jsx
import React, { useState, useEffect } from 'react';
import { Download, FileText, Eye, X, Maximize2, Minimize2, Loader } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { fileServiceAxios } from '../services/api';
import './FileViewer.css';

export default function FileViewer({ fileId, fileName, onClose }) {
  const { isDark } = useTheme();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadFilePreview();
  }, [fileId]);

  const loadFilePreview = async () => {
    try {
      setLoading(true);
      const response = await fileServiceAxios.previewFile(fileId);
      setFileData(response.data);
      setError(null);
    } catch (err) {
      console.error('Erreur chargement fichier:', err);
      setError(err.response?.data?.message || 'Impossible de charger le fichier');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fileServiceAxios.downloadFile(fileId);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur téléchargement:', err);
      alert('Erreur lors du téléchargement');
    }
  };

  const toggleFullscreen = () => {
    const viewer = document.querySelector('.file-viewer-content');
    if (!isFullscreen) {
      viewer?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="file-viewer-loading">
          <Loader size={48} className="spin" />
          <p>Chargement du fichier...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="file-viewer-error">
          <FileText size={48} />
          <p>{error}</p>
          <button onClick={handleDownload} className="download-btn">
            <Download size={16} /> Télécharger le fichier
          </button>
        </div>
      );
    }

    if (!fileData) return null;

    switch (fileData.type) {
      case 'text':
        return (
          <div className="text-viewer">
            <div className="text-header">
              <h3>{fileData.fileName}</h3>
              <div className="file-meta">
                <span>📄 {fileData.mimeType || 'Texte'}</span>
                <span>📏 {formatFileSize(fileData.fileSize)}</span>
              </div>
            </div>
            <pre className="text-content">{fileData.content}</pre>
          </div>
        );

      case 'pdf':
        return (
          <div className="pdf-viewer">
            <iframe
              src={`${fileData.url}#toolbar=1&navpanes=1&scrollbar=1`}
              title={fileData.fileName}
              className="pdf-iframe"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          </div>
        );

      case 'image':
        return (
          <div className="image-viewer">
            <img src={fileData.url} alt={fileData.fileName} />
          </div>
        );

      case 'video':
        return (
          <div className="video-viewer">
            <video controls autoPlay={false} className="video-player">
              <source src={fileData.url} type={fileData.mimeType} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        );

      case 'office':
        return (
          <div className="office-viewer">
            <div className="office-header">
              <h3>📊 {fileData.fileName}</h3>
              <div className="file-meta">
                <span>📏 {formatFileSize(fileData.fileSize)}</span>
                <span>📄 {fileData.ext}</span>
              </div>
              <p className="office-note">
                ℹ️ Aperçu via Google Docs Viewer. Pour la meilleure expérience, téléchargez le fichier.
              </p>
            </div>
            <iframe
              src={fileData.viewerUrl}
              title={fileData.fileName}
              className="office-iframe"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          </div>
        );

      case 'archive':
        return (
          <div className="archive-viewer">
            <div className="archive-header">
              <FileText size={48} />
              <h3>{fileData.fileName}</h3>
              <p>{fileData.message || 'Aperçu non disponible pour les archives.'}</p>
              <button onClick={handleDownload} className="download-btn">
                <Download size={16} /> Télécharger l'archive
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="fallback-viewer">
            <div className="fallback-header">
              <FileText size={48} />
              <h3>{fileData.fileName}</h3>
              {fileData.fileSize && <p>Taille: {formatFileSize(fileData.fileSize)}</p>}
              <button onClick={handleDownload} className="download-btn">
                <Download size={16} /> Télécharger le fichier
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`file-viewer-modal ${isDark ? 'dark' : 'light'}`}>
      <div className="file-viewer-overlay" onClick={onClose}></div>
      <div className="file-viewer-container">
        <div className="file-viewer-header">
          <div className="file-viewer-title">
            <Eye size={18} />
            <span>Aperçu: {fileName}</span>
          </div>
          <div className="file-viewer-actions">
            <button onClick={toggleFullscreen} title="Plein écran">
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button onClick={handleDownload} title="Télécharger">
              <Download size={18} />
            </button>
            <button onClick={onClose} title="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="file-viewer-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}