import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const result = await updateProfile({ name, bio });
    if (result.success) {
      setIsEditing(false);
      Alert.alert('Succès', 'Profil mis à jour');
    } else {
      Alert.alert('Erreur', result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=646cff&color=fff` }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity style={styles.editAvatar}>
              <Icon name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        
        {isEditing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor="#666"
          />
        ) : (
          <Text style={styles.name}>{user?.name}</Text>
        )}
        
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, user?.role === 'admin' && styles.adminBadge]}>
            <Text style={styles.badgeText}>
              {user?.role === 'admin' ? '👑 Administrateur' : 
               user?.role === 'professor' ? '👨‍🏫 Professeur' : '👨‍🎓 Étudiant'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        {isEditing ? (
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Parlez de vous..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
          />
        ) : (
          <Text style={styles.bio}>{user?.bio || 'Aucune biographie'}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="book-outline" size={32} color="#646cff" />
            <Text style={styles.statValue}>{user?.stats?.completedLessons || 0}</Text>
            <Text style={styles.statLabel}>Leçons</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="star-outline" size={32} color="#f59e0b" />
            <Text style={styles.statValue}>{user?.stats?.averageScore || 0}%</Text>
            <Text style={styles.statLabel}>Moyenne</Text>
          </View>
          <View style={styles.statCard}>
            <Icon name="time-outline" size={32} color="#10b981" />
            <Text style={styles.statValue}>{user?.stats?.streak || 0}</Text>
            <Text style={styles.statLabel}>Série</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {!isEditing ? (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Icon name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]} 
              onPress={() => setIsEditing(false)}
            >
              <Text style={styles.actionButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.actionButtonText}>
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#646cff',
  },
  editAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#646cff',
    borderRadius: 20,
    padding: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#646cff',
    borderRadius: 8,
    width: '80%',
  },
  email: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#10b981',
  },
  adminBadge: {
    backgroundColor: '#ef4444',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  bio: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  bioInput: {
    fontSize: 14,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  actions: {
    margin: 16,
    gap: 12,
    marginBottom: 32,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#646cff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  saveButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239,68,68,0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});