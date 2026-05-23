"use client";
import { useState, useEffect } from "react";
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
  
  // State สำหรับจัดการธีม มืด/สว่าง
  const [isDarkMode, setIsDarkMode] = useState(false);

  const colors = [
    "#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", 
    "#BAE1FF", "#E8BAFF", "#FFC4E1", "#D5AAFF"
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
  };

  const spinWheel = () => {
    if (isSpinning || names.length === 0 || names[0] === "(ว่าง)") return;

    setIsSpinning(true);
    setWinner(null);

    const randomDegree = Math.floor(Math.random() * 360);
    const extraSpins = 360 * 6;
    const totalRotation = rotation + extraSpins + randomDegree;

    setRotation(totalRotation);

    setTimeout(() => {
      const actualDegree = totalRotation % 360;
      const sliceAngle = 360 / names.length;
      
      const winningIndex = Math.floor(((360 - actualDegree) % 360) / sliceAngle);

      setWinner(names[winningIndex]);
      setIsSpinning(false);
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

  // สลับธีม
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    // เพิ่มคลาส theme ตาม state ปัจจุบัน
    <div className={`page-layout ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      
      {/* ส่วนซ้าย: วงล้อขนาดใหญ่ */}
      <div className="wheel-section">
        <div className="wheel-wrapper">
          <div className="pointer"></div>
          
          <button 
            className="center-spin-btn" 
            onClick={spinWheel} 
            disabled={isSpinning}
          >
            SPIN
          </button>

          <div
            className="wheel"
            style={{
              background: createGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? "transform 5s cubic-bezier(0.15, 0.85, 0.15, 1)" : "none",
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

      {/* ส่วนขวา: แถบรายชื่อและเครื่องมือแบบกระจก (Glassmorphism) */}
      <div className="sidebar glass-panel">
        <div className="sidebar-header">
          <h2>รายชื่อ <span>{names.length}</span></h2>
          <button className="theme-toggle-btn" onClick={toggleTheme} title="สลับโหมดมืด/สว่าง">
            {isDarkMode ? '☀️' : '🌙'}
          </button>
        </div>
        
        <textarea
          className="name-input"
          value={inputText}
          onChange={handleTextChange}
          placeholder="ใส่ชื่อ 1 ชื่อต่อ 1 บรรทัด"
          disabled={isSpinning}
        />

        <div className="sidebar-actions">
          <label htmlFor="fileInput" className={`upload-btn ${isSpinning ? 'disabled' : ''}`}>
            📁 นำเข้าไฟล์ (.csv, .txt)
          </label>
          <input
            type="file"
            id="fileInput"
            accept=".csv, .txt"
            onChange={handleFileUpload}
            disabled={isSpinning}
          />
        </div>
      </div>

      {/* Modal ประกาศผล */}
      {winner && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <span className="party-emoji">🎉</span>
            <h3>ผู้โชคดีได้แก่...</h3>
            <h1>{winner}</h1>
            <div className="modal-buttons">
              <button className="keep-btn" onClick={() => setWinner(null)}>เก็บไว้ก่อน</button>
              <button className="remove-btn" onClick={removeWinner}>นำชื่อออก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}