// src/components/Quiz/QuestionCard.jsx
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function QuestionCard({ question, index, selectedAnswer, onAnswerSelect, showResult = false }) {
  const { isDark } = useTheme();

  return (
    <div className={`question-card ${isDark ? 'dark' : 'light'}`}>
      <div className="question-header">
        <span className="question-number">Question {index + 1}</span>
        <span className="question-points">{question.points} pts</span>
      </div>
      
      <h4 className="question-text">{question.question_text}</h4>
      
      <div className="options-list">
        {question.options.map((option, optIndex) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = showResult && option.toLowerCase() === question.correct_answer?.toLowerCase();
          const isWrong = showResult && isSelected && !isCorrect;
          
          return (
            <button
              key={optIndex}
              className={`option-btn ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => !showResult && onAnswerSelect(option)}
              disabled={showResult}
            >
              <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
              <span>{option}</span>
              {showResult && isCorrect && <span className="check-icon">✓</span>}
              {showResult && isWrong && <span className="x-icon">✗</span>}
            </button>
          );
        })}
      </div>
      
      {showResult && question.correct_answer && (
        <div className="correct-answer">
          <strong>Correct answer:</strong> {question.correct_answer}
        </div>
      )}
    </div>
  );
}