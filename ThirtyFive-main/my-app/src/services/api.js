// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH SERVICES ====================
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// ==================== LESSONS SERVICES ====================
export const lessonService = {
  getLessons: (params) => api.get('/lessons', { params }),
  getLesson: (id) => api.get(`/lessons/${id}`),
  createLesson: (formData) => api.post('/lessons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  completeLesson: (id, score) => api.post(`/users/lesson/${id}/complete`, { score }),
  toggleFavorite: (id) => api.post(`/users/lesson/${id}/favorite`),
};

// ==================== USER SERVICES ====================
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProgress: () => api.get('/users/progress'),
  completeLesson: (lessonId, score) => api.post(`/users/lesson/${lessonId}/complete`, { score }),
  toggleFavorite: (lessonId) => api.post(`/users/lesson/${lessonId}/favorite`),
};

// ==================== GRADES SERVICES ====================
export const gradeService = {
  getMyGrades: () => api.get('/grades/my-grades'),
  getMyReport: () => api.get('/grades/my-report'),
  getAllGrades: (params) => api.get('/grades/all', { params }),
  addGrade: (gradeData) => api.post('/grades', gradeData),
  updateGrade: (id, data) => api.put(`/grades/${id}`, data),
};

// ==================== PROFESSOR SERVICES ====================
export const professorService = {
  getStudents: () => api.get('/professor/students'),
  getStudentGrades: (studentId) => api.get(`/professor/students/${studentId}/grades`),
  addGrade: (data) => api.post('/grades', data),
  getAnalytics: () => api.get('/professor/analytics'),
  getMyLessons: () => api.get('/professor/lessons'),
  uploadFile: (formData) => api.post('/professor/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: (params) => api.get('/professor/files', { params }),
  deleteFile: (id) => api.delete(`/professor/files/${id}`),
  
  // Quiz management
  getMyQuizzes: () => api.get('/professor/quizzes'),
  createQuiz: (quizData) => api.post('/professor/quizzes', quizData),
  deleteQuiz: (id) => api.delete(`/professor/quizzes/${id}`),
  
  // Forum management
  createCategory: (data) => api.post('/forum/categories', data),
  pinTopic: (topicId) => api.put(`/forum/topics/${topicId}/pin`),
  lockTopic: (topicId) => api.put(`/forum/topics/${topicId}/lock`),
};

// ==================== QUIZ SERVICES ====================
export const quizService = {
  getQuizzes: (params) => api.get('/quizzes', { params }),
  getQuiz: (id) => api.get(`/quizzes/${id}`),
  submitAttempt: (quizId, answers) => api.post(`/quizzes/${quizId}/attempt`, { answers }),
};

// ==================== SERVICES EXAMENS ET QUIZ AVANCÉS ====================

// Ajouter dans api.js
export const examService = {
  getQuizResponses: (quizId) => api.get(`/professor/quizzes/${quizId}/responses`),
  getStudentResponse: (quizId, userId) => api.get(`/professor/quizzes/${quizId}/responses/${userId}`),
  gradeExam: (quizId, userId, data) => api.post(`/professor/quizzes/${quizId}/grade/${userId}`, data),
  submitExam: (quizId, formData) => api.post(`/quizzes/${quizId}/submit-exam`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  checkAttempt: (quizId) => api.get(`/quizzes/${quizId}/check-attempt`),
};

// Ajouter à professorService
professorService.getQuizResponses = examService.getQuizResponses;
professorService.getStudentResponse = examService.getStudentResponse;
professorService.gradeExam = examService.gradeExam;

// ==================== FORUM SERVICES ====================
export const forumService = {
  joinWithCode: (inviteCode) => api.post('/forum/join-with-code', { invite_code: inviteCode }),
  getCategories: () => api.get('/forum/categories'),
  getTopics: (categoryId, page = 1, limit = 20) => api.get(`/forum/categories/${categoryId}/topics?page=${page}&limit=${limit}`),
  getTopic: (topicId, page = 1, limit = 20) => api.get(`/forum/topics/${topicId}?page=${page}&limit=${limit}`),
  createTopic: (data) => api.post('/forum/topics', data),
  deleteCategory: (categoryId) => api.delete(`/forum/categories/${categoryId}`),
  deleteTopic: (topicId) => api.delete(`/forum/topics/${topicId}`),
  createPost: (topicId, content) => api.post(`/forum/topics/${topicId}/posts`, { content }),
  updatePost: (postId, content) => api.put(`/forum/posts/${postId}`, { content }),
  deletePost: (postId) => api.delete(`/forum/posts/${postId}`),
  likePost: (postId) => api.post(`/forum/posts/${postId}/like`),
  markAsAnswer: (postId) => api.put(`/forum/posts/${postId}/answer`),
  pinTopic: (topicId) => api.put(`/forum/topics/${topicId}/pin`),
  lockTopic: (topicId) => api.put(`/forum/topics/${topicId}/lock`),
  createCategory: (data) => api.post('/forum/categories', data),
  joinCategory: (categoryId, inviteCode) => api.post(`/forum/categories/${categoryId}/join`, { invite_code: inviteCode }),
  getInviteLink: (categoryId) => api.get(`/forum/categories/${categoryId}/invite`),
  getMyTopics: () => api.get('/forum/my-topics'),
  search: (query, type = 'all') => api.get(`/forum/search?q=${encodeURIComponent(query)}&type=${type}`),
  getUsers: () => api.get('/admin/users'), // Pour les invitations
};


// ==================== ADMIN SERVICES ====================
export const adminService = {
  getUsers: () => api.get('/admin/users'),
  changeUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getStatistics: () => api.get('/admin/statistics'),
  getReports: (type) => api.get(`/admin/reports?type=${type}`),
  getLessons: () => api.get('/admin/lessons'),
  approveLesson: (lessonId, approved) => api.put(`/admin/lessons/${lessonId}/approve`, { approved }),
};

// ==================== UPLOAD SERVICES ====================
export const uploadService = {
  getFiles: (params) => api.get('/upload/files', { params }),
  getRecentFiles: () => api.get('/upload/recent'),
  getFile: (id) => api.get(`/upload/file/${id}`),
  getFilePreview: (id) => api.get(`/upload/preview/${id}`),
  uploadFile: (formData) => api.post('/professor/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteFile: (id) => api.delete(`/professor/files/${id}`),
};

export const fileService = {
  getFiles: (params) => api.get('/files', { params }),
  getPendingFiles: () => api.get('/files/pending'),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  approveFile: (fileId, approved, rejectionReason) => 
    api.put(`/files/${fileId}/approve`, { approved, rejection_reason: rejectionReason }),
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  previewFile: (fileId) => api.get(`/files/preview/${fileId}`),
  downloadFile: async (fileId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/files/download/${fileId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    return response.blob();
  },
};




// Ou avec axios (meilleure gestion)
export const fileServiceAxios = {
  previewFile: (fileId) => api.get(`/files/preview/${fileId}`),
  downloadFile: (fileId) => api.get(`/files/download/${fileId}`, {
    responseType: 'blob'
  })
};


// Exporter aussi sous apiService pour compatibilité
export const apiService = fileService;

export default api;