import React, { useState, useEffect } from 'react';

export default function WaveSimulation() {
  const [amplitude, setAmplitude] = useState(50);
  const [frequency, setFrequency] = useState(2);
  const [speed, setSpeed] = useState(1);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 0.05);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const createWave = () => {
    const points = [];
    for (let x = 0; x <= 100; x += 2) {
      const y = amplitude * Math.sin(x / (10/frequency) - time * speed);
      points.push(
        <div
          key={x}
          className="wave-point"
          style={{
            left: `${x}%`,
            bottom: `${50 + y}%`,
          }}
        />
      );
    }
    return points;
  };

  return (
    <div className="wave-simulation">
      <style>{`
        .wave-simulation {
          background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 10px;
          padding: 20px;
          height: 400px;
          position: relative;
          overflow: hidden;
        }
        
        .wave-container {
          position: relative;
          width: 100%;
          height: 300px;
          background: rgba(255,255,255,0.1);
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .wave-point {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #00ff00;
          border-radius: 50%;
          transform: translate(-50%, 50%);
          box-shadow: 0 0 20px #00ff00;
          transition: all 0.1s ease;
        }
        
        .controls {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }
        
        .control {
          flex: 1;
          min-width: 200px;
        }
        
        .control label {
          display: block;
          color: white;
          margin-bottom: 5px;
        }
        
        .control input {
          width: 100%;
        }
        
        .value {
          color: #00ff00;
          margin-left: 10px;
        }
      `}</style>
      
      <div className="wave-container">
        {createWave()}
      </div>
      
      <div className="controls">
        <div className="control">
          <label>Amplitude <span className="value">{amplitude}</span></label>
          <input
            type="range"
            min="10"
            max="80"
            value={amplitude}
            onChange={(e) => setAmplitude(Number(e.target.value))}
          />
        </div>
        
        <div className="control">
          <label>Frequency <span className="value">{frequency}</span></label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
          />
        </div>
        
        <div className="control">
          <label>Speed <span className="value">{speed}</span></label>
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
    </div>
  );
}

// Add static properties for download
WaveSimulation.html = `
<div class="wave-simulation">
  <div class="wave-container" id="waveContainer"></div>
  <div class="controls">
    <div class="control">
      <label>Amplitude <span id="ampValue">50</span></label>
      <input type="range" id="amplitude" min="10" max="80" value="50">
    </div>
    <div class="control">
      <label>Frequency <span id="freqValue">2</span></label>
      <input type="range" id="frequency" min="0.5" max="5" step="0.1" value="2">
    </div>
    <div class="control">
      <label>Speed <span id="speedValue">1</span></label>
      <input type="range" id="speed" min="0.5" max="3" step="0.1" value="1">
    </div>
  </div>
</div>
`;

WaveSimulation.css = `
.wave-simulation {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 10px;
  padding: 20px;
  height: 400px;
  position: relative;
  overflow: hidden;
}

.wave-container {
  position: relative;
  width: 100%;
  height: 300px;
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.wave-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #00ff00;
  border-radius: 50%;
  transform: translate(-50%, 50%);
  box-shadow: 0 0 20px #00ff00;
  transition: all 0.1s ease;
}

.controls {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.control {
  flex: 1;
  min-width: 200px;
}

.control label {
  display: block;
  color: white;
  margin-bottom: 5px;
  font-family: Arial, sans-serif;
}

.control input {
  width: 100%;
  height: 5px;
  border-radius: 5px;
  background: linear-gradient(90deg, #00ff00, #0000ff);
  -webkit-appearance: none;
}

.control input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #00ff00;
}

.value {
  color: #00ff00;
  margin-left: 10px;
  float: right;
}
`;

WaveSimulation.js = `
// Wave Simulation JavaScript
let amplitude = 50;
let frequency = 2;
let speed = 1;
let time = 0;
let animationId;

const container = document.getElementById('waveContainer');
const ampInput = document.getElementById('amplitude');
const freqInput = document.getElementById('frequency');
const speedInput = document.getElementById('speed');
const ampValue = document.getElementById('ampValue');
const freqValue = document.getElementById('freqValue');
const speedValue = document.getElementById('speedValue');

function createWave() {
  container.innerHTML = '';
  for (let x = 0; x <= 100; x += 1.5) {
    const y = amplitude * Math.sin(x / (10/frequency) - time * speed);
    const point = document.createElement('div');
    point.className = 'wave-point';
    point.style.left = x + '%';
    point.style.bottom = (50 + y) + '%';
    container.appendChild(point);
  }
}

function animate() {
  time += 0.05;
  createWave();
  animationId = requestAnimationFrame(animate);
}

ampInput.addEventListener('input', (e) => {
  amplitude = Number(e.target.value);
  ampValue.textContent = amplitude;
});

freqInput.addEventListener('input', (e) => {
  frequency = Number(e.target.value);
  freqValue.textContent = frequency;
});

speedInput.addEventListener('input', (e) => {
  speed = Number(e.target.value);
  speedValue.textContent = speed;
});

animate();
`;