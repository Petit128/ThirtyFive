// src/components/Navbar.jsx - Version avec badge sur Settings
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BookOpen, LogOut, LogIn, User, Home, Sun, Moon, 
  MessageCircle, FileText, TrendingUp, 
  Sparkles, Settings
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({ user, onLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasUpdates, setHasUpdates] = useState(false);

  // Vérifier si l'utilisateur a des mises à jour de profil
  useEffect(() => {
    if (user) {
      // Exemple: vérifier si le profil est incomplet
      const needsUpdate = !user.bio || !user.avatar || !user.school;
      setHasUpdates(needsUpdate);
    }
  }, [user]);

  const handleLogout = () => {
    console.log('🚪 Déconnexion depuis Navbar');
    onLogout();
    navigate('/');
  };

  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className={`navbar ${isDark ? 'dark' : 'light'}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <BookOpen size={28} />
              <Sparkles size={14} className="logo-sparkle" />
            </div>
            <div className="logo-text">
              <span className="logo-name">T-Five</span>
            </div>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            <Home size={20} />
            <span>Home</span>
          </Link>

          {user ? (
            <>
              <Link to="/forum" className="nav-link">
                <MessageCircle size={20} />
                <span>Forum</span>
              </Link>

              <Link to="/quiz" className="nav-link">
                <FileText size={20} />
                <span>Quiz</span>
              </Link>

              <Link to="/grades" className="nav-link">
                <TrendingUp size={20} />
                <span>Grades</span>
              </Link>

              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link">
                <User size={20} />
                <span>Dashboard</span>
              </Link>

              {/* Settings avec badge optionnel */}
              <Link to="/profile" className="nav-link settings-link">
                <Settings size={20} />
                <span>Settings</span>
                {hasUpdates && <span className="settings-badge"></span>}
              </Link>

              <button onClick={handleLogout} className="nav-link logout-btn">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link login-btn">
              <LogIn size={20} />
              <span>Login</span>
            </Link>
          )}
          
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}