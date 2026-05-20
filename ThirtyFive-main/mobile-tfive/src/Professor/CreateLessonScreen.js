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
import { lessonService } from '../services/api';

export default function CreateLessonScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('text');
  const [loading, setLoading] = useState(false);

  const subjects = ['Mathématiques', 'Physique', 'Chimie', 'Biologie', 'Informatique', 'Français', 'Anglais', 'Histoire'];
  const classLevels = ['Primaire', 'Collège', 'Lycée', 'Université', 'Tous niveaux'];
  const emojis = ['📚', '📖', '🔬', '🧮', '🎨', '💻', '🌍', '🎵', '🏃', '🧪'];

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/html',
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        setSelectedFile(result);
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

    setLoading(true);
    try {
      let response;
      
      if (uploadMethod === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('subject', subject);
        formData.append('class_level', classLevel);
        formData.append('emoji', emoji);
        formData.append('file', {
          uri: selectedFile.uri,
          type: 'text/html',
          name: selectedFile.name,
        });
        response = await lessonService.createLesson(formData);
      } else {
        response = await lessonService.createLesson({
          title,
          description,
          subject,
          class_level: classLevel,
          emoji,
          html_content: htmlContent || '<div>Contenu par défaut</div>',
        });
      }

      Alert.alert('Succès', 'Leçon créée avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Erreur création:', error);
      Alert.alert('Erreur', 'Impossible de créer la leçon');
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
        <Text style={styles.title}>📝 Nouvelle leçon</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodBtn, uploadMethod === 'text' && styles.methodActive]}
            onPress={() => setUploadMethod('text')}
          >
            <Icon name="code-outline" size={20} color={uploadMethod === 'text' ? '#fff' : '#888'} />
            <Text style={[styles.methodText, uploadMethod === 'text' && styles.methodTextActive]}>Écrire</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodBtn, uploadMethod === 'file' && styles.methodActive]}
            onPress={() => setUploadMethod('file')}
          >
            <Icon name="cloud-upload-outline" size={20} color={uploadMethod === 'file' ? '#fff' : '#888'} />
            <Text style={[styles.methodText, uploadMethod === 'file' && styles.methodTextActive]}>Upload HTML</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Ex: Introduction aux vagues"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Décrivez la leçon..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
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
            <Text style={styles.label}>Niveau</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={classLevel}
                onValueChange={setClassLevel}
                style={styles.picker}
                dropdownIconColor="#888"
              >
                <Picker.Item label="Sélectionner" value="" />
                {classLevels.map(l => <Picker.Item key={l} label={l} value={l} />)}
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Émoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {emojis.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, emoji === e && styles.emojiActive]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {uploadMethod === 'text' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Code HTML</Text>
            <TextInput
              style={[styles.input, styles.codeArea]}
              value={htmlContent}
              onChangeText={setHtmlContent}
              placeholder="<div>Contenu interactif...</div>"
              placeholderTextColor="#666"
              multiline
              numberOfLines={8}
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fichier HTML</Text>
            <TouchableOpacity style={styles.filePicker} onPress={pickDocument}>
              <Icon name="document-outline" size={24} color="#646cff" />
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : 'Sélectionner un fichier HTML'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Créer la leçon</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Import Picker
import { Picker } from '@react-native-picker/picker';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { padding: 8, marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  form: { padding: 20 },
  methodSelector: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  methodBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', gap: 8 },
  methodActive: { backgroundColor: '#646cff' },
  methodText: { color: '#888', fontSize: 14 },
  methodTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#fff', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  codeArea: { fontFamily: 'monospace', minHeight: 150, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  pickerWrapper: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden' },
  picker: { color: '#fff', height: 50 },
  emojiRow: { flexDirection: 'row', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  emojiActive: { backgroundColor: '#646cff' },
  emojiText: { fontSize: 24 },
  filePicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderWidth: 1, borderColor: '#646cff', borderStyle: 'dashed', borderRadius: 12, gap: 12 },
  filePickerText: { color: '#646cff', fontSize: 14 },
  submitBtn: { backgroundColor: '#10b981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});