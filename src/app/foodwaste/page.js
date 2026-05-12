"use client";
import { useState } from "react";
import "./foodwaste.css";

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
            <span className="fw-tag">Machine Learning · ANN · K-Fold CV</span>
            <span className="fw-tag fw-tag--dim">ข้อมูล 15,000 รายการ</span>
          </div>
          <h1 className="fw-hero__h1">
            Food Waste <span className="fw-orange">Predictor</span>
          </h1>
          <p className="fw-hero__lead">
            ยกระดับการบริหารจัดการทรัพยากรอาหารและลดขยะอาหารด้วยการพยากรณ์การเผาผลาญแคลอรีเฉพาะบุคคล
          </p>
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

          <div className="fw-eval__grid">
            <div className="fw-eval__table-wrap" style={{ gridColumn: '1 / -1' }}>
              <h3 className="fw-eval__title">ผลการประเมินประสิทธิภาพตัวแบบ (Model Performance)</h3>
              <div style={{ overflowX: 'auto' }}>
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
              <span className="fw-abstract__result-label">บทสรุปงานวิจัย</span>
              <p>
                ผลการศึกษาพบว่าตัวแบบ <strong>ANN ให้ประสิทธิภาพสูงสุดในการพยากรณ์</strong> โดยมี ค่า MAE เท่ากับ 8.22, ค่า RMSE เท่ากับ 11.75, ค่า MAPE เท่ากับ 12.37% และค่า R-Squared สูงถึง 96.48% 
                จึงได้นำตัวแบบดังกล่าวมาประยุกต์ใช้ในการพยากรณ์อัตราการเผาผลาญพลังงาน และแปลงผลลัพธ์เป็นต้นทุนอาหาร (สกุลเงินบาท) โดยอ้างอิงจากเกณฑ์เส้นความยากจนของประเทศไทย 
                พบว่า <strong>การนำตัวแบบมาใช้สามารถลดต้นทุนได้อย่างมีนัยสำคัญ</strong> แสดงให้เห็นว่า Machine Learning มีประสิทธิภาพในการยกระดับการบริหารจัดการทรัพยากรอาหารและลดขยะอาหารได้อย่างเป็นรูปธรรม
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator */}
      <section className="fw-calc">
        <div className="fw-section__inner">
          <div className="fw-section__eyebrow">ระบบจำลอง</div>
          <h2 className="fw-section__h2">ทำนายพลังงานและต้นทุนอาหาร</h2>
          <p className="fw-calc__desc">
            กรอกตัวแปรข้อมูลจำเพาะบุคคล — ระบบจะประเมินค่าทางสรีรวิทยาให้อัตโนมัติ
            และแสดงผลลัพธ์เป็นแคลอรีเปรียบเทียบกับมูลค่าทางเศรษฐศาสตร์
          </p>

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

      <footer className="fw-footer">
        <span>Food Waste Reduction Research</span>
        <span className="fw-footer__dot">·</span>
        <span>Build for KKR NCST</span>
        <span>Contract: natchaphol_k@cmu.ac.th</span>
      </footer>
    </main>
  );
}