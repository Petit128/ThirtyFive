import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons as Icon } from '@expo/vector-icons';
import { professorService } from '../services/api';

export default function CreateQuizScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [timeLimit, setTimeLimit] = useState('30');
  const [passingScore, setPassingScore] = useState('60');
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [allowRetry, setAllowRetry] = useState(false);
  const [examType, setExamType] = useState('quiz');
  const [instructions, setInstructions] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    points: '1',
  });
  const [examFile, setExamFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const subjects = ['Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Informatique', 'Français', 'Anglais', 'Histoire'];

  const addQuestion = () => {
    if (!currentQuestion.text) {
      Alert.alert('Erreur', 'Veuillez saisir une question');
      return;
    }
    if (!currentQuestion.correctAnswer) {
      Alert.alert('Erreur', 'Veuillez indiquer la réponse correcte');
      return;
    }

    setQuestions([...questions, { ...currentQuestion, id: Date.now() }]);
    setCurrentQuestion({
      text: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: '1',
    });
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const pickExamFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        setExamFile(result);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title) {
      Alert.alert('Erreur', 'Le titre est requis');
      return;
    }

    if (examType === 'quiz' && questions.length === 0) {
      Alert.alert('Erreur', 'Ajoutez au moins une question');
      return;
    }

    if ((examType === 'exam' || examType === 'assignment') && !examFile) {
      Alert.alert('Erreur', 'Veuillez uploader le fichier de l\'examen');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('subject', subject);
      formData.append('time_limit', parseInt(timeLimit));
      formData.append('passing_score', parseInt(passingScore));
      formData.append('max_attempts', parseInt(maxAttempts));
      formData.append('allow_retry', allowRetry);
      formData.append('exam_type', examType);
      formData.append('instructions', instructions);

      if (examFile && (examType === 'exam' || examType === 'assignment')) {
        formData.append('exam_file', {
          uri: examFile.uri,
          type: examFile.mimeType,
          name: examFile.name,
        });
      }

      if (examType === 'quiz') {
        formData.append('questions', JSON.stringify(questions.map(q => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: parseInt(q.points),
        }))));
      }

      await professorService.createQuiz(formData);
      Alert.alert('Succès', 'Quiz/Examen créé avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur création:', error);
      Alert.alert('Erreur', 'Impossible de créer le quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>📝 Créer un quiz/examen</Text>
      </View>

      <View style={styles.form}>
        {/* Type selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, examType === 'quiz' && styles.typeActive]}
            onPress={() => setExamType('quiz')}
          >
            <Icon name="help-circle-outline" size={20} color={examType === 'quiz' ? '#fff' : '#888'} />
            <Text style={[styles.typeText, examType === 'quiz' && styles.typeTextActive]}>Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, examType === 'exam' && styles.typeActive]}
            onPress={() => setExamType('exam')}
          >
            <Icon name="document-text-outline" size={20} color={examType === 'exam' ? '#fff' : '#888'} />
            <Text style={[styles.typeText, examType === 'exam' && styles.typeTextActive]}>Examen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, examType === 'assignment' && styles.typeActive]}
            onPress={() => setExamType('assignment')}
          >
            <Icon name="create-outline" size={20} color={examType === 'assignment' ? '#fff' : '#888'} />
            <Text style={[styles.typeText, examType === 'assignment' && styles.typeTextActive]}>Devoir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Examen final - Chapitre 3"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Matière</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={subject}
                onValueChange={setSubject}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                <Picker.Item label="Sélectionner" value="" />
                {subjects.map(s => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Temps (min)</Text>
            <TextInput
              style={styles.input}
              value={timeLimit}
              onChangeText={setTimeLimit}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Score requis (%)</Text>
            <TextInput
              style={styles.input}
              value={passingScore}
              onChangeText={setPassingScore}
              keyboardType="numeric"
              placeholder="60"
              placeholderTextColor="#666"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Tentatives max</Text>
            <TextInput
              style={styles.input}
              value={maxAttempts}
              onChangeText={setMaxAttempts}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAllowRetry(!allowRetry)}>
          <View style={[styles.checkbox, allowRetry && styles.checkboxChecked]}>
            {allowRetry && <Icon name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>Autoriser les tentatives multiples</Text>
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Instructions détaillées..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brève description..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={2}
          />
        </View>

        {(examType === 'exam' || examType === 'assignment') && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fichier de l'examen</Text>
            <TouchableOpacity style={styles.filePicker} onPress={pickExamFile}>
              <Icon name="document-outline" size={24} color="#646cff" />
              <Text style={styles.filePickerText}>
                {examFile ? examFile.name : 'PDF, Word, Excel, TXT'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {examType === 'quiz' && (
          <>
            <View style={styles.separator}>
              <Text style={styles.separatorText}>Questions ({questions.length})</Text>
            </View>

            {questions.map((q, idx) => (
              <View key={q.id} style={styles.questionItem}>
                <Text style={styles.questionNum}>{idx + 1}.</Text>
                <Text style={styles.questionText}>{q.text.substring(0, 50)}...</Text>
                <Text style={styles.questionPoints}>{q.points} pt(s)</Text>
                <TouchableOpacity onPress={() => removeQuestion(idx)}>
                  <Icon name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addQuestionSection}>
              <Text style={styles.sectionTitle}>➕ Nouvelle question</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Texte de la question</Text>
                <TextInput
                  style={styles.input}
                  value={currentQuestion.text}
                  onChangeText={(text) => setCurrentQuestion({ ...currentQuestion, text })}
                  placeholder="Ex: Quel est le résultat de 2 + 2 ?"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Points</Text>
                <TextInput
                  style={styles.input}
                  value={currentQuestion.points}
                  onChangeText={(points) => setCurrentQuestion({ ...currentQuestion, points })}
                  keyboardType="numeric"
                  placeholder="1"
                  placeholderTextColor="#666"
                />
              </View>

              <Text style={styles.label}>Options</Text>
              {currentQuestion.options.map((opt, idx) => (
                <View key={idx} style={styles.optionRow}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}.</Text>
                  <TextInput
                    style={styles.optionInput}
                    value={opt}
                    onChangeText={(text) => {
                      const newOptions = [...currentQuestion.options];
                      newOptions[idx] = text;
                      setCurrentQuestion({ ...currentQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity
                    style={[styles.setCorrectBtn, currentQuestion.correctAnswer === opt && styles.setCorrectActive]}
                    onPress={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: opt })}
                  >
                    <Text style={styles.setCorrectText}>
                      {currentQuestion.correctAnswer === opt ? '✓' : 'Définir'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addBtn} onPress={addQuestion}>
                <Icon name="add-circle-outline" size={20} color="#646cff" />
                <Text style={styles.addBtnText}>Ajouter la question</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              Créer {examType === 'exam' ? 'l\'examen' : examType === 'assignment' ? 'le devoir' : 'le quiz'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import { Picker } from '@react-native-picker/picker';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { padding: 8, marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', gap: 8 },
  typeActive: { backgroundColor: '#646cff' },
  typeText: { color: '#888', fontSize: 14 },
  typeTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { textAlignVertical: 'top', minHeight: 80 },
  row: { flexDirection: 'row', gap: 12 },
  pickerWrapper: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#fff', height: 50 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#646cff', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#646cff' },
  checkboxLabel: { color: '#fff', fontSize: 14 },
  filePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderWidth: 1, borderColor: '#646cff', borderStyle: 'dashed', borderRadius: 12, gap: 12 },
  filePickerText: { color: '#646cff', fontSize: 14 },
  separator: { marginVertical: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 20 },
  separatorText: { color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center' },
  questionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 8, gap: 12 },
  questionNum: { color: '#646cff', fontWeight: 'bold', width: 30 },
  questionText: { flex: 1, color: '#fff', fontSize: 14 },
  questionPoints: { color: '#888', fontSize: 12, width: 50 },
  addQuestionSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  optionLetter: { color: '#888', width: 25, fontWeight: 'bold' },
  optionInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14 },
  setCorrectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(100,108,255,0.2)' },
  setCorrectActive: { backgroundColor: '#10b981' },
  setCorrectText: { color: '#fff', fontSize: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderWidth: 1, borderColor: '#646cff', borderStyle: 'dashed', borderRadius: 10, marginTop: 16 },
  addBtnText: { color: '#646cff', fontSize: 14 },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 30, marginBottom: 40 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});