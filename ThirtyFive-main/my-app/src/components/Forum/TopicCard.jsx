// src/components/Forum/TopicCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Lock, Pin, Eye } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function TopicCard({ topic }) {
  const { isDark } = useTheme();

  return (
    <div className={`topic-card ${isDark ? 'dark' : 'light'}`}>
      <div className="topic-icon">
        {topic.is_pinned ? <Pin size={20} /> : <MessageCircle size={20} />}
        {topic.is_locked && <Lock size={16} className="lock-icon" />}
      </div>
      
      <div className="topic-content">
        <Link to={`/forum/topic/${topic.id}`}>
          <h3>{topic.title}</h3>
        </Link>
        <div className="topic-meta">
          <span>by {topic.author_name}</span>
          <span>📅 {new Date(topic.created_at).toLocaleDateString()}</span>
          <span><Eye size={14} /> {topic.views || 0} views</span>
          <span>💬 {topic.replies_count || 0} replies</span>
        </div>
      </div>
      
      <div className="topic-last-activity">
        <small>Last activity: {new Date(topic.last_activity).toLocaleDateString()}</small>
      </div>
    </div>
  );
}