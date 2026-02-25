import React, { useState } from 'react';

export default function CircuitLab() {
  const [isOn, setIsOn] = useState(false);

  return (
    <div className="circuit-lab">
      <style>{`
        .circuit-lab {
          padding: 20px;
          background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
          border-radius: 10px;
          min-height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .circuit {
          width: 300px;
          height: 200px;
          border: 3px solid #666;
          border-radius: 10px;
          position: relative;
          margin-bottom: 30px;
        }
        .battery {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 60px;
          background: #ffd93d;
          border-radius: 5px;
        }
        .bulb {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${isOn ? '#ffd93d' : '#666'};
          box-shadow: ${isOn ? '0 0 30px #ffd93d' : 'none'};
          transition: all 0.3s ease;
        }
        .wire {
          position: absolute;
          top: 50%;
          left: 60px;
          width: 180px;
          height: 3px;
          background: #ffd93d;
          transform: translateY(-50%);
        }
        .switch {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 60px;
          height: 30px;
          background: ${isOn ? '#4ecdc4' : '#ff6b6b'};
          border-radius: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .switch::after {
          content: '';
          position: absolute;
          width: 26px;
          height: 26px;
          background: white;
          border-radius: 50%;
          top: 2px;
          left: ${isOn ? '32px' : '2px'};
          transition: all 0.3s ease;
        }
      `}</style>
      
      <div className="circuit">
        <div className="battery" />
        <div className="bulb" />
        <div className="wire" />
        <div className="switch" onClick={() => setIsOn(!isOn)} />
      </div>
      
      <p style={{ color: 'white' }}>Click the switch to turn the light {isOn ? 'OFF' : 'ON'}</p>
    </div>
  );
}

CircuitLab.html = `<div class="circuit-lab">Circuit Lab</div>`;
CircuitLab.css = ``;
CircuitLab.js = ``;