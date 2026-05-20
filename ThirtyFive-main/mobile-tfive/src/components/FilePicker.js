import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons as Icon } from '@expo/vector-icons';

export default function FilePicker({ onFileSelected, buttonText = 'Sélectionner un fichier' }) {
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.type === 'success') {
        onFileSelected(result);
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
    }
  };

  return (
    <TouchableOpacity style={styles.pickerButton} onPress={pickDocument}>
      <Icon name="document-outline" size={24} color="#646cff" />
      <Text style={styles.pickerText}>{buttonText}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#646cff',
    borderStyle: 'dashed',
    borderRadius: 10,
    gap: 8,
    marginVertical: 12,
  },
  pickerText: {
    color: '#646cff',
    fontSize: 14,
  },
});