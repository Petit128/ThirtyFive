import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { gradeService } from '../services/api';

export default function GradesScreen() {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('grades');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gradesRes, reportRes] = await Promise.all([
        gradeService.getMyGrades(),
        gradeService.getMyReport(),
      ]);
      setGrades(gradesRes.data.grades || []);
      setStats(gradesRes.data.stats);
      setReport(reportRes.data.report);
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getLetterGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 75) return 'B+';
    if (percentage >= 70) return 'B';
    if (percentage >= 65) return 'C+';
    if (percentage >= 60) return 'C';
    if (percentage >= 55) return 'D+';
    if (percentage >= 50) return 'D';
    return 'F';
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
        <Text style={styles.title}>📊 Mes résultats</Text>
        <Text style={styles.subtitle}>{user?.name}</Text>
      </View>

      {/* Stats rapides */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(stats.average_percentage || 0)}%</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.best_score || 0}%</Text>
            <Text style={styles.statLabel}>Meilleure</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total_exams || 0}</Text>
            <Text style={styles.statLabel}>Examens</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'grades' && styles.activeTab]}
          onPress={() => setActiveTab('grades')}
        >
          <Text style={[styles.tabText, activeTab === 'grades' && styles.activeTabText]}>Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'report' && styles.activeTab]}
          onPress={() => setActiveTab('report')}
        >
          <Text style={[styles.tabText, activeTab === 'report' && styles.activeTabText]}>Rapport</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'grades' && (
          <View>
            {grades.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="document-text-outline" size={64} color="#444" />
                <Text style={styles.emptyText}>Aucune note</Text>
              </View>
            ) : (
              grades.map(grade => {
                const percentage = grade.percentage || (grade.grade / grade.max_grade) * 100;
                const color = getGradeColor(percentage);
                return (
                  <View key={grade.id} style={styles.gradeCard}>
                    <View style={styles.gradeHeader}>
                      <Text style={styles.gradeTitle}>
                        {grade.lesson_title || grade.quiz_title || 'Examen'}
                      </Text>
                      <View style={[styles.typeBadge, grade.exam_type === 'exam' ? styles.examBadge : styles.quizBadge]}>
                        <Text style={styles.typeBadgeText}>
                          {grade.exam_type === 'exam' ? 'Examen' : 'Quiz'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreContainer}>
                      <View style={[styles.scoreCircle, { borderColor: color }]}>
                        <Text style={[styles.scoreValue, { color }]}>{Math.round(percentage)}%</Text>
                        <Text style={styles.scoreLetter}>{getLetterGrade(percentage)}</Text>
                        <Text style={styles.scoreRaw}>{grade.grade}/{grade.max_grade}</Text>
                      </View>
                    </View>
                    <Text style={styles.gradeDate}>
                      📅 {new Date(grade.graded_at).toLocaleDateString('fr-FR')}
                    </Text>
                    {grade.comment && (
                      <Text style={styles.gradeComment}>💬 {grade.comment}</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'report' && report && (
          <View>
            {/* Vue d'ensemble */}
            <View style={styles.reportOverview}>
              <View style={styles.overallScore}>
                <Text style={styles.overallValue}>{Math.round(report.overall?.overall_average || 0)}%</Text>
                <Text style={styles.overallLabel}>Moyenne générale</Text>
              </View>
              <View style={styles.overallStats}>
                <Text>📝 {report.overall?.total_exams || 0} examens</Text>
                <Text>✅ {report.overall?.passed_count || 0} réussis</Text>
                <Text>❌ {report.overall?.failed_count || 0} échecs</Text>
              </View>
            </View>

            {/* Performance par matière */}
            <Text style={styles.sectionTitle}>📚 Par matière</Text>
            {report.by_subject?.map((subject, idx) => (
              <View key={idx} style={styles.subjectItem}>
                <View style={styles.subjectHeader}>
                  <Text style={styles.subjectName}>{subject.subject}</Text>
                  <Text style={[styles.subjectScore, { color: getGradeColor(subject.average) }]}>
                    {Math.round(subject.average)}%
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${subject.average}%`, backgroundColor: getGradeColor(subject.average) }]} />
                </View>
                <Text style={styles.subjectCount}>{subject.exam_count} examen(s)</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#646cff' },
  statLabel: { fontSize: 11, color: '#888' },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)' },
  activeTab: { backgroundColor: '#646cff' },
  tabText: { color: '#888', fontSize: 14 },
  activeTabText: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  gradeCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 16 },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  gradeTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  examBadge: { backgroundColor: 'rgba(245,158,11,0.2)' },
  quizBadge: { backgroundColor: 'rgba(100,108,255,0.2)' },
  typeBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  scoreContainer: { alignItems: 'center', marginBottom: 16 },
  scoreCircle: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
  scoreValue: { fontSize: 20, fontWeight: 'bold' },
  scoreLetter: { fontSize: 12, color: '#888' },
  scoreRaw: { fontSize: 10, color: '#666' },
  gradeDate: { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 8 },
  gradeComment: { fontSize: 12, color: '#aaa', fontStyle: 'italic', paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  reportOverview: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' },
  overallScore: { alignItems: 'center' },
  overallValue: { fontSize: 36, fontWeight: 'bold', color: '#646cff' },
  overallLabel: { fontSize: 12, color: '#888' },
  overallStats: { alignItems: 'flex-end', gap: 4, color: '#888', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 16 },
  subjectItem: { marginBottom: 20 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  subjectName: { color: '#fff', fontSize: 14 },
  subjectScore: { fontSize: 14, fontWeight: 'bold' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  subjectCount: { color: '#888', fontSize: 11 },
});