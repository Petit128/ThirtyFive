import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { professorService, gradeService } from '../services/api';

export default function ProfessorDashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'students') {
        const res = await professorService.getStudents();
        setStudents(res.data.students || []);
      } else if (activeTab === 'analytics') {
        const res = await professorService.getAnalytics();
        setAnalytics(res.data.analytics);
      } else if (activeTab === 'lessons') {
        const res = await professorService.getMyLessons();
        setLessons(res.data.lessons || []);
      } else if (activeTab === 'quizzes') {
        const res = await professorService.getMyQuizzes();
        setQuizzes(res.data.quizzes || []);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#888';
    if (grade >= 90) return '#10b981';
    if (grade >= 75) return '#3b82f6';
    if (grade >= 60) return '#f59e0b';
    return '#ef4444';
  };

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
        <Text style={styles.welcome}>👨‍🏫 Bonjour, {user?.name}</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutBtnText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Icon name="people" size={20} color={activeTab === 'students' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>Étudiants</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Icon name="stats-chart" size={20} color={activeTab === 'analytics' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>Analyses</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => setActiveTab('lessons')}
        >
          <Icon name="book" size={20} color={activeTab === 'lessons' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>Leçons</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]}
          onPress={() => setActiveTab('quizzes')}
        >
          <Icon name="help-circle" size={20} color={activeTab === 'quizzes' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'quizzes' && styles.activeTabText]}>Quiz</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'students' && (
          <View>
            <TouchableOpacity
              style={styles.gradeAllBtn}
              onPress={() => navigation.navigate('GradeStudents')}
            >
              <Icon name="create-outline" size={20} color="#fff" />
              <Text style={styles.gradeAllBtnText}>Noter des étudiants</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>📚 Liste des étudiants ({students.length})</Text>
            {students.map(student => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentAvatar}>
                  <Text style={styles.avatarText}>{student.name?.charAt(0).toUpperCase() || '?'}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentEmail}>{student.email}</Text>
                  <Text style={styles.studentClass}>{student.class_name || 'Non assigné'}</Text>
                </View>
                <View style={styles.studentActions}>
                  <Text style={[styles.studentGrade, { color: getGradeColor(student.average_grade) }]}>
                    {student.average_grade ? `${Math.round(student.average_grade)}%` : '—'}
                  </Text>
                  <TouchableOpacity
                    style={styles.gradeBtn}
                    onPress={() => navigation.navigate('GradeStudents', { studentId: student.id })}
                  >
                    <Icon name="create-outline" size={20} color="#10b981" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'analytics' && analytics && (
          <View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(analytics.classStats?.avg_score || 0)}%</Text>
                <Text style={styles.statLabel}>Moyenne générale</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round(analytics.classStats?.max_score || 0)}%</Text>
                <Text style={styles.statLabel}>Meilleure note</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {analytics.classStats?.total_grades > 0
                    ? Math.round((analytics.classStats.passed_count / analytics.classStats.total_grades) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Taux de réussite</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{analytics.classStats?.total_students || 0}</Text>
                <Text style={styles.statLabel}>Étudiants</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>🏆 Top 10 étudiants</Text>
            {analytics.topStudents?.map((student, idx) => (
              <View key={student.id} style={styles.rankingItem}>
                <Text style={styles.rank}>#{idx + 1}</Text>
                <Text style={styles.rankName}>{student.name}</Text>
                <Text style={styles.rankClass}>{student.class_name}</Text>
                <Text style={[styles.rankGrade, { color: getGradeColor(student.avg_grade) }]}>
                  {Math.round(student.avg_grade)}%
                </Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>📈 Performance par matière</Text>
            {analytics.subjectPerformance?.map(subject => (
              <View key={subject.subject} style={styles.subjectItem}>
                <Text style={styles.subjectName}>{subject.subject}</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${subject.avg_grade}%`, backgroundColor: getGradeColor(subject.avg_grade) }]} />
                </View>
                <Text style={styles.subjectGrade}>{Math.round(subject.avg_grade)}%</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'lessons' && (
          <View>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateLesson')}
            >
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Créer une leçon</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>📚 Mes leçons ({lessons.length})</Text>
            {lessons.map(lesson => (
              <View key={lesson.id} style={styles.lessonCard}>
                <Text style={styles.lessonEmoji}>{lesson.emoji || '📚'}</Text>
                <View style={styles.lessonInfo}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonMeta}>{lesson.subject} • {lesson.class_level}</Text>
                  <View style={styles.lessonStats}>
                    <Text>👁️ {lesson.views || 0}</Text>
                    <Text>📥 {lesson.downloads || 0}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate('LessonViewer', { lessonId: lesson.id })}
                >
                  <Icon name="eye-outline" size={20} color="#646cff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'quizzes' && (
          <View>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('CreateQuiz')}
            >
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createBtnText}>Créer un quiz/examen</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>📝 Mes quiz/examens ({quizzes.length})</Text>
            {quizzes.map(quiz => (
              <View key={quiz.id} style={styles.quizCard}>
                <View style={styles.quizHeader}>
                  <Text style={styles.quizTitle}>{quiz.title}</Text>
                  <View style={[styles.quizTypeBadge, quiz.exam_type === 'exam' ? styles.examBadge : styles.quizBadge]}>
                    <Text style={styles.quizTypeText}>
                      {quiz.exam_type === 'exam' ? 'Examen' : quiz.exam_type === 'assignment' ? 'Devoir' : 'Quiz'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.quizDescription}>{quiz.description}</Text>
                <View style={styles.quizStats}>
                  <Text>⏱️ {quiz.time_limit} min</Text>
                  <Text>🎯 {quiz.passing_score}%</Text>
                  <Text>📊 {quiz.attempts_count || 0} tentatives</Text>
                </View>
                <TouchableOpacity
                  style={styles.responsesBtn}
                  onPress={() => navigation.navigate('QuizResponses', { quizId: quiz.id, quizTitle: quiz.title })}
                >
                  <Icon name="list-outline" size={16} color="#fff" />
                  <Text style={styles.responsesBtnText}>Voir les réponses ({quiz.attempts_count || 0})</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: 'rgba(255,255,255,0.05)' },
  welcome: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.2)' },
  logoutBtnText: { color: '#ef4444', fontWeight: '600' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', gap: 8 },
  activeTab: { backgroundColor: '#646cff' },
  tabText: { color: '#888', fontSize: 14 },
  activeTabText: { color: '#fff' },
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16, marginTop: 8 },
  gradeAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 12, marginBottom: 20, gap: 8 },
  gradeAllBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, gap: 16 },
  studentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#646cff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  studentInfo: { flex: 1 },
  studentName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  studentEmail: { color: '#888', fontSize: 12, marginBottom: 2 },
  studentClass: { color: '#666', fontSize: 11 },
  studentActions: { alignItems: 'flex-end', gap: 8 },
  studentGrade: { fontSize: 14, fontWeight: 'bold' },
  gradeBtn: { padding: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#646cff' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  rankingItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, marginBottom: 8, gap: 12 },
  rank: { width: 40, color: '#646cff', fontWeight: 'bold' },
  rankName: { flex: 1, color: '#fff', fontSize: 14 },
  rankClass: { color: '#888', fontSize: 12, marginRight: 12 },
  rankGrade: { fontWeight: 'bold', fontSize: 14, width: 50, textAlign: 'right' },
  subjectItem: { marginBottom: 16 },
  subjectName: { color: '#fff', fontSize: 14, marginBottom: 6 },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  subjectGrade: { color: '#888', fontSize: 12, textAlign: 'right' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#646cff', borderRadius: 12, paddingVertical: 12, marginBottom: 20, gap: 8 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  lessonCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, gap: 16 },
  lessonEmoji: { fontSize: 32 },
  lessonInfo: { flex: 1 },
  lessonTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  lessonMeta: { color: '#888', fontSize: 12, marginBottom: 6 },
  lessonStats: { flexDirection: 'row', gap: 16, color: '#888', fontSize: 11 },
  viewBtn: { padding: 8 },
  quizCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 },
  quizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  quizTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1 },
  quizTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  examBadge: { backgroundColor: 'rgba(245,158,11,0.2)' },
  quizBadge: { backgroundColor: 'rgba(100,108,255,0.2)' },
  quizTypeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  quizDescription: { color: '#aaa', fontSize: 13, marginBottom: 8 },
  quizStats: { flexDirection: 'row', gap: 16, marginBottom: 12, color: '#888', fontSize: 11 },
  responsesBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#646cff', borderRadius: 10, paddingVertical: 10, gap: 8 },
  responsesBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});