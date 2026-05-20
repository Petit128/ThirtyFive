import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';

export default function StatisticsScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminService.getStatistics();
      setStats(response.data.statistics);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Statistiques</Text>
        <Text style={styles.subtitle}>Vue d'ensemble de la plateforme</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👥 Utilisateurs</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="people" size={32} color="#646cff" />
            <Text style={styles.statValue}>{stats?.users?.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="school" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats?.users?.students || 0}</Text>
            <Text style={styles.statLabel}>Étudiants</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="person" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{stats?.users?.professors || 0}</Text>
            <Text style={styles.statLabel}>Professeurs</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="shield" size={32} color="#ef4444" />
            <Text style={styles.statValue}>{stats?.users?.admins || 0}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 Contenu</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="book" size={32} color="#646cff" />
            <Text style={styles.statValue}>{stats?.lessons?.total || 0}</Text>
            <Text style={styles.statLabel}>Leçons</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="help-circle" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats?.quizzes?.total || 0}</Text>
            <Text style={styles.statLabel}>Quiz</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="folder" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{stats?.files?.total_files || 0}</Text>
            <Text style={styles.statLabel}>Fichiers</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="stats-chart" size={32} color="#646cff" />
            <Text style={styles.statValue}>{stats?.grades?.average_grade || 0}%</Text>
            <Text style={styles.statLabel}>Moyenne générale</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="checkmark-circle" size={32} color="#10b981" />
            <Text style={styles.statValue}>{stats?.grades?.passed || 0}</Text>
            <Text style={styles.statLabel}>Réussites</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="close-circle" size={32} color="#ef4444" />
            <Text style={styles.statValue}>{stats?.grades?.failed || 0}</Text>
            <Text style={styles.statLabel}>Échecs</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#646cff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
});