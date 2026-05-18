import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LessonViewer from './pages/LessonViewer';
import ProfilePage from './pages/ProfilePage';
import ForumPage from './pages/Forum/ForumPage';
import QuizPage from './pages/Quiz/QuizPage';
import CreateLesson from './pages/CreateLesson';
import CreateQuiz from './pages/CreateQuiz';
import ProfessorDashboard from './pages/ProfessorDashboard';
import GradesPage from './pages/Grades/GradesPage';
import ProtectedRoute from './components/ProtectedRoute';
import { authService, lessonService } from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        
        if (savedUser && savedToken) {
          setUser(JSON.parse(savedUser));
        }

        try {
          const response = await lessonService.getLessons();
          setLessons(response.data.lessons);
        } catch (error) {
          console.error('Erreur chargement leçons:', error);
          
          const defaultLessons = [
            {
              id: 1,
              title: 'Wave Simulator',
              subject: 'Physics',
              class: 'High School',
              description: 'Explore wave properties with this interactive simulator',
              html_content: '<div class="wave-sim">Wave Simulator Content</div>',
              downloads: 1234,
              rating: 4.8,
              emoji: '🌊',
              createdAt: new Date().toISOString()
            },
            {
              id: 2,
              title: 'Fraction Builder',
              subject: 'Math',
              class: 'Primary',
              description: 'Learn fractions by building and comparing visual representations',
              html_content: '<div class="fraction-sim">Fraction Builder Content</div>',
              downloads: 856,
              rating: 4.6,
              emoji: '🧮',
              createdAt: new Date().toISOString()
            }
          ];
          setLessons(defaultLessons);
          localStorage.setItem('lessons', JSON.stringify(defaultLessons));
        }
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleLogin = (userData, token) => {
    console.log('✅ Connexion réussie:', userData);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('🚪 Déconnexion');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

// src/App.jsx - Corriger la fonction addLesson
const addLesson = async (lessonData) => {
  console.log('📤 addLesson appelé avec:', lessonData);
  
  try {
    let response;
    
    // Si c'est un upload de fichier HTML
    if (lessonData.htmlFile instanceof File) {
      const formData = new FormData();
      formData.append('title', lessonData.title);
      formData.append('description', lessonData.description || '');
      formData.append('subject', lessonData.subject || 'Général');
      formData.append('class_level', lessonData.class_level || lessonData.class || 'Tous niveaux');
      formData.append('emoji', lessonData.emoji || '📚');
      formData.append('file', lessonData.htmlFile);
      
      response = await lessonService.createLesson(formData);
    } 
    // Si c'est du HTML direct
    else if (lessonData.html_content) {
      response = await lessonService.createLesson({
        title: lessonData.title,
        description: lessonData.description || '',
        subject: lessonData.subject || 'Général',
        class_level: lessonData.class_level || lessonData.class || 'Tous niveaux',
        emoji: lessonData.emoji || '📚',
        html_content: lessonData.html_content
      });
    }
    // Sinon, créer une leçon simple
    else {
      response = await lessonService.createLesson({
        title: lessonData.title,
        description: lessonData.description || '',
        subject: lessonData.subject || 'Général',
        class_level: lessonData.class_level || lessonData.class || 'Tous niveaux',
        emoji: lessonData.emoji || '📚',
        html_content: '<div>Contenu par défaut</div>'
      });
    }
    
    console.log('✅ Réponse du backend:', response.data);
    const newLesson = response.data.lesson;
    setLessons([...lessons, newLesson]);
    return newLesson;
    
  } catch (error) {
    console.error('❌ Erreur ajout leçon:', error);
    
    // Fallback local
    const maxId = Math.max(...lessons.map(l => Number(l.id)), 0);
    const newLesson = {
      ...lessonData,
      id: maxId + 1,
      html_content: lessonData.html_content || '<div>Contenu interactif</div>',
      downloads: 0,
      rating: 0,
      created_at: new Date().toISOString()
    };
    const updatedLessons = [...lessons, newLesson];
    setLessons(updatedLessons);
    localStorage.setItem('lessons', JSON.stringify(updatedLessons));
    return newLesson;
  }
};

  const deleteLesson = async (id) => {
    try {
      await lessonService.deleteLesson(id);
      const updatedLessons = lessons.filter(l => l.id !== id);
      setLessons(updatedLessons);
      localStorage.setItem('lessons', JSON.stringify(updatedLessons));
    } catch (error) {
      console.error('Erreur suppression leçon:', error);
      
      const updatedLessons = lessons.filter(l => l.id !== id);
      setLessons(updatedLessons);
      localStorage.setItem('lessons', JSON.stringify(updatedLessons));
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Chargement de l'application...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Navbar user={user} onLogout={handleLogout} />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LandingPage lessons={lessons} />} />
              
              <Route 
                path="/login" 
                element={<LoginPage onLogin={handleLogin} />} 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute user={user}>
                    <ProfilePage user={user} setUser={setUser} />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute user={user} allowedRole={['student', 'user']}>
                    <UserDashboard user={user} lessons={lessons} />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute user={user} allowedRole="admin">
                    <AdminDashboard 
                      user={user} 
                      lessons={lessons} 
                      addLesson={addLesson} 
                      deleteLesson={deleteLesson} 
                    />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/lesson/:id" 
                element={
                  <ProtectedRoute user={user}>
                    <LessonViewer lessons={lessons} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/forum" 
                element={
                  <ProtectedRoute user={user}>
                    <ForumPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/quiz" 
                element={
                  <ProtectedRoute user={user}>
                    <QuizPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/grades" 
                element={
                  <ProtectedRoute user={user}>
                    <GradesPage />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/professor/*" 
                element={
                  <ProtectedRoute user={user} allowedRole="professor">
                    <ProfessorDashboard user={user} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/professor/lessons/new" 
                element={
                  <ProtectedRoute user={user} allowedRole="professor">
                    <CreateLesson addLesson={addLesson} />
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/professor/quizzes/new" 
                element={
                  <ProtectedRoute user={user} allowedRole="professor">
                    <CreateQuiz />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;