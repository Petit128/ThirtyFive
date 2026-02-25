import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="theme-toggle">
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
      <span>{isDark ? 'Light' : 'Dark'} Mode</span>
    </button>
  );
}