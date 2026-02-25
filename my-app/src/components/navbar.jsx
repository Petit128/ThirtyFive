import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, LogOut, LogIn, User, Home, Sun, Moon, UserCircle } from 'lucide-react';
import './Navbar.css';

export default function Navbar({ user, onLogout }) {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    console.log('🚪 Déconnexion depuis Navbar');
    onLogout();
    navigate('/');
  };

  // Ne pas afficher la navbar sur la page de login
  if (location.pathname === '/login') {
    return null;
  }

  return (
    <nav className={`navbar ${isDark ? 'dark' : 'light'}`}>
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <BookOpen size={32} />
          <span>SkillForge</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link">
            <Home size={20} />
            <span>Home</span>
          </Link>

          {user ? (
            <>
              <Link to="/profile" className="nav-link">
                <UserCircle size={20} />
                <span>Profile</span>
              </Link>
              <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="nav-link">
                <User size={20} />
                <span>Dashboard</span>
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