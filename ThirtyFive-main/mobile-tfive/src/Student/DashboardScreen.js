import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { lessonService, uploadService } from '../services/api';

export default function StudentDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' or 'files'
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadLessons();
    loadFiles();
  }, []);

  useEffect(() => {
    if (activeTab === 'files') {
      loadFiles();
    }
  }, [activeTab, selectedFileType]);

  const loadLessons = async () => {
    try {
      const response = await lessonService.getLessons();
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Erreur chargement leçons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFiles = async () => {
    setLoadingFiles(true);
    try {
      const params = selectedFileType !== 'all' ? { file_type: selectedFileType } : {};
      const response = await uploadService.getFiles(params);
      // Filtrer uniquement les fichiers approuvés
      const approvedFiles = (response.data.files || []).filter(f => f.status === 'approved');
      setFiles(approvedFiles);
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLessons();
    loadFiles();
  };

  const handleDownloadFile = async (file) => {
    try {
      Alert.alert(
        'Téléchargement',
        `Voulez-vous télécharger "${file.original_name}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Télécharger',
            onPress: async () => {
              // Ouvrir dans le navigateur
              const fileUrl = `http://192.168.181.95:5000${file.file_path}`;
              // Pour React Native, on peut ouvrir dans le navigateur
              Alert.alert('Info', `Fichier disponible: ${file.original_name}\nTéléchargez-le depuis le navigateur.`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  const handleShareFile = async (file) => {
    try {
      await Share.share({
        message: `📁 ${file.original_name}\n📏 ${formatFileSize(file.file_size)}\n📄 ${getFileTypeLabel(file.file_type)}`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
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
      spreadsheet: 'grid',
      presentation: 'easel',
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
      spreadsheet: 'Tableur',
      presentation: 'Présentation',
    };
    return labels[type] || type;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const fileTypes = [
    { key: 'all', label: 'Tous', icon: 'apps' },
    { key: 'html', label: 'HTML', icon: 'code-slash' },
    { key: 'css', label: 'CSS', icon: 'logo-css3' },
    { key: 'javascript', label: 'JS', icon: 'logo-javascript' },
    { key: 'image', label: 'Images', icon: 'image' },
    { key: 'document', label: 'Docs', icon: 'document-text' },
    { key: 'video', label: 'Vidéos', icon: 'videocam' },
  ];

  const filteredLessons = lessons.filter(lesson => {
    const matchSearch = !searchTerm ||
      lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = !selectedSubject || lesson.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  if (loading && lessons.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bonjour, {user?.name} 👋</Text>
        <Text style={styles.subtitle}>Explorez les leçons interactives</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => setActiveTab('lessons')}
        >
          <Icon name="book-outline" size={20} color={activeTab === 'lessons' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>Leçons</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'files' && styles.activeTab]}
          onPress={() => setActiveTab('files')}
        >
          <Icon name="folder-outline" size={20} color={activeTab === 'files' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'files' && styles.activeTabText]}>Bibliothèque</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'lessons' ? (
        <>
          <View style={styles.searchSection}>
            <View style={styles.searchBox}>
              <Icon name="search" size={20} color="#888" />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une leçon..."
                placeholderTextColor="#666"
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>📚 Leçons disponibles ({filteredLessons.length})</Text>

          <ScrollView
            style={styles.lessonsList}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filteredLessons.map(lesson => (
              <TouchableOpacity
                key={lesson.id}
                style={styles.lessonCard}
                onPress={() => navigation.navigate('LessonViewer', { lessonId: lesson.id })}
              >
                <View style={styles.lessonHeader}>
                  <Text style={styles.lessonEmoji}>{lesson.emoji || '📚'}</Text>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonMeta}>
                      {lesson.subject} • {lesson.class_level || 'Tous niveaux'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.lessonDescription} numberOfLines={2}>
                  {lesson.description || 'Aucune description'}
                </Text>
                <View style={styles.lessonFooter}>
                  <View style={styles.lessonStats}>
                    <Icon name="eye-outline" size={14} color="#888" />
                    <Text style={styles.statText}>{lesson.views || 0}</Text>
                    <Icon name="download-outline" size={14} color="#888" style={styles.statIcon} />
                    <Text style={styles.statText}>{lesson.downloads || 0}</Text>
                  </View>
                  <View style={styles.startButton}>
                    <Text style={styles.startButtonText}>Commencer</Text>
                    <Icon name="arrow-forward" size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredLessons.length === 0 && (
              <View style={styles.emptyState}>
                <Icon name="book-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>Aucune leçon trouvée</Text>
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        // Section Bibliothèque de fichiers
        <View style={styles.filesContainer}>
          {/* Filtres par type */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fileFilters}>
            {fileTypes.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[styles.filterBtn, selectedFileType === type.key && styles.filterActive]}
                onPress={() => setSelectedFileType(type.key)}
              >
                <Icon name={type.icon} size={16} color={selectedFileType === type.key ? '#fff' : '#888'} />
                <Text style={[styles.filterText, selectedFileType === type.key && styles.filterTextActive]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>
            📁 Fichiers partagés ({files.length})
          </Text>

          {loadingFiles ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#646cff" />
            </View>
          ) : files.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="folder-open-outline" size={64} color="#444" />
              <Text style={styles.emptyText}>Aucun fichier disponible</Text>
              <Text style={styles.emptySubtext}>
                Les fichiers apparaîtront ici après approbation par l'administrateur
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.filesList}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
              {files.map(file => (
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
                    <TouchableOpacity onPress={() => handleShareFile(file)} style={styles.actionBtn}>
                      <Icon name="share-outline" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDownloadFile(file)} style={styles.actionBtn}>
                      <Icon name="download-outline" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60 },
  welcome: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888' },
  
  // Tabs
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', gap: 8 },
  activeTab: { backgroundColor: '#646cff' },
  tabText: { color: '#888', fontSize: 14, fontWeight: '500' },
  activeTabText: { color: '#fff' },
  
  // Leçons
  searchSection: { paddingHorizontal: 20, marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, paddingVertical: 14, color: '#fff', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginHorizontal: 20, marginBottom: 16 },
  lessonsList: { flex: 1, paddingHorizontal: 20 },
  lessonCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12 },
  lessonHeader: { flexDirection: 'row', marginBottom: 12 },
  lessonEmoji: { fontSize: 32, marginRight: 12 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  lessonMeta: { fontSize: 12, color: '#888' },
  lessonDescription: { fontSize: 14, color: '#aaa', lineHeight: 20, marginBottom: 12 },
  lessonFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lessonStats: { flexDirection: 'row', alignItems: 'center' },
  statIcon: { marginLeft: 12 },
  statText: { fontSize: 12, color: '#888', marginLeft: 4 },
  startButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#646cff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  startButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Bibliothèque de fichiers
  filesContainer: { flex: 1 },
  fileFilters: { paddingHorizontal: 20, marginBottom: 16 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', marginRight: 10, gap: 6 },
  filterActive: { backgroundColor: '#646cff' },
  filterText: { color: '#888', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  filesList: { flex: 1, paddingHorizontal: 20 },
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
  
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  emptySubtext: { color: '#666', fontSize: 12, marginTop: 8, textAlign: 'center' },
});