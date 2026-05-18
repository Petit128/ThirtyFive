// src/components/FileUpload.jsx
import React, { useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { professorService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

export default function FileUpload({ onUploadComplete, allowedTypes = 'all', maxSize = 2 * 1024 * 1024 * 1024 }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const { isDark } = useTheme();

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Max size: ${maxSize / (1024 * 1024)}MB`);
        return false;
      }
      return true;
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    setUploading(true);
    
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await professorService.uploadFile(formData);
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'success', data: response.data.file }
        }));
        if (onUploadComplete) onUploadComplete(response.data.file);
      } catch (error) {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { status: 'error', error: error.response?.data?.message || 'Upload failed' }
        }));
      }
    }
    
    setUploading(false);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
      pdf: '📄', doc: '📝', docx: '📝',
      xls: '📊', xlsx: '📊',
      ppt: '📽️', pptx: '📽️',
      zip: '📦', rar: '📦',
      mp4: '🎥', avi: '🎥', mov: '🎥',
      html: '🌐', css: '🎨', js: '⚡',
      jpg: '🖼️', png: '🖼️', gif: '🖼️'
    };
    return icons[ext] || '📎';
  };

  return (
    <div className={`file-upload ${isDark ? 'dark' : 'light'}`}>
      <div className="upload-area" onClick={() => document.getElementById('fileInput').click()}>
        <Upload size={48} />
        <p>Click or drag files to upload</p>
        <small>Supports all file types up to 2GB</small>
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <h4>Files to upload ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <span className="file-icon">{getFileIcon(file.name)}</span>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</div>
              </div>
              {!uploading && (
                <button onClick={() => removeFile(index)} className="remove-btn">
                  <X size={16} />
                </button>
              )}
              {uploadProgress[file.name] && (
                <div className="upload-status">
                  {uploadProgress[file.name].status === 'success' ? (
                    <CheckCircle size={20} color="#4caf50" />
                  ) : uploadProgress[file.name].status === 'error' ? (
                    <AlertCircle size={20} color="#f44336" />
                  ) : null}
                </div>
              )}
            </div>
          ))}
          
          <button 
            onClick={uploadFiles} 
            disabled={uploading}
            className="upload-btn"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
          </button>
        </div>
      )}
    </div>
  );
}