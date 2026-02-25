import React, { useState } from 'react';

export default function SolarSystem() {
  const [speed, setSpeed] = useState(1);

  return (
    <div className="solar-system">
      <style>{`
        .solar-system {
          padding: 20px;
          background: linear-gradient(180deg, #0a0a2a 0%, #1a1a3a 100%);
          border-radius: 10px;
          min-height: 400px;
          position: relative;
          overflow: hidden;
        }
        .sun {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: #ffd93d;
          border-radius: 50%;
          box-shadow: 0 0 50px #ffd93d;
        }
        .orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px dashed rgba(255,255,255,0.3);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .planet {
          position: absolute;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .mercury { background: #a5a5a5; }
        .venus { background: #e6b800; }
        .earth { background: #4b9cd3; }
        .mars { background: #c1440e; }
        .controls {
          position: absolute;
          bottom: 20px;
          left: 20px;
          color: white;
        }
      `}</style>
      
      <div className="sun" />
      
      {[1, 2, 3, 4].map((orbit, i) => (
        <div
          key={i}
          className="orbit"
          style={{
            width: `${150 + i * 80}px`,
            height: `${150 + i * 80}px`,
            animation: `rotate ${20 / (i + 1) / speed}s linear infinite`
          }}
        >
          <div className={`planet ${['mercury', 'venus', 'earth', 'mars'][i]}`} />
        </div>
      ))}
      
      <style>{`
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
      
      <div className="controls">
        <label>Speed: {speed}x</label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </div>
    </div>
  );
}

SolarSystem.html = `<div class="solar-system">Solar System Explorer</div>`;
SolarSystem.css = ``;
SolarSystem.js = ``;