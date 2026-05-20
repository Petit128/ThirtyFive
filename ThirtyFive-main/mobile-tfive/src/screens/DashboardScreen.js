import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/api';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    loadLessons();
  }, []);

  const loadLessons = async () => {
    try {
      const response = await lessonService.getLessons();
      setLessons(response.data.lessons || []);
    } catch (error) {
      console.error('Erreur chargement leçons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLessons();
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchSearch = !searchTerm || 
      lesson.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSubject = !selectedSubject || lesson.subject === selectedSubject;
    return matchSearch && matchSubject;
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenue, {user?.name} 👋</Text>
        <Text style={styles.subtitle}>Explorez les leçons interactives</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une leçon..."
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Icon name="options" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>📚 Leçons disponibles ({filteredLessons.length})</Text>

      <View style={styles.lessonsList}>
        {filteredLessons.map(lesson => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => navigation.navigate('LessonViewer', { lessonId: lesson.id })}
          >
            <View style={styles.lessonHeader}>
              <Text style={styles.lessonEmoji}>{lesson.emoji || '📚'}</Text>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonMeta}>
                  {lesson.subject} • {lesson.class_level || 'Tous niveaux'}
                </Text>
              </View>
            </View>
            <Text style={styles.lessonDescription} numberOfLines={2}>
              {lesson.description || 'Aucune description'}
            </Text>
            <View style={styles.lessonFooter}>
              <View style={styles.lessonStats}>
                <Icon name="eye" size={14} color="#888" />
                <Text style={styles.statText}>{lesson.views || 0}</Text>
                <Icon name="download" size={14} color="#888" style={styles.statIcon} />
                <Text style={styles.statText}>{lesson.downloads || 0}</Text>
              </View>
              <View style={styles.startButton}>
                <Text style={styles.startButtonText}>Commencer</Text>
                <Icon name="arrow-forward" size={16} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {filteredLessons.length === 0 && (
        <View style={styles.emptyState}>
          <Icon name="book-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>Aucune leçon trouvée</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  filterButton: {
    backgroundColor: '#646cff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  lessonsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  lessonCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lessonEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  lessonMeta: {
    fontSize: 12,
    color: '#888',
  },
  lessonDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
    marginBottom: 12,
  },
  lessonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    marginLeft: 12,
  },
  statText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#646cff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    marginTop: 16,
  },
});