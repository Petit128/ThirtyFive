import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { professorService, gradeService } from '../services/api';

export default function GradeStudentsScreen({ route }) {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeForm, setGradeForm] = useState({
    grade: '',
    max_grade: '100',
    comment: '',
    feedback: '',
    exam_type: 'exam',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const res = await professorService.getStudents();
      setStudents(res.data.students || []);
    } catch (error) {
      console.error('Erreur chargement étudiants:', error);
      Alert.alert('Erreur', 'Impossible de charger les étudiants');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async () => {
    if (!gradeForm.grade) {
      Alert.alert('Erreur', 'Veuillez entrer une note');
      return;
    }

    setSubmitting(true);
    try {
      await gradeService.addGrade({
        user_id: selectedStudent.id,
        grade: parseInt(gradeForm.grade),
        max_grade: parseInt(gradeForm.max_grade),
        comment: gradeForm.comment,
        feedback: gradeForm.feedback,
        exam_type: gradeForm.exam_type,
      });
      Alert.alert('Succès', `Note de ${gradeForm.grade}/${gradeForm.max_grade} attribuée à ${selectedStudent.name}`);
      setSelectedStudent(null);
      setGradeForm({ grade: '', max_grade: '100', comment: '', feedback: '', exam_type: 'exam' });
    } catch (error) {
      console.error('Erreur attribution note:', error);
      Alert.alert('Erreur', 'Impossible d\'attribuer la note');
    } finally {
      setSubmitting(false);
    }
  };

  const getGradeColor = (grade) => {
    if (!grade) return '#888';
    if (grade >= 90) return '#10b981';
    if (grade >= 75) return '#3b82f6';
    if (grade >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  if (selectedStudent) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedStudent(null)} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>📝 Noter {selectedStudent.name}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type d'examen</Text>
            <View style={styles.typeSelector}>
              {['exam', 'quiz', 'homework', 'project'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, gradeForm.exam_type === type && styles.typeActive]}
                  onPress={() => setGradeForm({ ...gradeForm, exam_type: type })}
                >
                  <Text style={[styles.typeText, gradeForm.exam_type === type && styles.typeTextActive]}>
                    {type === 'exam' ? 'Examen' : type === 'quiz' ? 'Quiz' : type === 'homework' ? 'Devoir' : 'Projet'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Note obtenue</Text>
              <TextInput
                style={styles.input}
                value={gradeForm.grade}
                onChangeText={(grade) => setGradeForm({ ...gradeForm, grade })}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Note maximale</Text>
              <TextInput
                style={styles.input}
                value={gradeForm.max_grade}
                onChangeText={(max_grade) => setGradeForm({ ...gradeForm, max_grade })}
                keyboardType="numeric"
                placeholder="100"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Commentaire</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={gradeForm.comment}
              onChangeText={(comment) => setGradeForm({ ...gradeForm, comment })}
              placeholder="Ex: Examen final - Chapitre 3"
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Feedback (optionnel)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={gradeForm.feedback}
              onChangeText={(feedback) => setGradeForm({ ...gradeForm, feedback })}
              placeholder="Retour personnalisé pour l'étudiant..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleGradeSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Attribuer la note</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👨‍🎓 Noter les étudiants</Text>
      </View>

      <View style={styles.studentsList}>
        {students.map(student => (
          <TouchableOpacity
            key={student.id}
            style={styles.studentCard}
            onPress={() => setSelectedStudent(student)}
          >
            <View style={styles.studentAvatar}>
              <Text style={styles.avatarText}>
                {student.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.studentEmail}>{student.email}</Text>
              {student.average_grade && (
                <View style={styles.gradePreview}>
                  <Text style={[styles.gradeText, { color: getGradeColor(student.average_grade) }]}>
                    Moyenne: {Math.round(student.average_grade)}%
                  </Text>
                </View>
              )}
            </View>
            <Icon name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { padding: 8, marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  typeSelector: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  typeActive: { backgroundColor: '#646cff' },
  typeText: { color: '#888', fontSize: 12 },
  typeTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  studentsList: { padding: 20 },
  studentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, gap: 16 },
  studentAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#646cff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  studentInfo: { flex: 1 },
  studentName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 },
  studentEmail: { color: '#888', fontSize: 12, marginBottom: 4 },
  gradePreview: { marginTop: 4 },
  gradeText: { fontSize: 12 },
});