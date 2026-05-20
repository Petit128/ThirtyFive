import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { uploadService } from '../services/api';

export default function PendingFilesScreen() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadPendingFiles();
  }, []);

  const loadPendingFiles = async () => {
    try {
      const response = await uploadService.getPendingFiles();
      setFiles(response.data.pending_files || []);
    } catch (error) {
      console.error('Erreur chargement fichiers en attente:', error);
      Alert.alert('Erreur', 'Impossible de charger les fichiers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingFiles();
  };

  const handleApprove = async (fileId) => {
    Alert.alert(
      'Approuver le fichier',
      'Voulez-vous vraiment approuver ce fichier ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              await uploadService.approveFile(fileId, true);
              setFiles(files.filter(f => f.id !== fileId));
              Alert.alert('Succès', 'Fichier approuvé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'approuver');
            }
          }
        }
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim() && rejectReason !== '') {
      Alert.alert('Erreur', 'Veuillez indiquer une raison');
      return;
    }

    try {
      await uploadService.approveFile(selectedFile.id, false, rejectReason);
      setFiles(files.filter(f => f.id !== selectedFile.id));
      setRejectModalVisible(false);
      setSelectedFile(null);
      setRejectReason('');
      Alert.alert('Succès', 'Fichier rejeté');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de rejeter');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Text style={styles.title}>⏳ Fichiers en attente</Text>
        <Text style={styles.subtitle}>{files.length} fichier(s) à approuver</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="checkmark-circle-outline" size={64} color="#10b981" />
            <Text style={styles.emptyText}>Aucun fichier en attente</Text>
            <Text style={styles.emptySubtext}>Tous les fichiers ont été traités</Text>
          </View>
        ) : (
          files.map(file => (
            <View key={file.id} style={styles.fileCard}>
              <View style={styles.fileIcon}>
                <Icon name={getFileIcon(file.file_type)} size={32} color="#f59e0b" />
              </View>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{file.original_name}</Text>
                <Text style={styles.fileMeta}>
                  {file.file_type} • {formatFileSize(file.file_size)}
                </Text>
                <Text style={styles.fileUploader}>
                  👤 {file.uploader_name || 'Inconnu'} • {file.uploader_role || 'Utilisateur'}
                </Text>
                <Text style={styles.fileDate}>
                  📅 {new Date(file.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.fileActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(file.id)}
                >
                  <Icon name="checkmark" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Approuver</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => {
                    setSelectedFile(file);
                    setRejectModalVisible(true);
                  }}
                >
                  <Icon name="close" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Rejeter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de rejet */}
      <Modal visible={rejectModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rejeter le fichier</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Fichier: {selectedFile?.original_name}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Raison du rejet (optionnel)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={rejectReason}
                onChangeText={setRejectReason}
                placeholder="Expliquez pourquoi ce fichier est rejeté..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity style={styles.rejectConfirmBtn} onPress={handleReject}>
              <Text style={styles.rejectConfirmText}>Confirmer le rejet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#10b981', fontSize: 18, marginTop: 16 },
  emptySubtext: { color: '#888', fontSize: 14, marginTop: 8 },
  fileCard: { 
    flexDirection: 'row', 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    gap: 16,
  },
  fileIcon: { width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 4 },
  fileMeta: { fontSize: 11, color: '#f59e0b', marginBottom: 4 },
  fileUploader: { fontSize: 10, color: '#888', marginBottom: 2 },
  fileDate: { fontSize: 10, color: '#666' },
  fileActions: { justifyContent: 'center', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, width: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalSubtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#fff', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  rejectConfirmBtn: { backgroundColor: '#ef4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectConfirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});