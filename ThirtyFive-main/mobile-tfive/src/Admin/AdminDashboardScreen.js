import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';
import StatisticsScreen from './StatisticsScreen';
import FileLibraryScreen from '../Student/FileLibraryScreen';

export default function ManageFilesScreen() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadFiles();
  }, [selectedType]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'all' ? { file_type: selectedType } : {};
      const res = await adminService.getFiles(params);
      setFiles(res.data.files || []);
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    const icons = {
      'html': 'code-slash',
      'css': 'logo-css3',
      'javascript': 'logo-javascript',
      'image': 'image',
      'video': 'videocam',
      'document': 'document-text',
      'archive': 'archive',
      'pdf': 'document',
      'other': 'document'
    };
    return icons[type] || 'document';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (fileId, fileName) => {
    Alert.alert(
      'Supprimer',
      `Supprimer "${fileName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteFile(fileId);
              setFiles(files.filter(f => f.id !== fileId));
              Alert.alert('Succès', 'Fichier supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const handleShare = async (file) => {
    try {
      await Share.share({
        message: `Fichier: ${file.original_name}\nTaille: ${formatFileSize(file.file_size)}\nType: ${file.file_type}`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const fileTypes = [
    { key: 'all', label: 'Tous', icon: 'apps' },
    { key: 'html', label: 'HTML', icon: 'code-slash' },
    { key: 'css', label: 'CSS', icon: 'logo-css3' },
    { key: 'javascript', label: 'JS', icon: 'logo-javascript' },
    { key: 'image', label: 'Images', icon: 'image' },
    { key: 'document', label: 'Docs', icon: 'document-text' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📁 Gestion des fichiers</Text>
        <Text style={styles.subtitle}>{files.length} fichier(s)</Text>
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {fileTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[styles.filterBtn, selectedType === type.key && styles.filterBtnActive]}
            onPress={() => setSelectedType(type.key)}
          >
            <Icon name={type.icon} size={16} color={selectedType === type.key ? '#fff' : '#888'} />
            <Text style={[styles.filterText, selectedType === type.key && styles.filterTextActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.content}>
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="folder-open" size={64} color="#444" />
            <Text style={styles.emptyText}>Aucun fichier</Text>
          </View>
        ) : (
          files.map(file => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <Icon name={getFileIcon(file.file_type)} size={32} color="#646cff" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.original_name}</Text>
                <Text style={styles.fileMeta}>
                  {file.file_type} • {formatFileSize(file.file_size)}
                </Text>
                <Text style={styles.fileUser}>Uploadé par: {file.uploader_name || 'Inconnu'}</Text>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity onPress={() => handleShare(file)} style={styles.actionBtn}>
                  <Icon name="share-outline" size={20} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(file.id, file.original_name)} style={styles.actionBtn}>
                  <Icon name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  filters: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 10, gap: 6 },
  filterBtnActive: { backgroundColor: '#646cff' },
  filterText: { color: '#888', fontSize: 14 },
  filterTextActive: { color: '#fff' },
  content: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 12, gap: 16 },
  fileIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(100,108,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 4 },
  fileMeta: { fontSize: 11, color: '#888', marginBottom: 2 },
  fileUser: { fontSize: 10, color: '#666' },
  fileActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
});