import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

export default function LessonCard({ lesson, onPress }) {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#888';
    }
  };

  const getFileTypeIcon = (type) => {
    switch (type) {
      case 'html': return 'code-slash';
      case 'css': return 'logo-css3';
      case 'javascript': return 'logo-javascript';
      case 'pdf': return 'document-text';
      case 'video': return 'videocam';
      default: return 'document';
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(lesson)}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{lesson.emoji || '📚'}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>{lesson.title}</Text>
          <View style={styles.meta}>
            <Text style={styles.metaText}>{lesson.subject || 'Général'}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>{lesson.class_level || 'Tous niveaux'}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {lesson.description || 'Aucune description'}
      </Text>

      <View style={styles.footer}>
        <View style={styles.stats}>
          <Icon name="eye-outline" size={14} color="#888" />
          <Text style={styles.statText}>{lesson.views || 0}</Text>
          <Icon name="download-outline" size={14} color="#888" style={styles.statIcon} />
          <Text style={styles.statText}>{lesson.downloads || 0}</Text>
          <Icon name="star-outline" size={14} color="#888" style={styles.statIcon} />
          <Text style={styles.statText}>{lesson.rating || 'Nouveau'}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Icon name={getFileTypeIcon(lesson.file_type)} size={12} color="#646cff" />
          <Text style={styles.typeBadgeText}>
            {lesson.file_type === 'html' ? 'HTML' : lesson.file_type === 'css' ? 'CSS' : 'Interactive'}
          </Text>
        </View>
      </View>

      {lesson.difficulty && (
        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(lesson.difficulty) + '20' }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(lesson.difficulty) }]}>
            {lesson.difficulty === 'beginner' ? 'Débutant' : lesson.difficulty === 'medium' ? 'Intermédiaire' : 'Avancé'}
          </Text>
        </View>
      )}
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
  emoji: {
    fontSize: 32,
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
  meta: {
    flexDirection: 'row',
    gap: 6,
  },
  metaText: {
    color: '#888',
    fontSize: 12,
  },
  description: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#888',
    fontSize: 11,
    marginLeft: 4,
  },
  statIcon: {
    marginLeft: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100,108,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeBadgeText: {
    color: '#646cff',
    fontSize: 10,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '600',
  },
});