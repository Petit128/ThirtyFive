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
    console.log(' Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(' Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error(' API Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Lessons services
export const lessonService = {
  getLessons: (params) => api.get('/lessons', { params }),
  getLesson: (id) => api.get(`/lessons/${id}`),
  
  createLesson: (lessonData) => {
    console.log("📦 Données envoyées à l'API:", lessonData);
    
    const formData = new FormData();

    Object.keys(lessonData).forEach(key => {
      if (key === 'htmlFile' && lessonData[key]) {
        formData.append('htmlFile', lessonData[key]);
      } else if (key === 'html_content' || key === 'html') {
        formData.append('html_content', lessonData[key]);
      } else if (key === 'class') {
        formData.append('class_level', lessonData[key]);
      } else {
        formData.append(key, lessonData[key]);
      }
    });
    
    return api.post('/lessons/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  updateLesson: (id, lessonData) => api.put(`/lessons/${id}`, lessonData),
  deleteLesson: (id) => api.delete(`/lessons/${id}`),
  rateLesson: (id, rating, review) => api.post(`/lessons/${id}/rate`, { rating, review }),
  commentLesson: (id, content) => api.post(`/lessons/${id}/comment`, { content }),
  downloadLesson: (id) => api.post(`/lessons/${id}/download`),
  completeLesson: (id, score) => api.post(`/lessons/${id}/complete`, { score }),
  toggleFavorite: (id) => api.post(`/lessons/${id}/favorite`),
};

// User services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getProgress: () => api.get('/users/progress'),
  getAllUsers: () => api.get('/users'),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;