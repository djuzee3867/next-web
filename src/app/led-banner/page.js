"use client";

import { useState, useRef } from 'react';
import './banner.css'; 

export default function LEDBannerPage() {
  const [text, setText] = useState("15"); // Changed default to a number for testing
  const [textColor, setTextColor] = useState("#ff0000");
  const [bgColor, setBgColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(500); // Increased default starting size
  const [fontFamily, setFontFamily] = useState("monospace");

  const displayRef = useRef(null);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (displayRef.current.requestFullscreen) {
        displayRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="banner-wrapper">
      
      {/* Settings Panel */}
      <div className="controls-panel">
        <div className="control-group">
          <label>Banner Text</label>
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            className="modern-input"
            placeholder="Enter text..."
          />
        </div>

        <div className="control-group">
          <label>Text Color</label>
          <input 
            type="color" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)} 
            className="color-picker"
          />
        </div>

        <div className="control-group">
          <label>Background</label>
          <input 
            type="color" 
            value={bgColor} 
            onChange={(e) => setBgColor(e.target.value)} 
            className="color-picker"
          />
        </div>

        {/* UPDATED SIZE CONTROL */}
        <div className="control-group">
          <label>Size ({fontSize}px)</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Slider goes up to 1500px now */}
            <input 
              type="range" 
              min="20" 
              max="1500" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))} 
            />
            {/* Number input to type exact massive sizes */}
            <input 
              type="number" 
              min="20" 
              max="3000" 
              value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))} 
              className="modern-input"
              style={{ width: '90px', padding: '8px' }}
            />
          </div>
        </div>

        <div className="control-group">
          <label>Font Style</label>
          <select 
            value={fontFamily} 
            onChange={(e) => setFontFamily(e.target.value)}
            className="modern-select"
          >
            <option value="monospace">Monospace (Classic)</option>
            <option value="sans-serif">Sans-Serif (Modern)</option>
            <option value="serif">Serif (Elegant)</option>
            <option value="impact">Impact (Bold)</option>
          </select>
        </div>

        <button onClick={toggleFullScreen} className="btn-fullscreen">
          ⛶ Full Screen
        </button>
      </div>

      {/* Banner Display Area */}
      <div 
        ref={displayRef}
        className="led-display" 
        style={{ backgroundColor: bgColor }}
      >
        <div 
          className="led-text"
          style={{ 
            color: textColor, 
            fontSize: `${fontSize}px`, 
            fontFamily: fontFamily,
            textShadow: `0 0 10px ${textColor}80`,
            lineHeight: 1 // Keeps the huge numbers perfectly centered vertically
          }}
        >
          {text}
        </div>
      </div>

    </div>
  );
}