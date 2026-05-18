import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { LogIn, Mail, Lock, User, Eye, EyeOff, UserPlus, School, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';
import './LoginPage.css';

export default function LoginPage({ onLogin }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'user'
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
      }

      if (!formData.email) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!agreeTerms) {
        newErrors.terms = 'You must agree to the terms';
      }
    } else {
      if (!formData.email) {
        newErrors.email = 'Email is required';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      if (isLogin) {
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });
        
        onLogin(response.data.user, response.data.token);
        setSuccessMessage('Login successful! Redirecting...');
        
        setTimeout(() => {
          navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard');
        }, 1500);
      } else {
        const response = await authService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
        
        setSuccessMessage('Registration successful! Please login.');
        setTimeout(() => {
          setIsLogin(true);
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            role: 'user'
          });
          setSuccessMessage('');
        }, 2000);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrors({ 
        form: error.response?.data?.message || 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email, password) => {
    setFormData({ ...formData, email, password });
  };

  return (
    <div className={`login-page ${isDark ? 'dark' : 'light'}`}>
      <div className="login-container">
        <div className="auth-toggle">
          <button 
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setErrors({});
              setSuccessMessage('');
            }}
            disabled={loading}
          >
            <LogIn size={18} />
            <span>Login</span>
          </button>
          <button 
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setErrors({});
              setSuccessMessage('');
            }}
            disabled={loading}
          >
            <UserPlus size={18} />
            <span>Register</span>
          </button>
        </div>

        <div className="login-header">
          <div className="login-icon">
            {isLogin ? <LogIn size={48} /> : <UserPlus size={48} />}
          </div>
          <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to access interactive lessons' : 'Join our learning community'}</p>
        </div>

        {successMessage && (
          <div className="success-message">
            <CheckCircle size={20} />
            <span>{successMessage}</span>
          </div>
        )}

        {errors.form && (
          <div className="error-message">
            <AlertCircle size={20} />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="register-name">
                <User size={18} />
                Full Name
              </label>
              <input
                type="text"
                id="register-name"
                name="register-name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className={errors.name ? 'error' : ''}
                disabled={loading}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={errors.email ? 'error' : ''}
              disabled={loading}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              Password
            </label>
            <div className="password-input">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className={errors.password ? 'error' : ''}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirm-password">
                <Lock size={18} />
                Confirm Password
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  name="confirm-password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={errors.confirmPassword ? 'error' : ''}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          )}

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role">
                <School size={18} />
                I am a
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                disabled={loading}
              >
                <option value="user">Student</option>
                <option value="user">Teacher</option>
                <option value="admin">School Admin</option>
              </select>
            </div>
          )}

          {!isLogin && (
            <div className="terms-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={loading}
                />
                <span className="checkbox-text">
                  I agree to the <a href="#" className="terms-link">Terms of Service</a> and <a href="#" className="terms-link">Privacy Policy</a>
                </span>
              </label>
              {errors.terms && <span className="error-text">{errors.terms}</span>}
            </div>
          )}

          {isLogin && (
            <div className="forgot-password">
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>
          )}

          <button 
            type="submit" 
            className={`login-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="link-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setSuccessMessage('');
              }}
              disabled={loading}
            >
              {isLogin ? 'Register here' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
