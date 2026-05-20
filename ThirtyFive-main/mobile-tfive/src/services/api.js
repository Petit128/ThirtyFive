import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// À MODIFIER avec votre IP locale
// Pour trouver votre IP: cmd -> ipconfig (cherchez IPv4)
// Exemple: http://192.168.1.45:5000/api
const API_URL = 'http://192.168.181.95:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor pour ajouter le token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📤', config.method?.toUpperCase(), config.url);
  return config;
});

// Interceptor pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('📥', response.config.url, response.status);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== SERVICES API ====================

export const lessonService = {
  getLessons: (params) => api.get('/lessons', { params }),
  getLesson: (id) => api.get(`/lessons/${id}`),
  createLesson: (data) => api.post('/lessons', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  completeLesson: (id, score) => api.post(`/users/lesson/${id}/complete`, { score }),
  toggleFavorite: (id) => api.post(`/users/lesson/${id}/favorite`),
};

export const quizService = {
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  submitAttempt: (quizId, answers) => api.post(`/quizzes/${quizId}/attempt`, { answers }),
};

export const gradeService = {
  getMyGrades: () => api.get('/grades/my-grades'),
  getMyReport: () => api.get('/grades/my-report'),
  getAllGrades: (params) => api.get('/grades/all', { params }),
  addGrade: (gradeData) => api.post('/grades', gradeData),
};

export const forumService = {
  getCategories: () => api.get('/forum/categories'),
  getTopics: (categoryId, page = 1, limit = 20) => 
    api.get(`/forum/categories/${categoryId}/topics?page=${page}&limit=${limit}`),
  getTopic: (topicId, page = 1, limit = 20) => 
    api.get(`/forum/topics/${topicId}?page=${page}&limit=${limit}`),
  createTopic: (data) => api.post('/forum/topics', data),
  createPost: (topicId, content) => api.post(`/forum/topics/${topicId}/posts`, { content }),
  likePost: (postId) => api.post(`/forum/posts/${postId}/like`),
  deletePost: (postId) => api.delete(`/forum/posts/${postId}`),
  markAsAnswer: (postId) => api.put(`/forum/posts/${postId}/answer`),
  deleteTopic: (topicId) => api.delete(`/forum/topics/${topicId}`),
  deleteCategory: (categoryId) => api.delete(`/forum/categories/${categoryId}`),
   joinWithCode: (inviteCode) => api.post('/forum/join-with-code', { invite_code: inviteCode }),
  
  getMyTopics: () => api.get('/forum/my-topics'),
  search: (query, type = 'all') => api.get(`/forum/search?q=${encodeURIComponent(query)}&type=${type}`),
  getUsers: () => api.get('/admin/users'),
    joinCategory: (categoryId, inviteCode) => api.post(`/forum/categories/${categoryId}/join`, { invite_code: inviteCode }),
      createCategory: (data) => api.post('/forum/categories', data),
         getInviteLink: (categoryId) => api.get(`/forum/categories/${categoryId}/invite`),  
};

export const professorService = {
  getStudents: () => api.get('/professor/students'),
  getStudentGrades: (studentId) => api.get(`/professor/students/${studentId}/grades`),
  getAnalytics: () => api.get('/professor/analytics'),
  getMyLessons: () => api.get('/professor/lessons'),
  getMyQuizzes: () => api.get('/professor/quizzes'),
  createQuiz: (data) => api.post('/professor/quizzes', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteQuiz: (id) => api.delete(`/professor/quizzes/${id}`),
  uploadFile: (formData) => api.post('/professor/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: (params) => api.get('/professor/files', { params }),
  deleteFile: (id) => api.delete(`/professor/files/${id}`),
};

export const adminService = {
  getUsers: () => api.get('/admin/users'),
  getStatistics: () => api.get('/admin/statistics'),
  getLessons: () => api.get('/admin/lessons'),
  getFiles: (params) => api.get('/admin/files', { params }),
  approveLesson: (lessonId, approved) => api.put(`/admin/lessons/${lessonId}/approve`, { approved }),
  changeUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  deleteFile: (fileId) => api.delete(`/admin/files/${fileId}`),
  getReports: (type) => api.get(`/admin/reports?type=${type}`),
};

export const examService = {
  checkAttempt: (quizId) => api.get(`/quizzes/${quizId}/check-attempt`),
  submitExam: (quizId, formData) => api.post(`/quizzes/${quizId}/submit-exam`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getQuizResponses: (quizId) => api.get(`/professor/quizzes/${quizId}/responses`),
  gradeExam: (quizId, userId, data) => api.post(`/professor/quizzes/${quizId}/grade/${userId}`, data),
};

// Ajouter les services d'examen aux services professeur
professorService.getQuizResponses = examService.getQuizResponses;
professorService.gradeExam = examService.gradeExam;

// Ajouter ces services

export const uploadService = {
  getFiles: (params) => api.get('/files', { params }),
  getPendingFiles: () => api.get('/files/pending'),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  approveFile: (fileId, approved, rejectionReason) => 
    api.put(`/files/${fileId}/approve`, { approved, rejection_reason: rejectionReason }),
  previewFile: (fileId) => api.get(`/files/preview/${fileId}`),
  downloadFile: (fileId) => api.get(`/files/download/${fileId}`, {
    responseType: 'blob'
  }),
};

// Ajouter getQuizResponses et gradeExam à professorService s'ils manquent
professorService.getQuizResponses = (quizId) => api.get(`/professor/quizzes/${quizId}/responses`);
professorService.gradeExam = (quizId, userId, data) => api.post(`/professor/quizzes/${quizId}/grade/${userId}`, data);

// Ajouter ces méthodes aux services existants

// ForumService - méthodes manquantes
forumService.updatePost = (postId, content) => api.put(`/forum/posts/${postId}`, { content });
forumService.pinTopic = (topicId) => api.put(`/forum/topics/${topicId}/pin`);
forumService.lockTopic = (topicId) => api.put(`/forum/topics/${topicId}/lock`);
forumService.deleteTopic = (topicId) => api.delete(`/forum/topics/${topicId}`);

// ProfessorService - déjà ajouté
professorService.getQuizResponses = (quizId) => api.get(`/professor/quizzes/${quizId}/responses`);
professorService.gradeExam = (quizId, userId, data) => api.post(`/professor/quizzes/${quizId}/grade/${userId}`, data);

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

