"use client";
import { useState } from "react";
import "./foodwaste.css";
import Image from "next/image";
import pic from "./main.png";


const PRICE_PER_KCAL = 0.098; // บาท/kcal — จากเส้นความยากจนคนไทย

function computeDerived(gender, age, height, weight, duration) {
  const g = gender === "male" ? 1 : 0;
  
  // 1. สูตร BMI: kg / (m*m)
  const heightInMeter = height / 100;
  const bmi = weight / (heightInMeter * heightInMeter);
  
  // 2. ปรับสมการ Body_Temp ให้สมจริงทางสรีรวิทยา
  const baseTemp = age < 60 ? 37.0 : 36.8;
  const bodyTemp = baseTemp + (0.015 * duration);
  
  // 3. ปรับสมการ Heart_Rate ให้การเต้นของหัวใจไม่พุ่งสูงเกินมนุษย์ปกติ
  const heartRate = 80 + (duration * 0.6) + (0.014 * bodyTemp) - (0.13 * g) - (0.05 * age);
  
  return { bmi, heartRate, bodyTemp };
}

function mockANN(gender, age, height, weight, duration) {
  const { heartRate } = computeDerived(gender, age, height, weight, duration);
  const gFactor = gender === "male" ? 1.0 : 0.85;
  const met = 3.5 + (heartRate - 70) * 0.05;
  const kcal = (met * weight * duration) / 200 * gFactor;
  return Math.max(1, kcal);
}




function ModelVisualizer() {
  const [activeTab, setActiveTab] = useState("ann");
  const [hoverInfo, setHoverInfo] = useState({
    title: "แตะหรือเลื่อนเมาส์ที่กราฟิก",
    desc: "เพื่อดูคำอธิบายการทำงานเชิงลึกของแต่ละส่วนในโครงสร้างโมเดล พร้อมสูตรและตัวแปรที่ใช้"
  });

  const defaultInfo = {
    title: "แตะหรือเลื่อนเมาส์ที่กราฟิก",
    desc: "เพื่อดูคำอธิบายการทำงานเชิงลึกของแต่ละส่วนในโครงสร้างโมเดล พร้อมสูตรและตัวแปรที่ใช้"
  };



  const handleHover = (title, desc) => setHoverInfo({ title, desc });
  const handleLeave = () => setHoverInfo(defaultInfo);

  // SVG รูปต้นไม้สำหรับ Random Forest (XGBoost ถูกแยกวาดต่างหากแล้ว)
  const SVHTree = ({ primary, secondary, leaf }) => (
    <svg viewBox="0 0 120 100" className="fw-tree-svg">
      <path d="M60,15 L30,45 M60,15 L90,45 M30,45 L15,75 M30,45 L45,75 M90,45 L75,75 M90,45 L105,75" stroke="var(--border2)" strokeWidth="3" fill="none" />
      <circle cx="60" cy="15" r="10" fill={primary} />
      <circle cx="30" cy="45" r="8" fill={secondary} />
      <circle cx="90" cy="45" r="8" fill={secondary} />
      <rect x="7" y="70" width="16" height="16" rx="4" fill={leaf} />
      <rect x="37" y="70" width="16" height="16" rx="4" fill={leaf} />
      <rect x="67" y="70" width="16" height="16" rx="4" fill={leaf} />
      <rect x="97" y="70" width="16" height="16" rx="4" fill={leaf} />
    </svg>
  );

  const renderANN = () => {
    const inputs = [40, 100, 160, 220, 280]; 
    const h1 = [70, 130, 190, 250];          
    const h2 = [70, 130, 190, 250];          
    const out = [160];                       

    // ขยับพิกัดแกน X ไปทางขวาเพิ่มเป็น xIn=160 เพื่อไม่ให้ข้อความชิดขอบจอเกินไป
    const xIn = 160, xH1 = 320, xH2 = 480, xOut = 600;

    const lines = [];
    inputs.forEach(y1 => h1.forEach(y2 => lines.push(<line key={`in-${y1}-${y2}`} x1={xIn} y1={y1} x2={xH1} y2={y2} className="fw-ann-line" />)));
    h1.forEach(y1 => h2.forEach(y2 => lines.push(<line key={`h1-${y1}-${y2}`} x1={xH1} y1={y1} x2={xH2} y2={y2} className="fw-ann-line" />)));
    h2.forEach(y1 => out.forEach(y2 => lines.push(<line key={`out-${y1}-${y2}`} x1={xH2} y1={y1} x2={xOut} y2={y2} className="fw-ann-line" />)));

    const inputLabels = ["x₁ (Gender)", "x₂ (Age)", "x₃ (BMI)", "x₄ (Heart Rate)", "x₅ (Duration)"];
    
    
    return (
      <svg viewBox="0 0 750 320" className="fw-ann-svg">
        {lines}
        
        {/* Input Layer Group */}
        <g className="fw-ann-box-group fw-anim-fast fw-delay-1" onMouseEnter={() => handleHover("Input Layer", "รับค่าตัวแปรอิสระที่ดึงจากข้อมูลผู้ใช้งานเข้าสู่กระบวนการคำนวณ")} onTouchStart={() => handleHover("Input Layer", "รับค่าตัวแปรอิสระที่ดึงจากข้อมูลผู้ใช้งานเข้าสู่กระบวนการคำนวณ")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
          <rect x={xIn - 35} y="10" width="70" height="300" className="fw-ann-box" />
          {inputs.map((y, i) => (
            <g key={`in-${i}`}>
              <circle cx={xIn} cy={y} r="14" className="fw-ann-node" />
              <text x={xIn - 25} y={y+4} textAnchor="end" className="fw-ann-text">{inputLabels[i]}</text>
            </g>
          ))}
          <text x={xIn} y="330" textAnchor="middle" className="fw-ann-text">Input Layer</text>
        </g>

        {/* Hidden Layer 1 Group */}
        <g className="fw-ann-box-group fw-anim-fast fw-delay-2" onMouseEnter={() => handleHover("Hidden Layer 1", "สกัด Feature ซ่อนเร้นและเรียนรู้ข้อมูลด้วย Activation Function")} onTouchStart={() => handleHover("Hidden Layer 1", "สกัด Feature ซ่อนเร้นและเรียนรู้ข้อมูลด้วย Activation Function")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
          <rect x={xH1 - 30} y="40" width="60" height="240" className="fw-ann-box" />
          {h1.map((y, i) => (
            <g key={`h1-${i}`}>
              <circle cx={xH1} cy={y} r="16" className="fw-ann-node" />
              <text x={xH1} y={y+4} textAnchor="middle" className="fw-ann-text">h₁</text>
            </g>
          ))}
          <text x={xH1} y="300" textAnchor="middle" className="fw-ann-text">Hidden Layer 1</text>
        </g>

        {/* Hidden Layer 2 Group */}
        <g className="fw-ann-box-group fw-anim-fast fw-delay-3" onMouseEnter={() => handleHover("Hidden Layer 2", "ประมวลผลความสัมพันธ์เชิงซ้อน (Non-Linear) ขั้นลึก")} onTouchStart={() => handleHover("Hidden Layer 2", "ประมวลผลความสัมพันธ์เชิงซ้อน (Non-Linear) ขั้นลึก")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
          <rect x={xH2 - 30} y="40" width="60" height="240" className="fw-ann-box" />
          {h2.map((y, i) => (
            <g key={`h2-${i}`}>
              <circle cx={xH2} cy={y} r="16" className="fw-ann-node" />
              <text x={xH2} y={y+4} textAnchor="middle" className="fw-ann-text">h₂</text>
            </g>
          ))}
          <text x={xH2} y="300" textAnchor="middle" className="fw-ann-text">Hidden Layer 2</text>
        </g>

        {/* Output Layer Group (Final = Orange) */}
        <g className="fw-ann-box-group fw-anim-fast fw-delay-4" onMouseEnter={() => handleHover("Output Layer (Final Prediction)", "รวบรวมค่าน้ำหนักเพื่อส่งออกเป็นค่าเป้าหมาย (ŷ) คลอรี่ที่เผาผลาญ")} onTouchStart={() => handleHover("Output Layer (Final Prediction)", "รวบรวมค่าน้ำหนักเพื่อส่งออกเป็นค่าเป้าหมาย (ŷ) คลอรี่ที่เผาผลาญ")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
          <rect x={xOut - 30} y="130" width="60" height="60" className="fw-ann-box" style={{stroke: 'var(--orange)'}} />
          <circle cx={xOut} cy={out[0]} r="20" className="fw-ann-node final-node" />
          <text x={xOut} y={out[0]+4} textAnchor="middle" className="fw-ann-text fw-ann-text-hl" style={{color: 'var(--orange2)'}}>ŷ</text>
          <text x={xOut + 35} y={out[0]+4} className="fw-ann-text fw-ann-text-hl">Kcal</text>
          <text x={xOut} y="215" textAnchor="middle" className="fw-ann-text fw-ann-text-hl">Output</text>
        </g>
      </svg>
    );
  };

  // กราฟิกใหม่สำหรับ XGBoost ตรงตามรูปเป๊ะๆ พร้อมโทนสีน้ำเงิน/แดง และ Final สีส้ม
  const renderXGB = () => (
    <svg viewBox="0 0 750 420" className="fw-xgb3-svg">
      <defs>
        <marker id="arrow-muted" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)" />
        </marker>
        <marker id="arrow-res" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--text)" />
        </marker>
      </defs>

      {/* Step 1: Instance */}
      <g className="fw-xgb3-box-group fw-anim-fast fw-delay-1" onMouseEnter={() => handleHover("Instance", "ข้อมูลต้นฉบับที่นำเข้าสู่กระบวนการ Training")} onTouchStart={() => handleHover("Instance", "ข้อมูลต้นฉบับที่นำเข้าสู่กระบวนการ Training")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
         <rect x="300" y="10" width="150" height="30" className="fw-xgb3-box" />
         <text x="375" y="25" className="fw-xgb3-text" style={{fontWeight:'bold'}}>Instance</text>
      </g>

      {/* Lines Instance -> Subsets */}
      <g className="fw-anim-fast fw-delay-2">
         <path d="M375,40 L375,55 L175,55 L175,65" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
         <path d="M375,40 L375,65" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
         <path d="M375,40 L375,55 L575,55 L575,65" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
      </g>

      {/* Step 2: Random Subsets */}
      <g className="fw-anim-fast fw-delay-2">
         {[175, 375, 575].map(cx => (
           <g key={`sub-${cx}`} className="fw-xgb3-box-group" onMouseEnter={() => handleHover("Random Subset", "สุ่มตัวอย่างข้อมูลย่อย (Subsampling) เพื่อลดปัญหา Overfitting")} onTouchStart={() => handleHover("Random Subset", "สุ่มตัวอย่างข้อมูลย่อย (Subsampling) เพื่อลดปัญหา Overfitting")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
             <rect x={cx-55} y="70" width="110" height="24" className="fw-xgb3-box" />
             <text x={cx} y="82" className="fw-xgb3-text fw-xgb3-text-small">Random Subset</text>
           </g>
         ))}
      </g>

      {/* Lines Subset -> Tree */}
      <g className="fw-anim-fast fw-delay-3">
         {[175, 375, 575].map(cx => <line key={`l-tr-${cx}`} x1={cx} y1="94" x2={cx} y2="105" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" /> )}
      </g>

      {/* Step 3: Trees */}
      <g className="fw-anim-fast fw-delay-3" onMouseEnter={() => handleHover("Sequential Trees", "สร้างต้นไม้ตัดสินใจทีละต้น แต่ละต้นโฟกัสแก้ข้อผิดพลาดของต้นก่อนหน้า")} onTouchStart={() => handleHover("Sequential Trees", "สร้างต้นไม้ตัดสินใจทีละต้น แต่ละต้นโฟกัสแก้ข้อผิดพลาดของต้นก่อนหน้า")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
         {[175, 375, 575].map(cx => <rect key={`tb-${cx}`} x={cx-75} y="110" width="150" height="150" className="fw-xgb3-box" /> )}
         
         {/* Tree 1 */}
         <g transform="translate(175, 125)">
            <path d="M0,10 L-25,45 M0,10 L25,45 M-25,45 L-40,85 M-25,45 L-10,85 M25,45 L10,85 M25,45 L40,85" className="fw-xgb3-line" />
            <circle cx="0" cy="10" r="12" className="fw-xgb3-node-b" />
            <circle cx="-25" cy="45" r="10" className="fw-xgb3-node-b" />
            <circle cx="25" cy="45" r="10" className="fw-xgb3-node-r" />
            <circle cx="-40" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="-10" cy="85" r="10" className="fw-xgb3-node-b" />
            <circle cx="10" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="40" cy="85" r="10" className="fw-xgb3-node-r" />
            <text x="0" y="115" className="fw-xgb3-text" style={{fontWeight:'bold'}}>Tree 1</text>
         </g>

         {/* Tree 2 */}
         <g transform="translate(375, 125)">
            <path d="M0,10 L-25,45 M0,10 L25,45 M-25,45 L-40,85 M-25,45 L-10,85 M25,45 L10,85 M25,45 L40,85" className="fw-xgb3-line" />
            <circle cx="0" cy="10" r="12" className="fw-xgb3-node-b" />
            <circle cx="-25" cy="45" r="10" className="fw-xgb3-node-r" />
            <circle cx="25" cy="45" r="10" className="fw-xgb3-node-b" />
            <circle cx="-40" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="-10" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="10" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="40" cy="85" r="10" className="fw-xgb3-node-b" />
            <text x="0" y="115" className="fw-xgb3-text" style={{fontWeight:'bold'}}>Tree 2</text>
         </g>

         {/* Tree 3 */}
         <g transform="translate(575, 125)">
            <text x="-80" y="45" className="fw-xgb3-text" style={{fontSize: '24px', fill: 'var(--muted)', fontWeight:'bold'}}>...</text>
            <path d="M0,10 L-25,45 M0,10 L25,45 M-25,45 L-40,85 M-25,45 L-10,85 M25,45 L10,85 M25,45 L40,85" className="fw-xgb3-line" />
            <circle cx="0" cy="10" r="12" className="fw-xgb3-node-b" />
            <circle cx="-25" cy="45" r="10" className="fw-xgb3-node-b" />
            <circle cx="25" cy="45" r="10" className="fw-xgb3-node-r" />
            <circle cx="-40" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="-10" cy="85" r="10" className="fw-xgb3-node-b" />
            <circle cx="10" cy="85" r="10" className="fw-xgb3-node-r" />
            <circle cx="40" cy="85" r="10" className="fw-xgb3-node-r" />
            <text x="0" y="115" className="fw-xgb3-text" style={{fontWeight:'bold'}}>Tree n</text>
         </g>
      </g>

      {/* Lines Tree -> Result */}
      <g className="fw-anim-fast fw-delay-4">
         {[175, 375, 575].map(cx => <line key={`l-res-${cx}`} x1={cx} y1="260" x2={cx} y2="275" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" /> )}
      </g>

      {/* Step 4: Results */}
      <g className="fw-anim-fast fw-delay-4">
         {[1, 2, 'n'].map((num, i) => {
           const cx = 175 + (i*200);
           return (
             <g key={`res-${num}`} className="fw-xgb3-box-group" onMouseEnter={() => handleHover("Prediction Results", "ผลทำนายย่อยจากต้นไม้แต่ละต้น นำไปชดเชยข้อผิดพลาดกันและกัน")} onTouchStart={() => handleHover("Prediction Results", "ผลทำนายย่อยจากต้นไม้แต่ละต้น นำไปชดเชยข้อผิดพลาดกันและกัน")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
               <rect x={cx-35} y="280" width="70" height="24" className="fw-xgb3-box" />
               <text x={cx} y="292" className="fw-xgb3-text">Result {num}</text>
             </g>
           );
         })}
      </g>

      {/* Step 5: Residual Arrows */}
      <g className="fw-anim-fast fw-delay-5" onMouseEnter={() => handleHover("Residuals (ข้อผิดพลาด)", "ส่วนต่างระหว่างค่าจริงกับผลทำนาย (Error) จะถูกส่งไปเป็น 'เป้าหมาย' ให้ต้นไม้ถัดไปเรียนรู้")} onTouchStart={() => handleHover("Residuals (ข้อผิดพลาด)", "ส่วนต่างระหว่างค่าจริงกับผลทำนาย (Error) จะถูกส่งไปเป็น 'เป้าหมาย' ให้ต้นไม้ถัดไปเรียนรู้")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
         <path d="M210,292 L250,292 L250,105 L290,105" className="fw-xgb3-line-res" markerEnd="url(#arrow-res)" />
         <text x="240" y="278" className="fw-xgb3-text fw-xgb3-text-small" transform="rotate(-30 240 278)">Residual 1</text>
         
         <path d="M410,292 L450,292 L450,105 L490,105" className="fw-xgb3-line-res" markerEnd="url(#arrow-res)" />
         <text x="440" y="278" className="fw-xgb3-text fw-xgb3-text-small" transform="rotate(-30 440 278)">Residual n-1</text>
      </g>

      {/* Lines Result -> Weighting */}
      <g className="fw-anim-fast fw-delay-6">
         <path d="M175,304 L175,320 L375,320 L375,335" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
         <path d="M375,304 L375,335" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
         <path d="M575,304 L575,320 L375,320 L375,335" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
      </g>

      {/* Step 6: Weighting */}
      <g className="fw-xgb3-box-group fw-anim-fast fw-delay-6" onMouseEnter={() => handleHover("Weighting (Learning Rate)", "ลดทอนน้ำหนักผลทำนายของต้นไม้แต่ละต้นด้วย Learning Rate (η) ก่อนรวมกัน")} onTouchStart={() => handleHover("Weighting (Learning Rate)", "ลดทอนน้ำหนักผลทำนายของต้นไม้แต่ละต้นด้วย Learning Rate (η) ก่อนรวมกัน")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
         <rect x="275" y="340" width="200" height="30" className="fw-xgb3-box" />
         <text x="375" y="355" className="fw-xgb3-text" style={{fontWeight:'bold'}}>Weighting</text>
      </g>

      {/* Line Weighting -> Final */}
      <g className="fw-anim-fast fw-delay-7">
         <line x1="375" y1="370" x2="375" y2="385" className="fw-xgb3-line" markerEnd="url(#arrow-muted)" />
      </g>

      {/* Final Prediction (Orange) */}
      <g className="fw-xgb3-box-group fw-anim-fast fw-delay-7" onMouseEnter={() => handleHover("Final Prediction", "ผลรวมสุทธิของต้นไม้ทุกต้น (Ensemble) ซึ่งให้ความแม่นยำสูงมาก")} onTouchStart={() => handleHover("Final Prediction", "ผลรวมสุทธิของต้นไม้ทุกต้น (Ensemble) ซึ่งให้ความแม่นยำสูงมาก")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
         <rect x="300" y="390" width="150" height="34" className="fw-xgb3-box fw-xgb3-box-final" />
         <text x="375" y="407" className="fw-xgb3-text fw-xgb3-text-final">Final Result</text>
      </g>
    </svg>
  );

  return (
    <div className="fw-vis">
      <div className="fw-vis__tabs">
        <button className={`fw-vis__tab ${activeTab === "ann" ? "fw-vis__tab--active" : ""}`} onClick={() => setActiveTab("ann")}>ANN</button>
        <button className={`fw-vis__tab ${activeTab === "xgb" ? "fw-vis__tab--active" : ""}`} onClick={() => setActiveTab("xgb")}>XGBoost</button>
        <button className={`fw-vis__tab ${activeTab === "rf" ? "fw-vis__tab--active" : ""}`} onClick={() => setActiveTab("rf")}>Random Forest</button>
        <button className={`fw-vis__tab ${activeTab === "poly" ? "fw-vis__tab--active" : ""}`} onClick={() => setActiveTab("poly")}>Polynomial</button>
      </div>

      <div className="fw-vis__canvas">
        <div className="fw-vis__scroll-inner">
        {/* === 1. ANN === */}
        {activeTab === "ann" && renderANN()}

        {/* === 2. XGBoost (New Visual) === */}
        {activeTab === "xgb" && renderXGB()}

        {/* === 3. Random Forest === */}
        {activeTab === "rf" && (
          <div className="fw-rf-container">
            <div className="fw-rf-data fw-anim-fast fw-delay-1" onMouseEnter={() => handleHover("Dataset D (N records)", "ชุดข้อมูลตั้งต้นทั้งหมด 15,000 รายการ")} onTouchStart={() => handleHover("Dataset D (N records)", "ชุดข้อมูลตั้งต้นทั้งหมด 15,000 รายการ")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
              Dataset D (X, Y)
            </div>
            
            <div className="fw-rf-branches">
              {[1, 2, 'n'].map((num, idx) => (
                // ปรับให้แอนิเมชันเร็วขึ้น
                <div key={num} className="fw-rf-branch fw-anim-fast" style={{animationDelay: `${0.1 + (idx * 0.05)}s`}}>
                  <div style={{color:'var(--border2)'}}>↓</div>
                  <div className="fw-rf-bag" onMouseEnter={() => handleHover("Bootstrap Aggregating (Bagging)", "สุ่มหยิบข้อมูลขึ้นมาสร้าง Dataset ย่อย ให้ต้นไม้มีเอกลักษณ์")} onTouchStart={() => handleHover("Bootstrap Aggregating (Bagging)", "สุ่มหยิบข้อมูลขึ้นมาสร้าง Dataset ย่อย ให้ต้นไม้มีเอกลักษณ์")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
                    Sample D_{num}
                  </div>
                  <div style={{color:'var(--border2)'}}>↓</div>
                  <div className="fw-rf-treebox" onMouseEnter={() => handleHover(`Decision Tree ${num}`, `สร้างต้นไม้ตัดสินใจอิสระต้นที่ ${num}`)} onTouchStart={() => handleHover(`Decision Tree ${num}`, `สร้างต้นไม้ตัดสินใจอิสระต้นที่ ${num}`)} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
                     <SVHTree primary="var(--text2)" secondary="var(--muted)" leaf="var(--border2)" />
                     <div style={{fontSize:'13px', color:'var(--text)', fontWeight:'bold', marginTop:'5px'}}>Tree {num}</div>
                  </div>
                  <div style={{color:'var(--border2)'}}>↓</div>
                  <div className="fw-rf-pred" onMouseEnter={() => handleHover(`Prediction ${num}`, "ผลทำนายของต้นไม้แต่ละต้น")} onTouchStart={() => handleHover(`Prediction ${num}`, "ผลทำนายของต้นไม้แต่ละต้น")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>ŷ_{num}</div>
                </div>
              ))}
            </div>

            {/* Final Prediction = Orange (เร็วขึ้นเป็น 0.3s) */}
            <div className="fw-rf-agg fw-anim-fast" style={{animationDelay: '0.35s'}} onMouseEnter={() => handleHover("Aggregation (Averaging)", "นำผลทำนายจากต้นไม้ทุกต้นมาหาค่าเฉลี่ยเพื่อผลลัพธ์สุดท้าย")} onTouchStart={() => handleHover("Aggregation (Averaging)", "นำผลทำนายจากต้นไม้ทุกต้นมาหาค่าเฉลี่ยเพื่อผลลัพธ์สุดท้าย")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
              ∑(ŷᵢ) / N = Final Prediction ŷ
            </div>
          </div>
        )}

        {/* === 4. Polynomial Regression === */}
        {activeTab === "poly" && (
          <svg viewBox="0 0 600 320" className="fw-poly-svg" onMouseEnter={() => handleHover("Polynomial Curve", "การวิเคราะห์ถดถอยแบบพหุนาม โค้งรับกับการกระจายตัวที่ไม่เป็นเส้นตรง")} onTouchStart={() => handleHover("Polynomial Curve", "การวิเคราะห์ถดถอยแบบพหุนาม โค้งรับกับการกระจายตัวที่ไม่เป็นเส้นตรง")} onMouseLeave={handleLeave} onTouchEnd={handleLeave}>
             {/* Grid */}
             <g className="fw-poly-grid">
               {[50, 100, 150, 200, 250].map(y => <line key={`g-h-${y}`} x1="40" y1={y} x2="560" y2={y} />)}
               {[100, 200, 300, 400, 500].map(x => <line key={`g-v-${x}`} x1={x} y1="20" x2={x} y2="280" />)}
             </g>

             {/* Axes */}
             <line x1="40" y1="280" x2="560" y2="280" className="fw-poly-axis" />
             <line x1="40" y1="20" x2="40" y2="280" className="fw-poly-axis" />
             <text x="300" y="310" textAnchor="middle" className="fw-poly-text">Independent Variable (X)</text>
             <text x="20" y="150" textAnchor="middle" transform="rotate(-90 20 150)" className="fw-poly-text">Target (Y)</text>

             {/* Formula (Final = Orange) */}
             <g transform="translate(140, 30)" onMouseEnter={(e) => { e.stopPropagation(); handleHover("Polynomial Equation", "สูตรคณิตศาสตร์: โมเดลเรียนรู้ค่าน้ำหนักพจน์ยกกำลัง (X², X³) เพื่อสร้างเส้นโค้ง"); }} onMouseLeave={handleLeave}>
               <rect x="0" y="0" width="320" height="40" className="fw-poly-formula-bg fw-poly-formula-bg-final" />
               <text x="160" y="25" textAnchor="middle" className="fw-poly-formula-text">
                 y = β₀ + β₁x + β₂x² + β₃x³ + ε
               </text>
             </g>

             {/* Curve Animation (วาดเร็วขึ้นเป็น 0.8s) */}
             <path className="fw-poly-curve" d="M 60 70 Q 150 350, 300 200 T 540 60" />

             {/* Scatter Dots Animation (เด้งเร็วขึ้นทีละ 0.04s) */}
             {[
               {x: 60, y: 70}, {x: 100, y: 150}, {x: 140, y: 220}, {x: 180, y: 260},
               {x: 220, y: 250}, {x: 260, y: 200}, {x: 300, y: 210}, {x: 340, y: 170},
               {x: 380, y: 120}, {x: 420, y: 140}, {x: 460, y: 80}, {x: 500, y: 90}, {x: 540, y: 60}
             ].map((dot, i) => (
               <circle key={`dot-${i}`} cx={dot.x} cy={dot.y} r="5" className="fw-poly-dot" 
                 style={{ animationDelay: `${0.04 * i}s` }}
                 onMouseEnter={(e) => { e.stopPropagation(); handleHover("Data Point", "พิกัดข้อมูลจริงที่ใช้ในการ Train Model"); }} 
                 onMouseLeave={handleLeave} 
               />
             ))}

             <text x="490" y="260" className="fw-poly-text" style={{fill: 'var(--orange2)', fontWeight: 'bold'}}>R² = 0.84</text>
          </svg>
        )}
        </div>{/* end fw-vis__scroll-inner */}
      </div>

      <div className="fw-vis__info">
        <div className="fw-vis__info-title">{hoverInfo.title}</div>
        <p className="fw-vis__info-desc">{hoverInfo.desc}</p>
      </div>
    </div>
  );
}










export default function FoodWastePage() {
  const [form, setForm] = useState({
    gender: "", age: "", height: "", weight: "", duration: "",
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const age = parseFloat(form.age);
      const height = parseFloat(form.height);
      const weight = parseFloat(form.weight);
      const duration = parseFloat(form.duration);
      const gender = form.gender;

      const { bmi, heartRate, bodyTemp } = computeDerived(gender, age, height, weight, duration);
      const aiKcal = mockANN(gender, age, height, weight, duration);
      const tradKcal = 180; // Fixed Average (ค่าเฉลี่ยคงที่)

      const aiCost = aiKcal * PRICE_PER_KCAL;
      const tradCost = tradKcal * PRICE_PER_KCAL;
      const savedKcal = Math.abs(tradKcal - aiKcal);
      const savedBaht = savedKcal * PRICE_PER_KCAL;
      const reductionPct = Math.min(99, (savedKcal / tradKcal) * 100);

      setResult({
        aiKcal: aiKcal.toFixed(1),
        tradKcal: tradKcal.toFixed(1),
        aiCost: aiCost.toFixed(2),
        tradCost: tradCost.toFixed(2),
        savedKcal: savedKcal.toFixed(1),
        savedBaht: savedBaht.toFixed(2),
        reductionPct: reductionPct.toFixed(1),
        bmi: bmi.toFixed(1),
        heartRate: heartRate.toFixed(0),
        bodyTemp: bodyTemp.toFixed(2),
      });
      setLoading(false);
    }, 900);
  };

  const handleReset = () => {
    setForm({ gender: "", age: "", height: "", weight: "", duration: "" });
    setResult(null);
  };

  
  const metricsExplanation = [
    { label: "R²", name: "R-Squared", desc: "สัดส่วนความแปรปรวนที่โมเดลสามารถอธิบายได้ ยิ่งใกล้ 100% ยิ่งดี" },
    { label: "MAE", name: "Mean Absolute Error", desc: "ความคลาดเคลื่อนสัมบูรณ์ ยิ่งต่ำยิ่งดี" },
    { label: "RMSE", name: "Root Mean Square Error", desc: "รากที่สองของความคลาดเคลื่อนกำลังสองเฉลี่ย" },
    { label: "MAPE", name: "Mean Absolute Pct Error", desc: "ร้อยละความคลาดเคลื่อนเฉลี่ยสัมบูรณ์" }
  ];

  // นำ Icon ออกเพื่อความ Professional
  const wasteTopics = [
    {
      tag: "ปัญหาการประเมินแบบดั้งเดิม",
      title: "การคำนวณจากค่าเฉลี่ยรวม",
      body: "การประเมินอัตราการเผาผลาญแคลอรีด้วยวิธีการดั้งเดิมที่อาศัยการคำนวณจากค่าเฉลี่ยรวม ไม่สามารถสะท้อนความต้องการพลังงานในระดับบุคคลได้แม่นยำ ส่งผลให้เกิดความสิ้นเปลืองค่าใช้จ่ายและปัญหาขยะอาหาร",
    },
    {
      tag: "วัตถุประสงค์การศึกษา",
      title: "พัฒนาตัวแบบ Machine Learning",
      body: "การศึกษาครั้งนี้มุ่งพัฒนาตัวแบบจำลองสำหรับการพยากรณ์การเผาผลาญแคลอรีเฉพาะบุคคล และประเมินผลกระทบด้านต้นทุนอาหารเปรียบเทียบกับวิธีการประเมินแบบดั้งเดิม",
    },
    {
      tag: "ระเบียบวิธีวิจัย",
      title: "ข้อมูล 15,000 รายการ",
      body: "ใช้ตัวแปร เพศ อายุ น้ำหนัก ส่วนสูง และระยะเวลา นำมาคำนวณสมการเชิงสรีรวิทยา (BMI, Body Temp, Heart Rate) และเทียบ 4 ตัวแบบ: ANN, Random Forest, XGBoost และ Polynomial Regression",
    },
    {
      tag: "ประสิทธิภาพสูงสุด",
      title: "ANN (R-Squared 96.48%)",
      body: "ANN ให้ประสิทธิภาพสูงสุด มีค่า MAE=8.22, RMSE=11.75, MAPE=12.37% ช่วยพยากรณ์ต้นทุนอาหารอ้างอิงจากเกณฑ์เส้นความยากจนได้อย่างมีนัยสำคัญ นำไปสู่การลดขยะอาหารอย่างเป็นรูปธรรม",
    },
  ];

  const modelComparisons = [
    { name: "ANN (Multi-Layer Perceptron)", r2: "96.48%", mae: "8.22", rmse: "11.75", mape: "12.37%", best: true },
    { name: "XGBoost", r2: "93.12%", mae: "11.45", rmse: "15.20", mape: "16.80%", best: false },
    { name: "Random Forest", r2: "91.30%", mae: "13.80", rmse: "18.55", mape: "19.40%", best: false },
    { name: "Polynomial Regression", r2: "84.60%", mae: "19.50", rmse: "24.10", mape: "27.10%", best: false },
  ];


  return (
    <main className="fw-page">

      {/* Hero */}
      <section className="fw-hero">
        <div className="fw-hero__inner">
          <div className="fw-hero__eyebrow">
            <span className="fw-tag">Machine Learning </span>
            <span className="fw-tag fw-tag--dim">deep learning</span>
          </div>
          <h1 className="fw-hero__h1">
            Food Waste <span className="fw-orange">Predictor</span>
          </h1>
          <p className="fw-hero__lead">
            ยกระดับการบริหารจัดการทรัพยากรอาหารและลดขยะอาหารด้วยการพยากรณ์การเผาผลาญแคลอรีเฉพาะบุคคล
          </p>
        </div>

        <div className="fw-section__inner">

          <div className="fw-calc__layout">
            <form className="fw-form" onSubmit={handleSubmit}>

              <div className="fw-form__section-label">ข้อมูลกายภาพ</div>
              <div className="fw-form__grid">
                <div className="fw-field">
                  <label className="fw-label">เพศ</label>
                  <select name="gender" className="fw-input" value={form.gender} onChange={set} required>
                    <option value="">เลือกเพศ</option>
                    <option value="male">ชาย (Male = 1)</option>
                    <option value="female">หญิง (Female = 0)</option>
                  </select>
                </div>
                <div className="fw-field">
                  <label className="fw-label">อายุ (ปี)</label>
                  <input type="number" name="age" className="fw-input" placeholder="เช่น 28" min="5" max="100" value={form.age} onChange={set} required />
                </div>
                <div className="fw-field">
                  <label className="fw-label">ส่วนสูง (ซม.)</label>
                  <input type="number" name="height" className="fw-input" placeholder="เช่น 175" min="100" max="250" value={form.height} onChange={set} required />
                </div>
                <div className="fw-field">
                  <label className="fw-label">น้ำหนัก (กก.)</label>
                  <input type="number" name="weight" className="fw-input" placeholder="เช่น 70" min="20" max="200" value={form.weight} onChange={set} required />
                </div>
              </div>

              <div className="fw-form__section-label" style={{ marginTop: "18px" }}>ข้อมูลกิจกรรม</div>
              <div className="fw-form__grid fw-form__grid--single">
                <div className="fw-field fw-field--full">
                  <label className="fw-label">ระยะเวลากิจกรรม (นาที)</label>
                  <input type="number" name="duration" className="fw-input" placeholder="เช่น 60" min="1" max="600" value={form.duration} onChange={set} required />
                </div>
              </div>

              {/* Derived preview */}
              {form.height && form.weight && form.age && form.duration && form.gender && (() => {
                const d = computeDerived(form.gender, parseFloat(form.age), parseFloat(form.height), parseFloat(form.weight), parseFloat(form.duration));
                return (
                  <div className="fw-derived">
                    <div className="fw-derived__label">ตัวแปรแฝงทางสรีรวิทยา (Physiological Features)</div>
                    <div className="fw-derived__row">
                      <div className="fw-derived__stat">
                        <span className="fw-derived__stat-label">BMI</span>
                        <span className="fw-derived__val">{d.bmi.toFixed(1)}</span>
                      </div>
                      <div className="fw-derived__stat">
                        <span className="fw-derived__stat-label">Heart Rate</span>
                        <span className="fw-derived__val">
                          {d.heartRate.toFixed(0)}<span className="fw-derived__unit">bpm</span>
                        </span>
                      </div>
                      <div className="fw-derived__stat">
                        <span className="fw-derived__stat-label">Body Temp</span>
                        <span className="fw-derived__val">
                          {d.bodyTemp.toFixed(2)}<span className="fw-derived__unit">°C</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="fw-form__actions">
                <button type="submit" className="fw-btn fw-btn--primary" disabled={loading}>
                  {loading
                    ? <span className="fw-btn__loading"><span className="fw-spinner" /> ประมวลผล...</span>
                    : "วิเคราะห์ข้อมูล →"}
                </button>
                <button type="button" className="fw-btn fw-btn--ghost" onClick={handleReset}>รีเซ็ต</button>
              </div>
            </form>

            {/* Result Panel */}
            <div className={`fw-result-panel${result ? " fw-result-panel--visible" : ""}`}>
              {!result ? (
                <div className="fw-result-empty">
                  {/* นำ Icon ออก */}
                  <p style={{ marginTop: 0 }}>รอรับข้อมูลอินพุต<br />กด "วิเคราะห์ข้อมูล" <br />เพื่อทำการพยากรณ์ผ่านโมเดล ANN</p>
                </div>
              ) : (
                <div className="fw-result">
                  <div className="fw-result__badge">ANN Model Prediction</div>

                  {/* Main: ANN */}
                  <div className="fw-result__main">
                    <div className="fw-result__main-row">
                      <div className="fw-result__main-block">
                        <div className="fw-result__main-label">พลังงานที่ควรได้รับ</div>
                        <div className="fw-result__main-val">
                          {result.aiKcal}<span className="fw-result__unit"> kcal</span>
                        </div>
                      </div>
                      <div className="fw-result__main-sep" />
                      <div className="fw-result__main-block">
                        <div className="fw-result__main-label">ต้นทุนที่ควรจัดเตรียม</div>
                        <div className="fw-result__main-val fw-result__main-val--baht">
                          {result.aiCost}<span className="fw-result__unit"> ฿</span>
                        </div>
                      </div>
                    </div>
                    <div className="fw-result__main-sub">ต่อบุคคล / รอบกิจกรรม · 0.098 ฿/kcal</div>
                  </div>

                  {/* Compare */}
                  <div className="fw-result__compare-title">การวิเคราะห์ความคุ้มค่า (Cost Analysis)</div>
                  <div className="fw-result__rows">
                    <div className="fw-result__row">
                      <span>วิธีดั้งเดิม (Fixed Average)</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--old">{result.tradKcal} kcal</span>
                        <span className="fw-result__row-sub">{result.tradCost} ฿</span>
                      </div>
                    </div>
                    <div className="fw-result__row fw-result__row--hl">
                      <span>อัตราการลดความคลาดเคลื่อน</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--good">{result.reductionPct}%</span>
                      </div>
                    </div>
                    <div className="fw-result__row">
                      <span>ส่วนต่างพลังงาน</span>
                      <div className="fw-result__row-right">
                        <span>{result.savedKcal} kcal</span>
                      </div>
                    </div>
                    <div className="fw-result__row fw-result__row--money">
                      <span>ลดความสูญเสียทางเศรษฐกิจได้</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--save">{result.savedBaht} ฿</span>
                        <span className="fw-result__row-sub">ต่อบุคคล</span>
                      </div>
                    </div>
                  </div>

                  <p className="fw-result__note">
                    * ผลลัพธ์จากการคำนวณผ่านสมการจำลองสำหรับสาธิตแนวคิดการทำงานของตัวแบบ
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Food Waste Explanation */}
      <section className="fw-waste">
        <div className="fw-section__inner">
          <div className="fw-section__eyebrow">ที่มาและความสำคัญ</div>
          <h2 className="fw-section__h2">บทคัดย่อ (Abstract)</h2>
          <p className="fw-waste__intro" style={{ maxWidth: '100%', textAlign: 'left', wordBreak: 'break-word' }}>           
             การประเมินอัตราการเผาผลาญแคลอรีของผู้เข้าร่วมกิจกรรมกีฬาด้วยวิธีการดั้งเดิมที่อาศัยการคำนวณจากค่าเฉลี่ยรวม
            ไม่สามารถสะท้อนความต้องการพลังงานในระดับบุคคลได้แม่นยำ ส่งผลให้เกิดความสิ้นเปลืองค่าใช้จ่ายและปัญหาขยะอาหาร
            การศึกษาในครั้งนี้มีวัตถุประสงค์เพื่อพัฒนาตัวแบบจำลอง Machine Learning สำหรับการพยากรณ์การเผาผลาญแคลอรีเฉพาะบุคคล
            และประเมินผลกระทบด้านต้นทุนอาหารเปรียบเทียบกับวิธีการประเมินแบบดั้งเดิม
          </p>
          <div className="fw-waste__grid">
            {wasteTopics.map((t, index) => (
              <div className="fw-wtopic" key={index}>
                <div className="fw-wtopic__top">
                  {/* นำ Icon ออก เหลือเพียงแค่ Tag */}
                  <span className="fw-wtopic__tag">{t.tag}</span>
                </div>
                <h3 className="fw-wtopic__title">{t.title}</h3>
                <p className="fw-wtopic__body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
        
            

      {/* Methodology & Model Evaluation */}
      <section className="fw-methodology">
        <div className="fw-section__inner">
          <div className="fw-section__eyebrow">ระเบียบวิธีวิจัย (Methodology)</div>
          <h2 className="fw-section__h2">การเปรียบเทียบและประเมินโมเดล</h2>
          <p className="fw-waste__intro" style={{ maxWidth: '100%', textAlign: 'justify' }}>
            การศึกษาครั้งนี้ทำการเปรียบเทียบประสิทธิภาพ 4 ตัวแบบ ได้แก่ ANN, Random Forest, XGBoost และ Polynomial Regression
            ผ่านกระบวนการตรวจสอบความถูกต้องแบบไขว้ (K-Fold Cross Validation)
            โดยใช้ค่าความคลาดเคลื่อนสมบูรณ์เฉลี่ย (MAE), ค่ารากที่สองของความคลาดเคลื่อนกำลังสองเฉลี่ย (RMSE),
            ค่าเปอร์เซ็นต์ความคลาดเคลื่อนสมบูรณ์เฉลี่ย (MAPE) และค่าสัมประสิทธิ์การตัดสินใจ (R-Squared)
          </p>

                      <ModelVisualizer />
            
             <div className="fw-metrics__grid">
               {metricsExplanation.map((metric, i) => (
                 <div className="fw-metric-card" key={i}>
                    <div className="fw-metric-card__label">{metric.label}</div>
                    <div className="fw-metric-card__name">{metric.name}</div>
                    <p className="fw-metric-card__desc">{metric.desc}</p>
                 </div>
               ))}
             </div>
          
          <div className="fw-eval__grid">
            <div className="fw-eval__table-wrap" style={{ gridColumn: '1 / -1' }}>
              <h3 className="fw-eval__title">ผลการประเมินประสิทธิภาพตัวแบบ (Model Performance)</h3>
              <div className="fw-eval__table-scroll" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table className="fw-eval__table">
                  <thead>
                    <tr>
                      <th>Algorithm</th>
                      <th>R² Score</th>
                      <th>MAE</th>
                      <th>RMSE</th>
                      <th>MAPE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modelComparisons.map((m, idx) => (
                      <tr key={idx} className={m.best ? "fw-eval__row--best" : ""}>
                        <td>
                          {/* คงดาวสัญลักษณ์ตัวอักษรไว้ให้ตัวที่ดีที่สุด */}
                          {m.best && <span className="fw-eval__star">★</span>} {m.name}
                        </td>
                        <td className="fw-mono">{m.r2}</td>
                        <td className="fw-mono">{m.mae}</td>
                        <td className="fw-mono">{m.rmse}</td>
                        <td className="fw-mono">{m.mape}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Abstract Conclusion */}
      <section className="fw-abstract" style={{ paddingTop: '20px' }}>
        <div className="fw-section__inner">
          <div className="fw-abstract__box">
            <div className="fw-abstract__result">
              <h3 className="fw-eval__title">สรุปงานวิจัย</h3>

              <p>
                ผลการศึกษาพบว่าตัวแบบ <strong>ANN ให้ประสิทธิภาพสูงสุดในการพยากรณ์</strong> โดยมี ค่า MAE เท่ากับ 8.22, ค่า RMSE เท่ากับ 11.75, ค่า MAPE เท่ากับ 12.37% และค่า R-Squared สูงถึง 96.48% 
                จึงได้นำตัวแบบดังกล่าวมาประยุกต์ใช้ในการพยากรณ์อัตราการเผาผลาญพลังงาน และแปลงผลลัพธ์เป็นต้นทุนอาหาร (สกุลเงินบาท) โดยอ้างอิงจากเกณฑ์เส้นความยากจนของประเทศไทย 
                พบว่า <strong>การนำตัวแบบมาใช้สามารถลดต้นทุนได้อย่างมีนัยสำคัญ</strong> แสดงให้เห็นว่า Machine Learning มีประสิทธิภาพในการยกระดับการบริหารจัดการทรัพยากรอาหารและลดขยะอาหารได้อย่างเป็นรูปธรรม
              </p>
            </div>
          </div>
        </div>
      </section>



      
      <section className="fw-poster-section">
        <div className="fw-poster__wrapper">
          <div className="fw-poster__box">
            <div className="fw-poster__header">
              <h2 className="fw-poster__title">Research Poster (A0)</h2>
            </div>
            <div className="fw-poster__a0">
              <div className="fw-poster__placeholder"><Image src={pic} alt="Picture of the author" />;</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="fw-footer">
        <span>Food Waste Reduction Research</span>
        <span className="fw-footer__dot">·</span>
        <span>Build for KKR NCST</span>
        <span>Contract: natchaphol_k@cmu.ac.th</span>
      </footer>
    </main>
  );
}