import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { adminService, uploadService } from '../services/api';

export default function AdminUploadFileScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileType, setFileType] = useState('');
  const [description, setDescription] = useState('');
  const [autoApprove, setAutoApprove] = useState(true);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      
      if (result.type === 'success') {
        const ext = result.name.split('.').pop().toLowerCase();
        let type = 'other';
        
        if (['html', 'htm'].includes(ext)) type = 'html';
        else if (['css'].includes(ext)) type = 'css';
        else if (['js', 'mjs'].includes(ext)) type = 'javascript';
        else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) type = 'image';
        else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) type = 'video';
        else if (['pdf'].includes(ext)) type = 'document';
        else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) type = 'archive';
        else if (['doc', 'docx'].includes(ext)) type = 'document';
        else if (['xls', 'xlsx'].includes(ext)) type = 'spreadsheet';
        else if (['ppt', 'pptx'].includes(ext)) type = 'presentation';
        
        setSelectedFile(result);
        setFileType(type);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Sélectionnez un fichier d\'abord');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      type: selectedFile.mimeType || 'application/octet-stream',
      name: selectedFile.name,
    });
    if (description) formData.append('description', description);
    if (autoApprove) formData.append('auto_approve', 'true');

    try {
      const response = await uploadService.uploadFile(formData);
      Alert.alert(
        'Succès', 
        `Fichier uploadé avec succès!\n\n${autoApprove ? 'Fichier automatiquement approuvé et visible par tous.' : 'En attente d\'approbation.'}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      setSelectedFile(null);
      setDescription('');
    } catch (error) {
      console.error('Erreur upload:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'uploader le fichier');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return 'cloud-upload-outline';
    const icons = {
      html: 'code-slash',
      css: 'logo-css3',
      javascript: 'logo-javascript',
      image: 'image',
      video: 'videocam',
      document: 'document-text',
      archive: 'archive',
      spreadsheet: 'grid',
      presentation: 'easel',
    };
    return icons[fileType] || 'document-outline';
  };

  const getFileTypeLabel = () => {
    const labels = {
      html: 'HTML',
      css: 'CSS',
      javascript: 'JavaScript',
      image: 'Image',
      video: 'Vidéo',
      document: 'Document',
      archive: 'Archive',
      spreadsheet: 'Tableur',
      presentation: 'Présentation',
    };
    return labels[fileType] || 'Fichier';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>📤 Upload de fichier (Admin)</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Icon name="shield-checkmark-outline" size={24} color="#10b981" />
          <Text style={styles.infoText}>
            En tant qu'administrateur, vos fichiers sont automatiquement approuvés et visibles par tous les utilisateurs.
          </Text>
        </View>

        <TouchableOpacity style={styles.uploadZone} onPress={pickDocument} disabled={uploading}>
          <Icon name={getFileIcon()} size={64} color="#646cff" />
          <Text style={styles.uploadText}>
            {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
          </Text>
          {selectedFile && (
            <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
          )}
          <Text style={styles.uploadSubtext}>
            Tous les types de fichiers sont acceptés (max 2GB)
          </Text>
        </TouchableOpacity>

        {selectedFile && (
          <View style={styles.filePreview}>
            <View style={styles.fileTypeBadge}>
              <Icon name={getFileIcon()} size={16} color="#fff" />
              <Text style={styles.fileTypeText}>{getFileTypeLabel()}</Text>
            </View>
            <Text style={styles.fileName}>{selectedFile.name}</Text>
            <Text style={styles.fileMeta}>
              Taille: {formatFileSize(selectedFile.size)}
            </Text>
            
            <TouchableOpacity 
              style={styles.removeFileBtn} 
              onPress={() => setSelectedFile(null)}
              disabled={uploading}
            >
              <Icon name="close-circle-outline" size={20} color="#ef4444" />
              <Text style={styles.removeFileText}>Supprimer la sélection</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.approveToggle, autoApprove && styles.approveToggleActive]}
          onPress={() => setAutoApprove(!autoApprove)}
          disabled={uploading}
        >
          <Icon name={autoApprove ? "checkmark-circle" : "checkmark-circle-outline"} size={20} color={autoApprove ? "#10b981" : "#888"} />
          <Text style={[styles.approveToggleText, autoApprove && styles.approveToggleTextActive]}>
            Auto-approbation activée (visible immédiatement)
          </Text>
        </TouchableOpacity>

        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>Upload en cours... {uploadProgress}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadBtn, (!selectedFile || uploading) && styles.disabledBtn]}
          onPress={uploadFile}
          disabled={!selectedFile || uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.uploadBtnText}>Uploader le fichier</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.formatsSection}>
          <Text style={styles.formatsTitle}>Formats supportés :</Text>
          <View style={styles.formatsList}>
            <View style={styles.formatBadge}><Text style={styles.formatText}>HTML/CSS/JS</Text></View>
            <View style={styles.formatBadge}><Text style={styles.formatText}>PDF</Text></View>
            <View style={styles.formatBadge}><Text style={styles.formatText}>Images</Text></View>
            <View style={styles.formatBadge}><Text style={styles.formatText}>Vidéos</Text></View>
            <View style={styles.formatBadge}><Text style={styles.formatText}>Documents</Text></View>
            <View style={styles.formatBadge}><Text style={styles.formatText}>Archives</Text></View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 16 },
  backButton: { padding: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 16, gap: 12, marginBottom: 24 },
  infoText: { flex: 1, color: '#aaa', fontSize: 13, lineHeight: 18 },
  uploadZone: { alignItems: 'center', justifyContent: 'center', padding: 40, borderWidth: 2, borderColor: '#646cff', borderStyle: 'dashed', borderRadius: 16, marginBottom: 20 },
  uploadText: { color: '#646cff', fontSize: 16, marginTop: 16, textAlign: 'center' },
  fileSize: { color: '#888', fontSize: 12, marginTop: 8 },
  uploadSubtext: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' },
  filePreview: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 20 },
  fileTypeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#646cff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6, marginBottom: 12 },
  fileTypeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fileName: { color: '#fff', fontSize: 14, marginBottom: 4 },
  fileMeta: { color: '#888', fontSize: 12, marginBottom: 12 },
  removeFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8 },
  removeFileText: { color: '#ef4444', fontSize: 12 },
  approveToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  approveToggleActive: { backgroundColor: 'rgba(16,185,129,0.1)' },
  approveToggleText: { color: '#888', fontSize: 14 },
  approveToggleTextActive: { color: '#10b981' },
  progressContainer: { marginBottom: 20 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  progressText: { color: '#888', fontSize: 12, marginTop: 8, textAlign: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, gap: 8, marginBottom: 24 },
  disabledBtn: { opacity: 0.5 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  formatsSection: { marginBottom: 30 },
  formatsTitle: { color: '#fff', fontSize: 14, marginBottom: 12 },
  formatsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formatBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  formatText: { color: '#888', fontSize: 12 },
});