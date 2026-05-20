import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons as Icon } from '@expo/vector-icons';
import { professorService } from '../services/api';

export default function FileUploader({ onUploadComplete, buttonText = 'Uploader un fichier' }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setSelectedFile(result);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('Erreur', 'Sélectionnez un fichier d\'abord');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', {
      uri: selectedFile.uri,
      type: selectedFile.mimeType || 'application/octet-stream',
      name: selectedFile.name,
    });

    try {
      const response = await professorService.uploadFile(formData);
      Alert.alert('Succès', 'Fichier uploadé avec succès');
      setSelectedFile(null);
      if (onUploadComplete) onUploadComplete(response.data.file);
    } catch (error) {
      console.error('Erreur upload:', error);
      Alert.alert('Erreur', 'Impossible d\'uploader le fichier');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.pickerButton} onPress={pickDocument} disabled={uploading}>
        <Icon name="document-outline" size={24} color="#646cff" />
        <Text style={styles.pickerButtonText}>
          {selectedFile ? selectedFile.name : buttonText}
        </Text>
      </TouchableOpacity>

      {selectedFile && (
        <View style={styles.fileInfo}>
          <Text style={styles.fileName}>{selectedFile.name}</Text>
          <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.uploadButton, (!selectedFile || uploading) && styles.disabledButton]}
        onPress={uploadFile}
        disabled={!selectedFile || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Icon name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Uploader</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(100,108,255,0.3)',
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 12,
  },
  pickerButtonText: {
    color: '#646cff',
    fontSize: 14,
  },
  fileInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(100,108,255,0.1)',
    borderRadius: 8,
  },
  fileName: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  fileSize: {
    color: '#888',
    fontSize: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#646cff',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});