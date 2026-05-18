import React, { useState } from 'react';

export default function FractionBuilder() {
  const [numerator, setNumerator] = useState(1);
  const [denominator, setDenominator] = useState(4);

  const pieces = [];
  for (let i = 0; i < denominator; i++) {
    pieces.push(
      <div
        key={i}
        className={`fraction-piece ${i < numerator ? 'filled' : ''}`}
        onClick={() => i < numerator ? setNumerator(i) : setNumerator(i + 1)}
      />
    );
  }

  return (
    <div className="fraction-builder">
      <style>{`
        .fraction-builder {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          min-height: 400px;
        }
        .fraction-display {
          text-align: center;
          font-size: 3rem;
          color: white;
          margin-bottom: 30px;
        }
        .fraction-visual {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
          gap: 10px;
          margin-bottom: 30px;
        }
        .fraction-piece {
          aspect-ratio: 1;
          background: rgba(255,255,255,0.1);
          border: 2px solid white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .fraction-piece.filled {
          background: #ffd93d;
          box-shadow: 0 0 20px #ffd93d;
        }
        .controls {
          display: flex;
          gap: 20px;
          justify-content: center;
        }
        .control-btn {
          padding: 10px 20px;
          background: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
      `}</style>
      
      <div className="fraction-display">
        {numerator}/{denominator}
      </div>
      
      <div className="fraction-visual">
        {pieces}
      </div>
      
      <div className="controls">
        <button className="control-btn" onClick={() => setDenominator(d => Math.min(d + 1, 8))}>
          + Add Piece
        </button>
        <button className="control-btn" onClick={() => setDenominator(d => Math.max(d - 1, 2))}>
          - Remove Piece
        </button>
      </div>
    </div>
  );
}

FractionBuilder.html = `<div class="fraction-builder">Interactive Fraction Builder</div>`;
FractionBuilder.css = ``;
FractionBuilder.js = ``;