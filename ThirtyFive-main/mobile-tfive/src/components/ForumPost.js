import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { forumService } from '../services/api';

export default function ForumPost({ post, onPostUpdated }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.like_count || 0);
  const [isAnswer, setIsAnswer] = useState(post.is_answer || false);

  const isAuthor = user?.id === post.user_id;
  const isAdmin = user?.role === 'admin';
  const canDelete = isAuthor || isAdmin;

  const handleLike = async () => {
    try {
      const response = await forumService.likePost(post.id);
      setLiked(!liked);
      setLikesCount(response.data.likes);
    } catch (error) {
      console.error('Erreur like:', error);
    }
  };

  const handleDelete = () => {
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
              await forumService.deletePost(post.id);
              if (onPostUpdated) onPostUpdated();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const handleMarkAsAnswer = async () => {
    try {
      await forumService.markAsAnswer(post.id);
      setIsAnswer(true);
      Alert.alert('Succès', 'Message marqué comme réponse');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de marquer comme réponse');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60));
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff} min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <View style={[styles.container, isAnswer && styles.answerContainer]}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {post.author_name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author_name}</Text>
            <Text style={styles.postDate}>{formatDate(post.created_at)}</Text>
          </View>
        </View>
        {isAnswer && (
          <View style={styles.answerBadge}>
            <Icon name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.answerBadgeText}>Réponse acceptée</Text>
          </View>
        )}
      </View>

      <Text style={styles.content}>{post.content}</Text>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Icon name={liked ? "heart" : "heart-outline"} size={20} color={liked ? "#ef4444" : "#888"} />
          <Text style={[styles.likeCount, liked && styles.likedText]}>{likesCount}</Text>
        </TouchableOpacity>

        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}

        {isAdmin && !isAnswer && (
          <TouchableOpacity style={styles.answerButton} onPress={handleMarkAsAnswer}>
            <Icon name="checkmark-circle-outline" size={20} color="#10b981" />
            <Text style={styles.answerButtonText}>Marquer réponse</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  answerContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#646cff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authorName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  postDate: {
    color: '#888',
    fontSize: 11,
  },
  answerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  answerBadgeText: {
    color: '#10b981',
    fontSize: 10,
  },
  content: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeCount: {
    color: '#888',
    fontSize: 14,
  },
  likedText: {
    color: '#ef4444',
  },
  deleteButton: {
    padding: 4,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  answerButtonText: {
    color: '#10b981',
    fontSize: 12,
  },
});