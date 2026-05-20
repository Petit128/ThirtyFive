import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/api';

export default function ForumScreen({ navigation }) {
  const { user, isAdmin, isProfessor } = useAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', is_private: false });
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    is_private: false,
    invite_emails: '',
  });
  const [creating, setCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showDeleteTopicConfirm, setShowDeleteTopicConfirm] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTopics(selectedCategory.id);
    }
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await forumService.getCategories();
      setCategories(response.data.categories || []);
      if (response.data.categories?.length > 0 && !selectedCategory) {
        setSelectedCategory(response.data.categories[0]);
      }
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
      Alert.alert('Erreur', 'Impossible de charger les catégories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTopics = async (categoryId) => {
    try {
      setLoading(true);
      const response = await forumService.getTopics(categoryId);
      setTopics(response.data.topics || []);
    } catch (error) {
      console.error('Erreur chargement topics:', error);
      if (error.response?.status === 403 && error.response?.data?.requires_invite) {
        Alert.alert(
          'Accès restreint',
          'Cette catégorie est privée. Utilisez le bouton "Code" pour entrer un code d\'invitation.',
          [{ text: 'OK', onPress: () => setShowJoinModal(true) }]
        );
      } else {
        Alert.alert('Erreur', 'Impossible de charger les sujets');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  const handleCreateTopic = async () => {
    if (!newTopic.title || !newTopic.content) {
      Alert.alert('Erreur', 'Titre et contenu requis');
      return;
    }

    setCreating(true);
    try {
      await forumService.createTopic({
        categoryId: selectedCategory.id,
        title: newTopic.title,
        content: newTopic.content,
        is_private: newTopic.is_private,
      });
      Alert.alert('Succès', 'Sujet créé');
      setShowNewTopic(false);
      setNewTopic({ title: '', content: '', is_private: false });
      fetchTopics(selectedCategory.id);
    } catch (error) {
      console.error('Erreur création topic:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le sujet');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    setCreating(true);
    try {
      const inviteEmails = newCategory.invite_emails
        .split(',')
        .map(e => e.trim())
        .filter(e => e);

      const response = await forumService.createCategory({
        name: newCategory.name,
        description: newCategory.description,
        is_private: newCategory.is_private,
        invite_emails: inviteEmails,
      });

      Alert.alert('Succès', response.data.message || 'Catégorie créée');
      if (newCategory.is_private && response.data.invite_code) {
        Alert.alert('Code d\'invitation', `Code: ${response.data.invite_code}\nPartagez ce code avec les personnes à inviter.`);
      }
      setShowCreateCategory(false);
      setNewCategory({ name: '', description: '', is_private: false, invite_emails: '' });
      fetchCategories();
    } catch (error) {
      console.error('Erreur création catégorie:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer la catégorie');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Erreur', 'Code d\'invitation requis');
      return;
    }

    setJoining(true);
    try {
      const response = await forumService.joinWithCode(inviteCode.toUpperCase());
      Alert.alert('Succès', `Vous avez rejoint la catégorie "${response.data.category_name}"`);
      setShowJoinModal(false);
      setInviteCode('');
      fetchCategories();
    } catch (error) {
      console.error('Erreur jointure:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Code invalide');
    } finally {
      setJoining(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    Alert.alert(
      'Supprimer la catégorie',
      `Voulez-vous vraiment supprimer "${categoryName}" ?\n\nTous les sujets et messages seront également supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumService.deleteCategory(categoryId);
              Alert.alert('Succès', 'Catégorie supprimée');
              fetchCategories();
              if (selectedCategory?.id === categoryId) {
                setSelectedCategory(null);
              }
            } catch (error) {
              console.error('Erreur suppression catégorie:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
            }
          }
        }
      ]
    );
  };

  const handleDeleteTopic = async (topicId, topicTitle) => {
    Alert.alert(
      'Supprimer le sujet',
      `Voulez-vous vraiment supprimer "${topicTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumService.deleteTopic(topicId);
              Alert.alert('Succès', 'Sujet supprimé');
              fetchTopics(selectedCategory.id);
            } catch (error) {
              console.error('Erreur suppression sujet:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le sujet');
            }
          }
        }
      ]
    );
  };

  const handleCopyInviteCode = async (categoryId) => {
    try {
      const response = await forumService.getInviteLink(categoryId);
      Alert.alert('Code d\'invitation', `Code: ${response.data.invite_code}\n\nPartagez ce code avec les personnes à inviter.`);
    } catch (error) {
      console.error('Erreur récupération code:', error);
      Alert.alert('Erreur', 'Impossible de récupérer le code');
    }
  };

  const getCategoryIcon = (category) => {
    if (category.is_private) return 'lock-closed';
    if (category.icon === 'general') return 'chatbubbles';
    if (category.icon === 'help') return 'help-circle';
    if (category.icon === 'projects') return 'code-slash';
    return 'chatbubble';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const canCreateCategory = isAdmin || isProfessor;
  const canDeleteCategory = (category) => isAdmin || category.created_by === user?.id;
  const canDeleteTopic = (topic) => isAdmin || topic.user_id === user?.id;

  if (loading && categories.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💬 Forum</Text>
        <View style={styles.headerActions}>
          {selectedCategory && (
            <TouchableOpacity style={styles.newTopicBtn} onPress={() => setShowNewTopic(true)}>
              <Icon name="create-outline" size={20} color="#fff" />
              <Text style={styles.newTopicBtnText}>Nouveau</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.joinCodeBtn} onPress={() => setShowJoinModal(true)}>
            <Icon name="key-outline" size={20} color="#fff" />
            <Text style={styles.joinCodeBtnText}>Code</Text>
          </TouchableOpacity>
          {canCreateCategory && (
            <TouchableOpacity style={styles.createCategoryBtn} onPress={() => setShowCreateCategory(true)}>
              <Icon name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.createCategoryBtnText}>Catégorie</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {categories.map(category => (
          <View key={category.id} style={styles.categoryWrapper}>
            <TouchableOpacity
              style={[styles.categoryBtn, selectedCategory?.id === category.id && styles.categoryActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Icon name={getCategoryIcon(category)} size={18} color={selectedCategory?.id === category.id ? '#fff' : '#888'} />
              <Text style={[styles.categoryName, selectedCategory?.id === category.id && styles.categoryNameActive]}>
                {category.name}
              </Text>
              <Text style={styles.categoryCount}>{category.topic_count || 0}</Text>
            </TouchableOpacity>
            {canDeleteCategory(category) && (
              <TouchableOpacity 
                onPress={() => handleDeleteCategory(category.id, category.name)} 
                style={styles.deleteCatBtn}
              >
                <Icon name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
            {category.is_private && category.created_by === user?.id && (
              <TouchableOpacity 
                onPress={() => handleCopyInviteCode(category.id)} 
                style={styles.inviteCatBtn}
              >
                <Icon name="key-outline" size={16} color="#646cff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <ScrollView style={styles.topicsList}>
        {!selectedCategory ? (
          <View style={styles.emptyState}>
            <Icon name="chatbubble-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>Sélectionnez une catégorie</Text>
          </View>
        ) : topics.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="chatbubble-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>Aucun sujet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowNewTopic(true)}>
              <Text style={styles.emptyBtnText}>Créer le premier sujet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          topics.map(topic => (
            <View key={topic.id} style={styles.topicWrapper}>
              <TouchableOpacity
                style={[styles.topicCard, topic.is_pinned && styles.pinnedCard]}
                onPress={() => navigation.navigate('TopicDetail', { topicId: topic.id })}
              >
                <View style={styles.topicHeader}>
                  <View style={styles.topicTitle}>
                    {topic.is_pinned && <Icon name="pin" size={14} color="#f59e0b" />}
                    {topic.is_locked && <Icon name="lock-closed" size={14} color="#888" />}
                    {topic.is_private && <Icon name="lock-closed" size={14} color="#888" />}
                    <Text style={styles.topicTitleText} numberOfLines={1}>{topic.title}</Text>
                  </View>
                  <Text style={styles.topicAuthor}>par {topic.author_name}</Text>
                </View>
                <View style={styles.topicStats}>
                  <Text><Icon name="chatbubble-outline" size={12} /> {topic.reply_count || 0}</Text>
                  <Text><Icon name="eye-outline" size={12} /> {topic.views || 0}</Text>
                </View>
                <Text style={styles.topicDate}>{formatDate(topic.last_activity || topic.created_at)}</Text>
              </TouchableOpacity>
              {canDeleteTopic(topic) && (
                <TouchableOpacity 
                  onPress={() => handleDeleteTopic(topic.id, topic.title)} 
                  style={styles.deleteTopicBtn}
                >
                  <Icon name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Nouveau Sujet */}
      <Modal visible={showNewTopic} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouveau sujet</Text>
              <TouchableOpacity onPress={() => setShowNewTopic(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Titre"
              placeholderTextColor="#666"
              value={newTopic.title}
              onChangeText={(title) => setNewTopic({ ...newTopic, title })}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Contenu..."
              placeholderTextColor="#666"
              value={newTopic.content}
              onChangeText={(content) => setNewTopic({ ...newTopic, content })}
              multiline
              numberOfLines={6}
            />

            <TouchableOpacity
              style={styles.privacyBtn}
              onPress={() => setNewTopic({ ...newTopic, is_private: !newTopic.is_private })}
            >
              <Icon name={newTopic.is_private ? "lock-closed" : "lock-open"} size={16} color="#fff" />
              <Text style={styles.privacyBtnText}>
                {newTopic.is_private ? 'Topic privé' : 'Topic public'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCreateTopic}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Publier</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Créer Catégorie */}
      <Modal visible={showCreateCategory} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Nouvelle catégorie</Text>
              <TouchableOpacity onPress={() => setShowCreateCategory(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Nom de la catégorie *"
              placeholderTextColor="#666"
              value={newCategory.name}
              onChangeText={(name) => setNewCategory({ ...newCategory, name })}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description"
              placeholderTextColor="#666"
              value={newCategory.description}
              onChangeText={(description) => setNewCategory({ ...newCategory, description })}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.privacyBtn, newCategory.is_private && styles.privacyActive]}
              onPress={() => setNewCategory({ ...newCategory, is_private: !newCategory.is_private })}
            >
              <Icon name={newCategory.is_private ? "lock-closed" : "lock-open"} size={16} color="#fff" />
              <Text style={styles.privacyBtnText}>
                {newCategory.is_private ? 'Catégorie privée' : 'Catégorie publique'}
              </Text>
            </TouchableOpacity>

            {newCategory.is_private && (
              <TextInput
                style={styles.modalInput}
                placeholder="Inviter des emails (séparés par des virgules)"
                placeholderTextColor="#666"
                value={newCategory.invite_emails}
                onChangeText={(emails) => setNewCategory({ ...newCategory, invite_emails: emails })}
              />
            )}

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleCreateCategory}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Créer la catégorie</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Rejoindre avec code */}
      <Modal visible={showJoinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔑 Rejoindre une catégorie</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Entrez le code d'invitation pour rejoindre une catégorie privée
            </Text>

            <TextInput
              style={[styles.modalInput, styles.codeInput]}
              placeholder="CODE12345"
              placeholderTextColor="#666"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={8}
            />

            <TouchableOpacity
              style={styles.modalSubmitBtn}
              onPress={handleJoinWithCode}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalSubmitText}>Rejoindre</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    paddingTop: 60,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  newTopicBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#646cff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  newTopicBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  joinCodeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(100,108,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  joinCodeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  createCategoryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8 },
  createCategoryBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  categoriesScroll: { paddingHorizontal: 20, marginBottom: 16 },
  categoryWrapper: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, gap: 8 },
  categoryActive: { backgroundColor: '#646cff' },
  categoryName: { color: '#888', fontSize: 14 },
  categoryNameActive: { color: '#fff' },
  categoryCount: { color: '#888', fontSize: 12 },
  deleteCatBtn: { marginLeft: 4, padding: 6 },
  inviteCatBtn: { marginLeft: 2, padding: 6 },
  topicsList: { flex: 1, paddingHorizontal: 20 },
  topicWrapper: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  topicCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16 },
  pinnedCard: { borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  topicHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  topicTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  topicTitleText: { color: '#fff', fontSize: 16, fontWeight: '500', flex: 1 },
  topicAuthor: { color: '#888', fontSize: 12 },
  topicStats: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  topicDate: { color: '#666', fontSize: 11 },
  deleteTopicBtn: { padding: 8 },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 16, marginBottom: 20, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#646cff', borderRadius: 25 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { color: '#888', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, marginBottom: 16 },
  modalTextArea: { minHeight: 120, textAlignVertical: 'top' },
  codeInput: { textAlign: 'center', letterSpacing: 2, fontSize: 18, fontWeight: 'bold' },
  modalSubmitBtn: { backgroundColor: '#646cff', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  modalSubmitText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  privacyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 16 },
  privacyActive: { backgroundColor: '#646cff' },
  privacyBtnText: { color: '#fff', fontSize: 14 },
});