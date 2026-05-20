import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { professorService } from '../services/api';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function QuizResponsesScreen({ route, navigation }) {
  const { quizId, quizTitle, examType } = route.params;
  const { user } = useAuth();
  const [responses, setResponses] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const response = await professorService.getQuizResponses(quizId);
      setResponses(response.data.responses || []);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erreur chargement réponses:', error);
      Alert.alert('Erreur', 'Impossible de charger les réponses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResponses();
  };

  const handleGrade = async () => {
    if (!gradeScore) {
      Alert.alert('Erreur', 'Veuillez entrer une note');
      return;
    }

    const scoreNum = parseInt(gradeScore);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      Alert.alert('Erreur', 'La note doit être comprise entre 0 et 100');
      return;
    }

    setSubmitting(true);
    try {
      await professorService.gradeExam(quizId, selectedResponse.user_id, {
        score: scoreNum,
        feedback: gradeFeedback,
      });
      Alert.alert('Succès', 'Note enregistrée');
      setGradeModalVisible(false);
      setSelectedResponse(null);
      setGradeScore('');
      setGradeFeedback('');
      loadResponses();
    } catch (error) {
      console.error('Erreur notation:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible d\'enregistrer la note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      const fileUri = `http://localhost:5000${filePath}`;
      const downloadDest = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(fileUri, downloadDest);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Info', 'Partage non disponible sur cet appareil');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier');
    }
  };

  const getScoreColor = (score) => {
    if (score === null || score === undefined) return '#94a3b8';
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreLabel = (score) => {
    if (score === null) return 'Non noté';
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Très bien';
    if (score >= 60) return 'Satisfaisant';
    if (score >= 40) return 'Insuffisant';
    return 'À améliorer';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredResponses = responses.filter(response => {
    const matchSearch = response.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       response.student_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || 
      (filterStatus === 'graded' && response.score !== null) ||
      (filterStatus === 'pending' && response.score === null);
    return matchSearch && matchStatus;
  });

  const totalStudents = responses.length;
  const gradedCount = responses.filter(r => r.score !== null).length;
  const averageScore = stats?.average_score || 
    (responses.length > 0 
      ? Math.round(responses.reduce((acc, r) => acc + (r.score || 0), 0) / (responses.filter(r => r.score !== null).length || 1))
      : 0);
  const passRate = stats?.passed_count ? Math.round((stats.passed_count / (responses.filter(r => r.score !== null).length || 1)) * 100) : 0;

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{quizTitle}</Text>
          <Text style={styles.headerSubtitle}>
            {examType === 'exam' ? 'Examen écrit' : examType === 'assignment' ? 'Devoir' : 'Quiz'} - {responses.length} réponse(s)
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round(averageScore)}%</Text>
          <Text style={styles.statLabel}>Moyenne</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{passRate}%</Text>
          <Text style={styles.statLabel}>Réussite</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{gradedCount}/{totalStudents}</Text>
          <Text style={styles.statLabel}>Notés</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.filterBar}>
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm !== '' && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Icon name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.statusFilter}>
          <TouchableOpacity
            style={[styles.filterBtn, filterStatus === 'all' && styles.filterActive]}
            onPress={() => setFilterStatus('all')}
          >
            <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>Tous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterStatus === 'pending' && styles.filterActive]}
            onPress={() => setFilterStatus('pending')}
          >
            <Text style={[styles.filterText, filterStatus === 'pending' && styles.filterTextActive]}>En attente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, filterStatus === 'graded' && styles.filterActive]}
            onPress={() => setFilterStatus('graded')}
          >
            <Text style={[styles.filterText, filterStatus === 'graded' && styles.filterTextActive]}>Notés</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#646cff" />}
      >
        {filteredResponses.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Aucune réponse trouvée</Text>
            {searchTerm !== '' && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Text style={styles.clearSearchText}>Effacer la recherche</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredResponses.map((response) => (
            <View key={response.id} style={styles.responseCard}>
              <View style={styles.responseHeader}>
                <View style={styles.studentInfo}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.avatarText}>
                      {response.student_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.studentName}>{response.student_name}</Text>
                    <Text style={styles.studentEmail}>{response.student_email}</Text>
                    {response.class_name && (
                      <Text style={styles.studentClass}>{response.class_name}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.responseScore}>
                  {response.score !== null ? (
                    <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(response.score) + '20' }]}>
                      <Text style={[styles.scoreText, { color: getScoreColor(response.score) }]}>
                        {response.score}%
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.gradeBtn}
                      onPress={() => {
                        setSelectedResponse(response);
                        setGradeScore(response.score?.toString() || '');
                        setGradeFeedback(response.feedback || '');
                        setGradeModalVisible(true);
                      }}
                    >
                      <Icon name="create-outline" size={16} color="#10b981" />
                      <Text style={styles.gradeBtnText}>Noter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.responseDetails}>
                <Text style={styles.responseDate}>
                  <Icon name="calendar-outline" size={12} color="#888" /> {formatDate(response.submitted_at || response.completed_at)}
                </Text>
              </View>

              {response.answer_text && (
                <View style={styles.answerSection}>
                  <Text style={styles.answerLabel}>✏️ Réponse:</Text>
                  <Text style={styles.answerText}>{response.answer_text}</Text>
                </View>
              )}

              {response.answer_file_path && (
                <TouchableOpacity 
                  style={styles.fileSection}
                  onPress={() => handleDownloadFile(response.answer_file_path, response.answer_file_name)}
                >
                  <Icon name="document-outline" size={20} color="#646cff" />
                  <Text style={styles.fileName}>{response.answer_file_name}</Text>
                  <Icon name="download-outline" size={16} color="#888" />
                </TouchableOpacity>
              )}

              {response.feedback && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>💬 Feedback:</Text>
                  <Text style={styles.feedbackText}>{response.feedback}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal de notation */}
      <Modal visible={gradeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Noter {selectedResponse?.student_name}</Text>
              <TouchableOpacity onPress={() => setGradeModalVisible(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (sur 100)</Text>
              <TextInput
                style={styles.input}
                value={gradeScore}
                onChangeText={setGradeScore}
                keyboardType="numeric"
                placeholder="0-100"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Feedback</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={gradeFeedback}
                onChangeText={setGradeFeedback}
                placeholder="Commentaire pour l'étudiant..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleGrade}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Enregistrer la note</Text>
              )}
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
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: 'rgba(26,26,46,0.95)', 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  backButton: { padding: 8, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#646cff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  filterBar: { paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, paddingVertical: 10, color: '#fff', fontSize: 14 },
  statusFilter: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  filterActive: { backgroundColor: '#646cff' },
  filterText: { color: '#888', fontSize: 12 },
  filterTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 16 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  clearSearchText: { color: '#646cff', fontSize: 14, marginTop: 12 },
  responseCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  studentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  studentAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#646cff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  studentName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  studentEmail: { color: '#888', fontSize: 12, marginTop: 2 },
  studentClass: { color: '#666', fontSize: 11, marginTop: 2 },
  responseScore: { alignItems: 'flex-end' },
  scoreBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  scoreText: { fontSize: 14, fontWeight: 'bold' },
  gradeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  gradeBtnText: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  responseDetails: { marginBottom: 12 },
  responseDate: { color: '#888', fontSize: 11 },
  answerSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  answerLabel: { color: '#f59e0b', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  answerText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  fileSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: 'rgba(100,108,255,0.1)', borderRadius: 10 },
  fileName: { flex: 1, color: '#646cff', fontSize: 12 },
  feedbackSection: { marginTop: 12, padding: 12, backgroundColor: 'rgba(100,108,255,0.05)', borderRadius: 10 },
  feedbackLabel: { color: '#646cff', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  feedbackText: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a2e', borderRadius: 20, padding: 20, width: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: '#fff', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  disabledBtn: { opacity: 0.5 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});