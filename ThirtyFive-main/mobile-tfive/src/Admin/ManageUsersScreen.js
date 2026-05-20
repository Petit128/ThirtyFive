import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/api';

export default function ManageUsersScreen() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    Alert.alert(
      'Changer le rôle',
      `Passer cet utilisateur au rôle "${newRole}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await adminService.changeUserRole(userId, newRole);
              setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
              Alert.alert('Succès', 'Rôle modifié');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de modifier le rôle');
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = async (userId, userName) => {
    if (userId === user?.id) {
      Alert.alert('Action impossible', 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    
    Alert.alert(
      'Supprimer',
      `Supprimer définitivement "${userName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminService.deleteUser(userId);
              setUsers(users.filter(u => u.id !== userId));
              Alert.alert('Succès', 'Utilisateur supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = selectedRole === 'all' || u.role === selectedRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return styles.badgeAdmin;
      case 'professor': return styles.badgeProfessor;
      default: return styles.badgeStudent;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return 'shield';
      case 'professor': return 'school';
      default: return 'person';
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Gestion des utilisateurs</Text>
        <Text style={styles.subtitle}>{filteredUsers.length} utilisateur(s)</Text>
      </View>

      {/* Recherche */}
      <View style={styles.searchBox}>
        <Icon name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor="#666"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm !== '' && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres par rôle */}
      <View style={styles.roleFilters}>
        {['all', 'student', 'professor', 'admin'].map(role => (
          <TouchableOpacity
            key={role}
            style={[styles.roleFilter, selectedRole === role && styles.roleFilterActive]}
            onPress={() => setSelectedRole(role)}
          >
            <Text style={[styles.roleFilterText, selectedRole === role && styles.roleFilterTextActive]}>
              {role === 'all' ? 'Tous' : role === 'student' ? '👨‍🎓 Étudiants' : role === 'professor' ? '👨‍🏫 Profs' : '👑 Admins'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {filteredUsers.map(u => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Icon name={getRoleIcon(u.role)} size={28} color="#fff" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
              <View style={[styles.roleBadge, getRoleBadgeStyle(u.role)]}>
                <Text style={styles.roleBadgeText}>
                  {u.role === 'admin' ? 'Administrateur' : u.role === 'professor' ? 'Professeur' : 'Étudiant'}
                </Text>
              </View>
            </View>
            <View style={styles.userActions}>
              <TouchableOpacity
                style={styles.changeRoleBtn}
                onPress={() => {
                  const nextRole = u.role === 'student' ? 'professor' : u.role === 'professor' ? 'admin' : 'student';
                  handleChangeRole(u.id, nextRole);
                }}
              >
                <Icon name="swap-vertical" size={20} color="#646cff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteUser(u.id, u.name)}
              >
                <Icon name="trash-outline" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, margin: 20, marginTop: 16, paddingHorizontal: 16, gap: 12 },
  searchInput: { flex: 1, paddingVertical: 12, color: '#fff', fontSize: 16 },
  roleFilters: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  roleFilter: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)' },
  roleFilterActive: { backgroundColor: '#646cff' },
  roleFilterText: { color: '#888', fontSize: 14 },
  roleFilterTextActive: { color: '#fff' },
  content: { flex: 1, paddingHorizontal: 20 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12, gap: 16 },
  userAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#646cff', alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#888', marginBottom: 6 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeStudent: { backgroundColor: 'rgba(16,185,129,0.2)' },
  badgeProfessor: { backgroundColor: 'rgba(245,158,11,0.2)' },
  badgeAdmin: { backgroundColor: 'rgba(239,68,68,0.2)' },
  roleBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },
  userActions: { flexDirection: 'row', gap: 12 },
  changeRoleBtn: { padding: 8 },
  deleteBtn: { padding: 8 },
});