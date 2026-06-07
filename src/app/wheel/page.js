"use client";
import { useState, useRef } from "react";
import "./page.css";

export default function WheelPage() {
  const [names, setNames] = useState([
    "พิซซ่า", "ชาบู", "หมูกระทะ", "อาหารตามสั่ง", "ข้าวมันไก่", "ก๋วยเตี๋ยว", "สเต็ก", "ซูชิ"
  ]);
  const [inputText, setInputText] = useState(
    "พิซซ่า\nชาบู\nหมูกระทะ\nอาหารตามสั่ง\nข้าวมันไก่\nก๋วยเตี๋ยว\nสเต็ก\nซูชิ"
  );
  
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  
  const [isDarkMode, setIsDarkMode] = useState(true);

  // สร้าง Ref สำหรับควบคุมเสียงตอนประกาศรางวัล (Win) อย่างเดียว
  const winAudioRef = useRef(null);

  const colors = [
    "#FF595E", "#FFCA3A", "#8AC926", "#1982C4", 
    "#6A4C93", "#FF924C", "#52A675", "#386FA4"
  ];

  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    const newNames = text.split("\n").filter((name) => name.trim() !== "");
    setNames(newNames.length > 0 ? newNames : ["(ว่าง)"]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const newNames = text
        .split(/\r?\n|,/)
        .map((name) => name.trim())
        .filter((name) => name !== "");

      setNames(newNames.length > 0 ? newNames : ["(ว่าง)"]);
      setInputText(newNames.join("\n"));
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const clearAll = () => {
    const confirmClear = window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างรายชื่อทั้งหมด?");
    if (confirmClear) {
      setNames(["(ว่าง)"]);
      setInputText("");
      setWinner(null);
    }
  };

  const spinWheel = () => {
    if (isSpinning || names.length === 0 || names[0] === "(ว่าง)") return;

    setIsSpinning(true);
    setWinner(null);

    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 8; 
    const totalRotation = rotation + extraSpins + randomDegree;

    setRotation(totalRotation);

    setTimeout(() => {
      const actualDegree = totalRotation % 360;
      const sliceAngle = 360 / names.length;
      const winningIndex = Math.floor(((360 - actualDegree) % 360) / sliceAngle);

      setWinner(names[winningIndex]);
      setIsSpinning(false);
      
      // เล่นเสียงตอนได้รางวัลหลังจากวงล้อหยุด
      if (winAudioRef.current) {
        winAudioRef.current.currentTime = 0;
        winAudioRef.current.play().catch(e => console.log("Audio play error:", e));
      }

    }, 5000); 
  };

  const removeWinner = () => {
    const newNames = names.filter((name) => name !== winner);
    const updatedNames = newNames.length > 0 ? newNames : ["(ว่าง)"];
    setNames(updatedNames);
    setInputText(updatedNames.join("\n"));
    setWinner(null);
  };

  const createGradient = () => {
    if (names.length === 1 && names[0] === "(ว่าง)") {
      return `conic-gradient(from 90deg, #e2e8f0 0% 100%)`;
    }
    const slicePercentage = 100 / names.length;
    let gradientParts = [];
    names.forEach((_, index) => {
      const color = colors[index % colors.length];
      const start = index * slicePercentage;
      const end = (index + 1) * slicePercentage;
      gradientParts.push(`${color} ${start}% ${end}%`);
    });
    return `conic-gradient(from 90deg, ${gradientParts.join(", ")})`;
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`page-layout ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      
      {/* แท็ก Audio ซ่อนไว้สำหรับเล่นเสียงตอนชนะ (ใส่ไฟล์ win.mp3 ในโฟลเดอร์ public) */}
      <audio ref={winAudioRef} src="/win.mp3" preload="auto"></audio>

      {/* ส่วนซ้าย: วงล้อ */}
      <div className="wheel-section">
        <div className="wheel-wrapper">
          <div className="pointer-container">
            <div className="pointer"></div>
          </div>
          
          <button 
            className={`center-spin-btn ${isSpinning ? 'spinning' : ''}`} 
            onClick={spinWheel} 
            disabled={isSpinning || (names.length === 1 && names[0] === "(ว่าง)")}
          >
            SPIN
          </button>

          <div
            className="wheel"
            style={{
              background: createGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s cubic-bezier(0.2, 0.9, 0.2, 1)" : "none",
            }}
          >
            {names.map((name, index) => {
              const sliceAngle = 360 / names.length;
              const rotateAngle = index * sliceAngle + sliceAngle / 2;

              return (
                <div
                  key={index}
                  className="wheel-text-wrapper"
                  style={{ transform: `rotate(${rotateAngle}deg)` }}
                >
                  <span className="wheel-text">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ส่วนขวา: แถบเครื่องมือ */}
      <div className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="header-title">
            <h2>วงล้อ</h2>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="สลับโหมด">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="file-info-box">
          <p className="info-title">รูปแบบการนำเข้า:</p>
          <ul className="info-list">
            <li>รองรับไฟล์ .txt (ข้อความธรรมดา)</li>
            <li>รองรับไฟล์ .csv (ตาราง)</li>
            <li>พิมพ์รายชื่อ 1 ชื่อ ต่อ 1 บรรทัด</li>
          </ul>
        </div>

        <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="list-header">
            <label>รายชื่อในวงล้อ:</label>
            <span className="badge">{names[0] === "(ว่าง)" ? 0 : names.length}</span>
          </div>
          <textarea
            className="name-input"
            value={inputText}
            onChange={handleTextChange}
            placeholder="พิมพ์รายชื่อที่นี่ 1 ชื่อต่อ 1 บรรทัด..."
            disabled={isSpinning}
          />
        </div>

        <div className="sidebar-actions">
          <label htmlFor="fileInput" className={`action-btn upload-btn ${isSpinning ? 'disabled' : ''}`}>
            <span className="icon">📂</span> นำเข้าไฟล์
          </label>
          <input
            type="file"
            id="fileInput"
            accept=".csv, .txt"
            onChange={handleFileUpload}
            disabled={isSpinning}
          />
          
          <button 
            className={`action-btn clear-btn ${isSpinning ? 'disabled' : ''}`} 
            onClick={clearAll} 
            disabled={isSpinning}
          >
            <span className="icon">🗑️</span> เคลียร์
          </button>
        </div>
      </div>

      {/* Modal ประกาศผล */}
      {winner && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="celebration">✨🎉✨</div>
            <p className="modal-subtitle">ขอแสดงความยินดีกับผู้โชคดี!</p>
            <h1 className="winner-name">{winner}</h1>
            <div className="modal-buttons">
              <button className="btn keep-btn" onClick={() => setWinner(null)}>เก็บไว้ในลิสต์ต่อ</button>
              <button className="btn remove-btn" onClick={removeWinner}>นำชื่อนี้ออก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}