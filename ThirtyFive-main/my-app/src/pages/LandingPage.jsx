import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BookOpen, Users, ArrowRight, Zap, Download, Brain } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage({ lessons }) {
  const { isDark } = useTheme();

  const features = [
    { icon: <Zap size={32} />, title: 'Interactive Simulations', desc: 'Learn by doing with hands-on activities' },
    { icon: <Download size={32} />, title: 'Download & Share', desc: 'Save lessons and share with classmates' },
    { icon: <Users size={32} />, title: 'All Ages', desc: 'From primary to high school' },
    { icon: <Brain size={32} />, title: 'Multiple Subjects', desc: 'Math, Science, Languages & more' },
  ];

  return (
    <div className={`landing-page ${isDark ? 'dark' : 'light'}`}>
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Interactive Learning,
            <span className="hero-highlight"> Like Never Before</span>
          </h1>
          <p className="hero-subtitle">
            Explore interactive simulations. Download, share, and learn at your own pace.
          </p>
          <div className="hero-buttons">
            <Link to="/login" className="btn btn-primary">
              Start Learning <ArrowRight size={20} />
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-sim">
            <div className="preview-circles">
              <div className="circle"></div>
              <div className="circle"></div>
              <div className="circle"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Why Choose Us?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {lessons && lessons.length > 0 && (
        <section className="featured-lessons">
          <h2 className="section-title">Featured Lessons</h2>
          <div className="lessons-preview-grid">
            {lessons.slice(0, 4).map(lesson => (
              <div key={lesson.id} className="preview-card">
                <div className="preview-emoji">{lesson.emoji || '📚'}</div>
                <h3>{lesson.title}</h3>
                <p>{lesson.subject}</p>
                <span className="interactive-badge">🎮 Interactive</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="stats">
        <div className="stat-item">
          <span className="stat-number">{lessons?.length || 200}+</span>
          <span className="stat-label">Interactive Lessons</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">50K+</span>
          <span className="stat-label">Downloads</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">100+</span>
          <span className="stat-label">Schools</span>
        </div>
      </section>
    </div>
  );
}