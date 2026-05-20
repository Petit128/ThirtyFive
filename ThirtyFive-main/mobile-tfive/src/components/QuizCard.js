import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

export default function QuizCard({ quiz, onPress }) {
  const getTypeInfo = () => {
    switch (quiz.exam_type) {
      case 'exam':
        return { icon: 'document-text-outline', color: '#f59e0b', label: 'Examen' };
      case 'assignment':
        return { icon: 'create-outline', color: '#10b981', label: 'Devoir' };
      default:
        return { icon: 'help-circle-outline', color: '#646cff', label: 'Quiz' };
    }
  };

  const typeInfo = getTypeInfo();

  const getStatusColor = () => {
    if (quiz.your_score === null) return '#888';
    if (quiz.your_score >= (quiz.passing_score || 60)) return '#10b981';
    return '#ef4444';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(quiz)}>
      <View style={styles.header}>
        <View style={[styles.typeIcon, { backgroundColor: typeInfo.color + '20' }]}>
          <Icon name={typeInfo.icon} size={24} color={typeInfo.color} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{quiz.title}</Text>
          <Text style={styles.typeLabel}>{typeInfo.label}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {quiz.description || 'Testez vos connaissances'}
      </Text>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Icon name="time-outline" size={14} color="#888" />
          <Text style={styles.infoText}>{quiz.time_limit || 30} min</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="target-outline" size={14} color="#888" />
          <Text style={styles.infoText}>{(quiz.passing_score || 60)}% requis</Text>
        </View>
        <View style={styles.infoItem}>
          <Icon name="repeat-outline" size={14} color="#888" />
          <Text style={styles.infoText}>{quiz.max_attempts || 1} tentative(s)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {quiz.your_score !== null ? (
          <View style={[styles.scoreBadge, { backgroundColor: getStatusColor() + '20' }]}>
            <Text style={[styles.scoreText, { color: getStatusColor() }]}>
              Votre score: {quiz.your_score}%
            </Text>
          </View>
        ) : (
          <View style={styles.notAttempted}>
            <Text style={styles.notAttemptedText}>Pas encore tenté</Text>
          </View>
        )}
        <Icon name="chevron-forward" size={20} color="#888" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeLabel: {
    color: '#888',
    fontSize: 12,
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: '#888',
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notAttempted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  notAttemptedText: {
    color: '#888',
    fontSize: 12,
  },
});