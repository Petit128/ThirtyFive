import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';

export default function GradeCard({ grade }) {
  const percentage = (grade.grade / grade.max_grade) * 100;
  
  const getGradeColor = () => {
    if (percentage >= 90) return '#10b981';
    if (percentage >= 75) return '#3b82f6';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getLetterGrade = () => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {grade.lesson_title || grade.quiz_title || 'Examen'}
        </Text>
        <View style={[styles.typeBadge, grade.exam_type === 'exam' ? styles.examBadge : styles.quizBadge]}>
          <Text style={styles.typeBadgeText}>
            {grade.exam_type === 'exam' ? 'Examen' : 'Quiz'}
          </Text>
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <View style={[styles.scoreCircle, { borderColor: getGradeColor() }]}>
          <Text style={[styles.scoreValue, { color: getGradeColor() }]}>
            {Math.round(percentage)}%
          </Text>
          <Text style={styles.scoreLetter}>{getLetterGrade()}</Text>
          <Text style={styles.scoreRaw}>{grade.grade}/{grade.max_grade}</Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.teacher}>
          <Icon name="person-outline" size={12} color="#888" /> {grade.teacher_name || 'Professeur'}
        </Text>
        <Text style={styles.date}>
          <Icon name="calendar-outline" size={12} color="#888" /> {formatDate(grade.graded_at)}
        </Text>
      </View>

      {grade.comment && (
        <Text style={styles.comment}>💬 {grade.comment}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  examBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
  },
  quizBadge: {
    backgroundColor: 'rgba(100,108,255,0.2)',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scoreLetter: {
    fontSize: 12,
    color: '#888',
  },
  scoreRaw: {
    fontSize: 10,
    color: '#666',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  teacher: {
    fontSize: 11,
    color: '#888',
  },
  date: {
    fontSize: 11,
    color: '#888',
  },
  comment: {
    fontSize: 12,
    color: '#aaa',
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});