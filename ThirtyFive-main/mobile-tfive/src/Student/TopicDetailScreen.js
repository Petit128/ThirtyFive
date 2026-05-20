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
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/api';

export default function TopicDetailScreen({ route, navigation }) {
  const { topicId } = route.params;
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');

  const isAdmin = user?.role === 'admin';
  const isTopicAuthor = user?.id === topic?.user_id;

  useEffect(() => {
    loadTopic();
    loadPosts();
  }, [topicId]);

  const loadTopic = async () => {
    try {
      const response = await forumService.getTopic(topicId);
      setTopic(response.data.topic);
    } catch (error) {
      console.error('Erreur chargement topic:', error);
      Alert.alert('Erreur', 'Impossible de charger le sujet');
      navigation.goBack();
    }
  };

  const loadPosts = async (pageNum = 1) => {
    try {
      const response = await forumService.getTopic(topicId, pageNum, 20);
      if (pageNum === 1) {
        setPosts(response.data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(response.data.posts || [])]);
      }
      setHasMore((response.data.posts || []).length === 20);
      setPage(pageNum);
    } catch (error) {
      console.error('Erreur chargement posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadPosts(page + 1);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire un message');
      return;
    }

    setSubmitting(true);
    try {
      await forumService.createPost(topicId, newPost);
      setNewPost('');
      loadPosts(1);
      Alert.alert('Succès', 'Message ajouté');
    } catch (error) {
      console.error('Erreur ajout post:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le message');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await forumService.likePost(postId);
      loadPosts(page);
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Supprimer',
      'Voulez-vous vraiment supprimer ce message ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumService.deletePost(postId);
              loadPosts(1);
              Alert.alert('Succès', 'Message supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) {
      Alert.alert('Erreur', 'Le contenu ne peut pas être vide');
      return;
    }

    try {
      await forumService.updatePost(editingPost.id, editContent);
      setEditingPost(null);
      setEditContent('');
      loadPosts(1);
      Alert.alert('Succès', 'Message modifié');
    } catch (error) {
      console.error('Erreur modification:', error);
      Alert.alert('Erreur', 'Impossible de modifier');
    }
  };

  const handlePinTopic = async () => {
    try {
      await forumService.pinTopic(topicId);
      loadTopic();
      Alert.alert('Succès', topic?.is_pinned ? 'Sujet désépinglé' : 'Sujet épinglé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier l\'épingle');
    }
  };

  const handleLockTopic = async () => {
    try {
      await forumService.lockTopic(topicId);
      loadTopic();
      Alert.alert('Succès', topic?.is_locked ? 'Sujet déverrouillé' : 'Sujet verrouillé');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le verrouillage');
    }
  };

  const handleDeleteTopic = async () => {
    Alert.alert(
      'Supprimer le sujet',
      `Voulez-vous vraiment supprimer "${topic?.title}" ? Tous les messages seront également supprimés.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await forumService.deleteTopic(topicId);
              navigation.goBack();
              Alert.alert('Succès', 'Sujet supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le sujet');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{topic?.title}</Text>
          <Text style={styles.headerCategory}>{topic?.category_name}</Text>
        </View>
        {(isAdmin || isTopicAuthor) && (
          <TouchableOpacity onPress={() => setShowTopicActions(true)} style={styles.menuButton}>
            <Icon name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions du topic (Admin) */}
      {(isAdmin || isTopicAuthor) && (
        <View style={styles.topicActions}>
          {isAdmin && (
            <>
              <TouchableOpacity style={styles.actionChip} onPress={handlePinTopic}>
                <Icon name="pin" size={16} color={topic?.is_pinned ? '#f59e0b' : '#888'} />
                <Text style={[styles.actionChipText, topic?.is_pinned && { color: '#f59e0b' }]}>
                  {topic?.is_pinned ? 'Épinglé' : 'Épingler'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionChip} onPress={handleLockTopic}>
                <Icon name="lock-closed" size={16} color={topic?.is_locked ? '#ef4444' : '#888'} />
                <Text style={[styles.actionChipText, topic?.is_locked && { color: '#ef4444' }]}>
                  {topic?.is_locked ? 'Verrouillé' : 'Verrouiller'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {(isAdmin || isTopicAuthor) && (
            <TouchableOpacity style={[styles.actionChip, styles.deleteChip]} onPress={handleDeleteTopic}>
              <Icon name="trash-outline" size={16} color="#ef4444" />
              <Text style={styles.deleteChipText}>Supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView 
        style={styles.content}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 100) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {posts.map(post => {
          const canDelete = isAdmin || user?.id === post.user_id;
          const canEdit = user?.id === post.user_id;
          
          return (
            <View key={post.id} style={[styles.postCard, post.is_answer && styles.answerPost]}>
              <View style={styles.postHeader}>
                <View style={styles.authorInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {post.author_name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.authorName}>{post.author_name}</Text>
                    <View style={styles.postMeta}>
                      <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
                      {post.author_role === 'admin' && (
                        <View style={styles.adminBadge}>
                          <Text style={styles.adminBadgeText}>Admin</Text>
                        </View>
                      )}
                      {post.author_role === 'professor' && (
                        <View style={styles.profBadge}>
                          <Text style={styles.profBadgeText}>Prof</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.postActions}>
                  {post.is_answer && (
                    <View style={styles.answerBadge}>
                      <Icon name="checkmark-circle" size={14} color="#10b981" />
                      <Text style={styles.answerBadgeText}>Solution</Text>
                    </View>
                  )}
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeletePost(post.id)}>
                      <Icon name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {editingPost?.id === post.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editContent}
                    onChangeText={setEditContent}
                    multiline
                    autoFocus
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={() => setEditingPost(null)}>
                      <Text style={styles.cancelEditText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleUpdatePost}>
                      <Text style={styles.saveEditText}>Sauvegarder</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.postContent}>{post.content}</Text>
              )}

              <View style={styles.postFooter}>
                <TouchableOpacity 
                  style={styles.likeButton} 
                  onPress={() => handleLike(post.id)}
                >
                  <Icon name="heart-outline" size={18} color={post.user_liked ? '#ef4444' : '#888'} />
                  <Text style={[styles.likeCount, post.user_liked && styles.likedText]}>
                    {post.likes || 0}
                  </Text>
                </TouchableOpacity>
                
                {canEdit && !editingPost && (
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={() => {
                      setEditingPost(post);
                      setEditContent(post.content);
                    }}
                  >
                    <Icon name="create-outline" size={16} color="#646cff" />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {loading && posts.length > 0 && (
          <ActivityIndicator style={styles.loadMore} color="#646cff" />
        )}
      </ScrollView>

      {!topic?.is_locked && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newPost}
            onChangeText={setNewPost}
            placeholder="Écrire une réponse..."
            placeholderTextColor="#666"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!newPost.trim() || submitting) && styles.sendDisabled]}
            onPress={handleAddPost}
            disabled={!newPost.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {topic?.is_locked && (
        <View style={styles.lockedMessage}>
          <Icon name="lock-closed" size={20} color="#888" />
          <Text style={styles.lockedMessageText}>Ce sujet est verrouillé</Text>
        </View>
      )}
    </KeyboardAvoidingView>
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
    backgroundColor: 'rgba(26,26,46,0.95)', 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  backButton: { padding: 8, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  headerCategory: { fontSize: 12, color: '#888', marginTop: 2 },
  menuButton: { padding: 8 },
  topicActions: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  actionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255,255,255,0.05)' 
  },
  actionChipText: { color: '#888', fontSize: 12 },
  deleteChip: { backgroundColor: 'rgba(239,68,68,0.1)' },
  deleteChipText: { color: '#ef4444', fontSize: 12 },
  content: { flex: 1, padding: 16 },
  postCard: { 
    backgroundColor: 'rgba(255,255,255,0.05)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12 
  },
  answerPost: { 
    borderLeftWidth: 3, 
    borderLeftColor: '#10b981' 
  },
  postHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  authorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#646cff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  authorName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  postDate: { color: '#888', fontSize: 11 },
  adminBadge: { 
    backgroundColor: 'rgba(239,68,68,0.2)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  adminBadgeText: { color: '#ef4444', fontSize: 9, fontWeight: '600' },
  profBadge: { 
    backgroundColor: 'rgba(245,158,11,0.2)', 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 10 
  },
  profBadgeText: { color: '#f59e0b', fontSize: 9, fontWeight: '600' },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  answerBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: 'rgba(16,185,129,0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  answerBadgeText: { color: '#10b981', fontSize: 10 },
  postContent: { color: '#ccc', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postFooter: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 16, 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.05)', 
    paddingTop: 12 
  },
  likeButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { color: '#888', fontSize: 12 },
  likedText: { color: '#ef4444' },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editButtonText: { color: '#646cff', fontSize: 12 },
  editContainer: { marginBottom: 12 },
  editInput: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 10, 
    padding: 12, 
    color: '#fff', 
    fontSize: 14, 
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 },
  cancelEditText: { color: '#ef4444', fontSize: 12 },
  saveEditText: { color: '#10b981', fontSize: 12 },
  loadMore: { marginVertical: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 12, 
    backgroundColor: 'rgba(26,26,46,0.95)', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)', 
    gap: 12 
  },
  input: { 
    flex: 1, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    color: '#fff', 
    fontSize: 14, 
    maxHeight: 100 
  },
  sendButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#646cff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  sendDisabled: { opacity: 0.5 },
  lockedMessage: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, 
    padding: 16, 
    backgroundColor: 'rgba(239,68,68,0.1)', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255,255,255,0.1)' 
  },
  lockedMessageText: { color: '#ef4444', fontSize: 14 },
});