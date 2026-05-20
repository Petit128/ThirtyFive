import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/api';

export default function NotificationsScreen({ navigation }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Erreur marquage lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      Alert.alert('Succès', 'Toutes les notifications ont été marquées comme lues');
    } catch (error) {
      console.error('Erreur marquage tout lu:', error);
    }
  };

  const deleteNotification = async (id) => {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer cette notification ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await notificationService.deleteNotification(id);
            setNotifications(notifications.filter(n => n.id !== id));
          } catch (error) {
            console.error('Erreur suppression:', error);
          }
        }
      }
    ]);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'grade': return 'school-outline';
      case 'quiz': return 'help-circle-outline';
      case 'forum': return 'chatbubble-outline';
      case 'lesson': return 'book-outline';
      case 'comment': return 'chatbox-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'grade': return '#10b981';
      case 'quiz': return '#f59e0b';
      case 'forum': return '#646cff';
      case 'lesson': return '#3b82f6';
      case 'comment': return '#8b5cf6';
      default: return '#888';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    if (diff < 43200) return `Il y a ${Math.floor(diff / 1440)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Tout marquer lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Icon name="notifications" size={16} color="#646cff" />
          <Text style={styles.unreadText}>{unreadCount} notification(s) non lue(s)</Text>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="notifications-off-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>Aucune notification</Text>
            <Text style={styles.emptySubtext}>
              Les notifications apparaîtront ici
            </Text>
          </View>
        ) : (
          notifications.map(notification => (
            <TouchableOpacity
              key={notification.id}
              style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
              onPress={() => !notification.is_read && markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(notification.type) + '20' }]}>
                <Icon name={getNotificationIcon(notification.type)} size={24} color={getNotificationColor(notification.type)} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, !notification.is_read && styles.unreadTitle]}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationDate}>
                  {formatDate(notification.created_at)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteNotification(notification.id)}
              >
                <Icon name="close-circle-outline" size={20} color="#888" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  backButton: { padding: 8 },
  title: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#fff' },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(100,108,255,0.2)' },
  markAllText: { color: '#646cff', fontSize: 12 },
  unreadBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    paddingVertical: 10, 
    backgroundColor: 'rgba(100,108,255,0.1)',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  unreadText: { color: '#646cff', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16 },
  emptySubtext: { color: '#666', fontSize: 12, marginTop: 8 },
  notificationCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    gap: 16,
  },
  unreadCard: { 
    backgroundColor: 'rgba(100,108,255,0.08)',
    borderLeftWidth: 3,
    borderLeftColor: '#646cff',
  },
  notificationIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  notificationContent: { flex: 1 },
  notificationTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  unreadTitle: { color: '#646cff' },
  notificationMessage: { color: '#aaa', fontSize: 13, marginBottom: 4 },
  notificationDate: { color: '#666', fontSize: 11 },
  deleteBtn: { padding: 8 },
});