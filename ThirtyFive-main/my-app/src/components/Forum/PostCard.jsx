// src/components/Forum/PostCard.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ThumbsUp, Trash2, Edit, CheckCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function PostCard({ post, onLike, onDelete, onMarkAnswer, isAdmin, isTopicAuthor }) {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const isAuthor = user?.id === post.user_id;
  const canDelete = isAuthor || isAdmin;

  return (
    <div className={`post-card ${isDark ? 'dark' : 'light'} ${post.is_answer ? 'answer-post' : ''}`}>
      <div className="post-author">
        <img src={post.author_avatar || '/default-avatar.png'} alt={post.author_name} />
        <div>
          <strong>{post.author_name}</strong>
          <span className="post-role">{post.role}</span>
        </div>
      </div>
      
      <div className="post-content">
        <p>{post.content}</p>
        <small className="post-date">
          Posted: {new Date(post.created_at).toLocaleString()}
          {post.updated_at !== post.created_at && ` (edited)`}
        </small>
      </div>
      
      <div className="post-actions">
        <button onClick={() => onLike(post.id)} className="action-btn">
          <ThumbsUp size={16} /> {post.likes || 0}
        </button>
        
        {canDelete && (
          <button onClick={() => onDelete(post.id)} className="action-btn delete">
            <Trash2 size={16} />
          </button>
        )}
        
        {isAdmin && !post.is_answer && (
          <button onClick={() => onMarkAnswer(post.id)} className="action-btn answer">
            <CheckCircle size={16} /> Mark as Answer
          </button>
        )}
        
        {post.is_answer && (
          <span className="answer-badge">
            <CheckCircle size={16} /> Accepted Answer
          </span>
        )}
      </div>
    </div>
  );
}