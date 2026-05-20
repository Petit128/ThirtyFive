import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { uploadService } from '../services/api';

export default function FileLibraryScreen({ navigation }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    loadFiles();
  }, [selectedType]);

  const loadFiles = async () => {
    try {
      const params = selectedType !== 'all' ? { file_type: selectedType } : {};
      const response = await uploadService.getFiles(params);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (type) => {
    const icons = {
      html: 'code-slash',
      css: 'logo-css3',
      javascript: 'logo-javascript',
      image: 'image',
      video: 'videocam',
      document: 'document-text',
      pdf: 'document',
      archive: 'archive',
    };
    return icons[type] || 'document';
  };

  const getFileTypeLabel = (type) => {
    const labels = {
      html: 'HTML',
      css: 'CSS',
      javascript: 'JavaScript',
      image: 'Image',
      video: 'Vidéo',
      document: 'Document',
      pdf: 'PDF',
      archive: 'Archive',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleShare = async (file) => {
    try {
      await Share.share({
        message: `📁 ${file.original_name}\n📏 ${formatFileSize(file.file_size)}\n📄 ${getFileTypeLabel(file.file_type)}`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const filteredFiles = files.filter(file =>
    file.original_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fileTypes = [
    { key: 'all', label: 'Tous', icon: 'apps' },
    { key: 'html', label: 'HTML', icon: 'code-slash' },
    { key: 'css', label: 'CSS', icon: 'logo-css3' },
    { key: 'javascript', label: 'JS', icon: 'logo-javascript' },
    { key: 'image', label: 'Images', icon: 'image' },
    { key: 'document', label: 'Docs', icon: 'document-text' },
    { key: 'video', label: 'Vidéo', icon: 'videocam' },
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
        <Text style={styles.title}>📁 Bibliothèque</Text>
        <Text style={styles.subtitle}>{files.length} fichier(s)</Text>
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm !== '' && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {fileTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[styles.filterBtn, selectedType === type.key && styles.filterActive]}
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
        {filteredFiles.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="folder-open-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Aucun fichier</Text>
          </View>
        ) : (
          filteredFiles.map(file => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <Icon name={getFileIcon(file.file_type)} size={32} color="#646cff" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.original_name}</Text>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileType}>{getFileTypeLabel(file.file_type)}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.file_size)}</Text>
                </View>
                <Text style={styles.fileUploader}>
                  {file.uploader_name || 'Inconnu'} • {new Date(file.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity onPress={() => handleShare(file)} style={styles.actionBtn}>
                  <Icon name="share-outline" size={20} color="#888" />
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
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16 },
  filters: { paddingHorizontal: 20, marginBottom: 16 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, gap: 6 },
  filterActive: { backgroundColor: '#646cff' },
  filterText: { color: '#888', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, marginBottom: 12, gap: 16 },
  fileIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(100,108,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 4 },
  fileMeta: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  fileType: { fontSize: 10, color: '#646cff', backgroundColor: 'rgba(100,108,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  fileSize: { fontSize: 10, color: '#888' },
  fileUploader: { fontSize: 9, color: '#666' },
  fileActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 8 },
});