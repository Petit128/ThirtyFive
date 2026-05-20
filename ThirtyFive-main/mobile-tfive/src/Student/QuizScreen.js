import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons as Icon } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { quizService, examService } from '../services/api';

export default function QuizScreen({ navigation }) {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [examAnswer, setExamAnswer] = useState('');
  const [submittingExam, setSubmittingExam] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (quizStarted && timeLeft === 0) {
      Alert.alert('Temps écoulé', 'Soumission automatique...');
      if (selectedQuiz?.exam_type === 'exam') {
        handleSubmitExam();
      } else {
        handleSubmitQuiz();
      }
    }
    return () => clearInterval(timer);
  }, [quizStarted, timeLeft]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizzes();
      console.log('📋 Quiz reçus:', response.data.quizzes);
      setQuizzes(response.data.quizzes || []);
    } catch (error) {
      console.error('❌ Erreur chargement quiz:', error);
      Alert.alert('Erreur', 'Impossible de charger les quiz');
    } finally {
      setLoading(false);
    }
  };

// Dans QuizScreen.js, modifiez handleStartQuiz :
const handleStartQuiz = async (quiz) => {
  try {
    // Vérifier les tentatives restantes
    const checkResponse = await examService.checkAttempt(quiz.id);
    if (!checkResponse.data.can_attempt) {
      Alert.alert(
        'Limite atteinte',
        `Vous avez utilisé ${checkResponse.data.attempts_count}/${checkResponse.data.max_attempts} tentative(s). Plus de tentatives autorisées.`
      );
      return;
    }
    
    // Afficher le nombre de tentatives restantes
    const remaining = checkResponse.data.max_attempts - checkResponse.data.attempts_count;
    if (checkResponse.data.attempts_count > 0) {
      Alert.alert(
        'Nouvelle tentative',
        `Il vous reste ${remaining} tentative(s) sur ${checkResponse.data.max_attempts}`,
        [{ text: 'Continuer' }]
      );
    }
    
} catch (error) {
    console.error('Erreur démarrage:', error);
  }
};

  const handleSubmitQuiz = async () => {
    if (Object.keys(answers).length !== selectedQuiz.questions?.length) {
      Alert.alert('Attention', `Veuillez répondre à toutes les questions (${Object.keys(answers).length}/${selectedQuiz.questions?.length})`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await quizService.submitAttempt(selectedQuiz.id, answers);
      setResult(response.data);
      setSelectedQuiz(null);
      setQuizStarted(false);
      fetchQuizzes();
    } catch (error) {
      console.error('❌ Erreur soumission:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de soumettre');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!examAnswer.trim()) {
      Alert.alert('Erreur', 'Veuillez fournir une réponse');
      return;
    }

    setSubmittingExam(true);
    try {
      const formData = new FormData();
      formData.append('answer_text', examAnswer);
      
      const response = await examService.submitExam(selectedQuiz.id, formData);
      Alert.alert('Succès', 'Examen soumis avec succès');
      setSelectedQuiz(null);
      setQuizStarted(false);
      fetchQuizzes();
    } catch (error) {
      console.error('❌ Erreur soumission examen:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de soumettre');
    } finally {
      setSubmittingExam(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeLabel = (quiz) => {
    if (quiz.exam_type === 'exam') return { label: 'Examen', color: '#f59e0b', icon: 'document-text' };
    if (quiz.exam_type === 'assignment') return { label: 'Devoir', color: '#10b981', icon: 'create' };
    return { label: 'Quiz', color: '#646cff', icon: 'help-circle' };
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#646cff" />
        <Text style={styles.loadingText}>Chargement des quiz...</Text>
      </View>
    );
  }

  // Affichage des résultats
  if (result) {
    const passed = result.score >= (selectedQuiz?.passing_score || 60);
    return (
      <View style={styles.center}>
        <View style={styles.resultCard}>
          <Text style={styles.resultIcon}>{passed ? '🏆' : '📚'}</Text>
          <Text style={styles.resultTitle}>{passed ? 'Félicitations !' : 'Quiz terminé'}</Text>
          <View style={styles.resultScoreCircle}>
            <Text style={[styles.resultScore, { color: passed ? '#10b981' : '#ef4444' }]}>
              {result.score}%
            </Text>
          </View>
          <Text style={styles.resultDetail}>Points: {result.earned_points}/{result.total_points}</Text>
          <Text style={[styles.resultStatus, { color: passed ? '#10b981' : '#ef4444' }]}>
            {passed ? '✅ Réussi' : '❌ Échec'}
          </Text>
          <TouchableOpacity style={styles.resultCloseBtn} onPress={() => setResult(null)}>
            <Text style={styles.resultCloseText}>Retour aux quiz</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Affichage d'un quiz en cours
  if (selectedQuiz) {
    // Examen écrit
    if (selectedQuiz.exam_type === 'exam' || selectedQuiz.exam_type === 'assignment') {
      return (
        <View style={styles.container}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setSelectedQuiz(null)} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.quizTitle} numberOfLines={1}>{selectedQuiz.title}</Text>
            <Text style={styles.timer}>⏱️ {formatTime(timeLeft)}</Text>
          </View>

          <ScrollView style={styles.examContent}>
            <View style={styles.examFile}>
              <Text style={styles.examFileTitle}>📄 Document de l'examen</Text>
              {selectedQuiz.exam_file_name ? (
                <Text style={styles.examFileName}>{selectedQuiz.exam_file_name}</Text>
              ) : (
                <Text style={styles.examFileName}>Aucun fichier joint</Text>
              )}
            </View>

            <View style={styles.examInstructions}>
              <Text style={styles.examInstructionsTitle}>📝 Instructions</Text>
              <Text style={styles.examInstructionsText}>
                {selectedQuiz.instructions || 'Répondez à la question ci-dessous en détail.'}
              </Text>
            </View>

            <View style={styles.examAnswer}>
              <Text style={styles.examAnswerTitle}>✏️ Votre réponse</Text>
              <TextInput
                style={styles.examAnswerInput}
                value={examAnswer}
                onChangeText={setExamAnswer}
                placeholder="Écrivez votre réponse ici..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={10}
                textAlignVertical="top"
              />
              <TouchableOpacity 
                style={[styles.submitExamBtn, (!examAnswer.trim() || submittingExam) && styles.disabledBtn]} 
                onPress={handleSubmitExam} 
                disabled={!examAnswer.trim() || submittingExam}
              >
                {submittingExam ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitExamText}>Soumettre l'examen</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      );
    }

    // Quiz à choix multiples
    if (selectedQuiz.questions && selectedQuiz.questions.length > 0) {
      const question = selectedQuiz.questions[currentQuestion];
      const isLastQuestion = currentQuestion === selectedQuiz.questions.length - 1;
      const answeredCount = Object.keys(answers).length;

      return (
        <View style={styles.container}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setSelectedQuiz(null)} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.quizTitle} numberOfLines={1}>{selectedQuiz.title}</Text>
            <Text style={styles.timer}>⏱️ {formatTime(timeLeft)}</Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentQuestion + 1) / selectedQuiz.questions.length * 100}%` }]} />
          </View>

          <ScrollView style={styles.quizContent}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionNumber}>
                Question {currentQuestion + 1}/{selectedQuiz.questions.length}
              </Text>
              <Text style={styles.questionPoints}>{question.points} pt(s)</Text>
            </View>

            <Text style={styles.questionText}>{question.question_text}</Text>

            <View style={styles.options}>
              {question.options.map((option, index) => {
                const isSelected = answers[question.id] === option;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => setAnswers({ ...answers, [question.id]: option })}
                  >
                    <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                      {String.fromCharCode(65 + index)}.
                    </Text>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {option}
                    </Text>
                    {isSelected && <Icon name="checkmark-circle" size={20} color="#646cff" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.navigation}>
              <TouchableOpacity
                style={[styles.navBtn, currentQuestion === 0 && styles.navDisabled]}
                onPress={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <Icon name="chevron-back" size={20} color={currentQuestion === 0 ? '#888' : '#fff'} />
                <Text style={[styles.navBtnText, currentQuestion === 0 && styles.navDisabledText]}>
                  Précédent
                </Text>
              </TouchableOpacity>

              {isLastQuestion ? (
                <TouchableOpacity 
                  style={[styles.submitBtn, answeredCount !== selectedQuiz.questions.length && styles.submitDisabled]} 
                  onPress={handleSubmitQuiz} 
                  disabled={submitting || answeredCount !== selectedQuiz.questions.length}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="checkmark" size={20} color="#fff" />
                      <Text style={styles.submitBtnText}>Soumettre</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.navBtn} onPress={() => setCurrentQuestion(currentQuestion + 1)}>
                  <Text style={styles.navBtnText}>Suivant</Text>
                  <Icon name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.answeredCount}>
              <Text style={styles.answeredCountText}>
                {answeredCount} / {selectedQuiz.questions.length} questions répondues
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }
  }

  // Liste des quiz
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Quiz et Examens</Text>
        <Text style={styles.subtitle}>Testez vos connaissances</Text>
      </View>

      {quizzes.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="help-circle-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>Aucun quiz disponible</Text>
          <Text style={styles.emptySubtext}>Revenez plus tard pour de nouveaux quiz</Text>
        </View>
      ) : (
        quizzes.map(quiz => {
          const type = getTypeLabel(quiz);
          const hasAttempt = quiz.your_score !== null;
          const statusColor = hasAttempt ? (quiz.your_score >= (quiz.passing_score || 60) ? '#10b981' : '#ef4444') : '#888';
          
          return (
            <TouchableOpacity 
              key={quiz.id} 
              style={styles.quizCard} 
              onPress={() => handleStartQuiz(quiz)}
              activeOpacity={0.7}
            >
              <View style={styles.quizCardHeader}>
                <View style={[styles.quizCardType, { backgroundColor: type.color + '20' }]}>
                  <Icon name={type.icon} size={16} color={type.color} />
                  <Text style={[styles.quizCardTypeText, { color: type.color }]}>{type.label}</Text>
                </View>
                {quiz.time_limit && (
                  <View style={styles.timeBadge}>
                    <Icon name="time-outline" size={12} color="#888" />
                    <Text style={styles.timeBadgeText}>{quiz.time_limit} min</Text>
                  </View>
                )}
              </View>

              <Text style={styles.quizCardTitle}>{quiz.title}</Text>
              <Text style={styles.quizCardDescription} numberOfLines={2}>
                {quiz.description || 'Testez vos connaissances'}
              </Text>

              <View style={styles.quizCardFooter}>
                <View style={styles.quizCardStats}>
                  <Text style={styles.statText}>🎯 {quiz.passing_score || 60}% requis</Text>
                  <Text style={styles.statText}>🔄 {quiz.max_attempts || 1} tentative(s)</Text>
                </View>
                
                {hasAttempt ? (
                  <View style={[styles.scoreBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.scoreText, { color: statusColor }]}>
                      Score: {quiz.your_score}%
                    </Text>
                  </View>
                ) : (
                  <View style={styles.startBadge}>
                    <Text style={styles.startText}>Commencer</Text>
                    <Icon name="arrow-forward" size={14} color="#646cff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
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
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
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
  emptySubtext: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
  quizCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  quizCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizCardType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  quizCardTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeBadgeText: {
    color: '#888',
    fontSize: 10,
  },
  quizCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  quizCardDescription: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  quizCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  quizCardStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    color: '#888',
    fontSize: 11,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '600',
  },
  startBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startText: {
    color: '#646cff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Quiz en cours
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'rgba(26,26,46,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  quizTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  timer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#646cff',
    backgroundColor: 'rgba(100,108,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  progressBar: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#646cff',
  },
  quizContent: {
    flex: 1,
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  questionNumber: {
    color: '#888',
    fontSize: 14,
  },
  questionPoints: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
  },
  questionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 24,
    lineHeight: 28,
  },
  options: {
    gap: 12,
    marginBottom: 32,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    gap: 12,
  },
  optionSelected: {
    backgroundColor: 'rgba(100,108,255,0.15)',
    borderWidth: 1,
    borderColor: '#646cff',
  },
  optionLetter: {
    color: '#888',
    fontWeight: 'bold',
    width: 30,
    fontSize: 16,
  },
  optionLetterSelected: {
    color: '#646cff',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  optionTextSelected: {
    color: '#646cff',
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    gap: 8,
  },
  navDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  navDisabledText: {
    color: '#888',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#10b981',
    borderRadius: 12,
    gap: 8,
  },
  submitDisabled: {
    backgroundColor: '#10b981',
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answeredCount: {
    alignItems: 'center',
  },
  answeredCountText: {
    color: '#888',
    fontSize: 12,
  },
  // Examen écrit
  examContent: {
    flex: 1,
    padding: 20,
  },
  examFile: {
    backgroundColor: 'rgba(100,108,255,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  examFileTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  examFileName: {
    color: '#888',
    fontSize: 12,
  },
  examInstructions: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  examInstructionsTitle: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  examInstructionsText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
  },
  examAnswer: {
    marginBottom: 20,
  },
  examAnswerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  examAnswerInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 200,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  submitExamBtn: {
    backgroundColor: '#646cff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitExamText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Résultats
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '85%',
  },
  resultIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  resultScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(100,108,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultScore: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  resultDetail: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  resultCloseBtn: {
    backgroundColor: '#646cff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resultCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});