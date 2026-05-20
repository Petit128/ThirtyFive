import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { lessonService } from '../services/api';

export default function LessonViewerScreen({ route, navigation }) {
  const { lessonId } = route.params;
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    try {
      const response = await lessonService.getLesson(lessonId);
      console.log('📖 Leçon chargée:', response.data.lesson.title);
      console.log('📄 Type de fichier:', response.data.lesson.file_type);
      console.log('📝 Contenu HTML présent:', !!response.data.lesson.html_content);
      setLesson(response.data.lesson);
      setIsFavorite(response.data.lesson.is_favorite || false);
    } catch (error) {
      console.error('Erreur chargement leçon:', error);
      Alert.alert('Erreur', 'Impossible de charger la leçon');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const response = await lessonService.toggleFavorite(lessonId);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Erreur favori:', error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Découvrez cette leçon: ${lesson?.title}\nSur T-Five!`,
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const handleComplete = async () => {
    Alert.alert(
      'Marquer comme terminée',
      'Confirmez-vous avoir terminé cette leçon ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await lessonService.completeLesson(lessonId);
              Alert.alert('Succès', 'Leçon marquée comme terminée !');
            } catch (error) {
              console.error('Erreur:', error);
            }
          },
        },
      ]
    );
  };

  // Générer le HTML complet avec CSS et JS
  const getFullHtml = () => {
    if (!lesson?.html_content) {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #1a1a2e;
              color: #fff;
            }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #646cff; }
            .error { text-align: center; padding: 40px; color: #888; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📚 ${lesson?.title || 'Leçon'}</h1>
            <div class="error">
              <p>Contenu en cours de préparation...</p>
              <p>Cette leçon sera disponible prochainement.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
    
    // Injecter le contenu HTML avec des styles de base
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
        <style>
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            background: #f5f5f5;
            color: #333;
          }
          .interactive-container {
            max-width: 100%;
            overflow-x: auto;
          }
          button, .btn {
            background: #646cff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
          }
          button:hover {
            background: #535bf2;
          }
          canvas, .simulation {
            display: block;
            margin: 20px auto;
            max-width: 100%;
          }
          @media (prefers-color-scheme: dark) {
            body {
              background: #1a1a2e;
              color: #fff;
            }
          }
        </style>
      </head>
      <body>
        <div class="interactive-container">
          ${lesson.html_content}
        </div>
        <script>
          // Scripts pour rendre les simulations interactives
          document.querySelectorAll('canvas').forEach(canvas => {
            if (canvas.width === 0) canvas.width = canvas.clientWidth;
            if (canvas.height === 0) canvas.height = canvas.clientHeight;
          });
        </script>
      </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Leçon non trouvée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{lesson.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleFavorite} style={styles.headerAction}>
            <Icon 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#ef4444" : "#fff"} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerAction}>
            <Icon name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <View style={styles.meta}>
            <Text style={styles.metaItem}>📚 {lesson.subject || 'Général'}</Text>
            <Text style={styles.metaItem}>🎯 {lesson.class_level || 'Tous niveaux'}</Text>
            <Text style={styles.metaItem}>⭐ {lesson.rating || 'Nouveau'}</Text>
          </View>
          <Text style={styles.description}>{lesson.description}</Text>
        </View>

        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>🎮 Contenu interactif</Text>
          <View style={styles.webviewContainer}>
            <WebView
              ref={webViewRef}
              source={{ html: getFullHtml() }}
              style={styles.webview}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              onError={(error) => console.error('WebView error:', error.nativeEvent)}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Icon name="checkmark-circle-outline" size={24} color="#fff" />
          <Text style={styles.completeButtonText}>Marquer comme terminée</Text>
        </TouchableOpacity>
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
    justifyContent: 'space-between', 
    paddingHorizontal: 16, 
    paddingTop: 60, 
    paddingBottom: 16, 
    backgroundColor: 'rgba(26,26,46,0.95)', 
    borderBottomWidth: 1, 
    borderBottomColor: 'rgba(255,255,255,0.1)' 
  },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center' },
  headerActions: { flexDirection: 'row', gap: 12 },
  headerAction: { padding: 8 },
  content: { flex: 1 },
  infoSection: { padding: 20, backgroundColor: 'rgba(255,255,255,0.05)', margin: 16, borderRadius: 16 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  metaItem: { fontSize: 14, color: '#888' },
  description: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  contentSection: { margin: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 16 },
  webviewContainer: { 
    height: 450, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  webview: { flex: 1, backgroundColor: '#fff' },
  completeButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#10b981', 
    margin: 16, 
    padding: 16, 
    borderRadius: 12, 
    gap: 12 
  },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 16 },
});