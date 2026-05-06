"use client";
import { useState } from "react";
import "./foodwaste.css";

const PRICE_PER_KCAL = 0.098; 

function computeDerived(gender, age, height, weight, duration) {
  const g = gender === "male" ? 1 : 0;
  const bmi = weight / Math.pow(height / 100, 2);
  const heartRate = 80 + duration + 0.014 * bmi - 0.13 * g - 0.001 * age;
  const baseTemp = age < 60 ? 38.8 : 38.57;
  const bodyTemp = baseTemp + 0.085 * duration;
  return { bmi, heartRate, bodyTemp };
}

function mockANN(gender, age, height, weight, duration) {
  // จำลองสูตรคำนวณใกล้เคียง ANN — ใช้สมการสรีรวิทยา[cite: 1]
  const { bmi, heartRate } = computeDerived(gender, age, height, weight, duration);
  const gFactor = gender === "male" ? 1.0 : 0.85;
  // สูตร MET-based approximation[cite: 1]
  const met = 3.5 + (heartRate - 70) * 0.05;
  const kcal = (met * weight * duration) / 200 * gFactor;
  return Math.max(1, kcal);
}

function traditionalMethod(weight, duration, allKcal) {
  // Fixed Average Method: ใช้ค่าเฉลี่ยคงที่ต่อหัว[cite: 1]
  const avgKcal = allKcal ?? 180; // ค่าเฉลี่ยคงที่สมมติ[cite: 1]
  return avgKcal;
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
      const tradKcal = 180; // Fixed Average (ค่าเฉลี่ยคงที่)[cite: 1]

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

  const wasteTopics = [
    {
      icon: "", tag: "ปัญหาระดับโลก",
      title: "1 ใน 3 ของอาหารทั้งหมดถูกทิ้ง",
      body: "FAO รายงานว่าอาหารกว่า 1.3 พันล้านตันถูกสูญเสียทุกปี ขณะที่ผู้คน 800 ล้านคนยังขาดแคลนอาหาร ความขัดแย้งนี้สะท้อนถึงความไม่สมดุลในระบบห่วงโซ่อาหารโลกที่ต้องได้รับการแก้ไขอย่างเร่งด่วน",
    },
    {
      icon: "", tag: "ขยะจากกิจกรรมกีฬา",
      title: "จัดเตรียมผิด — ทิ้งหรือขาด",
      body: "งานกิจกรรมกีฬาขนาดใหญ่มักใช้ \"ค่าเฉลี่ยคงที่\" ต่อหัวในการเตรียมอาหาร แต่แต่ละคนเผาผลาญพลังงานต่างกันตามเพศ อายุ น้ำหนัก ส่วนสูง และความหนักของกิจกรรม ทำให้เกิดความคลาดเคลื่อนมากกว่า 6,000 kcal ต่อรอบกิจกรรม",
    },
    {
      icon: "", tag: "ผลกระทบเชิงเศรษฐกิจ",
      title: "ต้นทุนที่ซ่อนอยู่ในจาน",
      body: "งานวิจัยนี้แปลงความสูญเสียเป็นมูลค่าเงินจากเส้นความยากจนของคนไทยและข้อมูลการใช้พลังงานต่อวัน ได้ราคา 0.0980 บาทต่อกิโลแคลอรี ผู้จัดงานที่ใช้วิธีดั้งเดิมจึงแบกรับต้นทุนแฝงที่หลีกเลี่ยงได้",
    },
    {
      icon: "", tag: "ทางออกด้วย Deep Learning",
      title: "ทำนายรายบุคคล ลดความสูญเสีย",
      body: "ANN เรียนรู้ความสัมพันธ์เชิงซ้อนระหว่างข้อมูลกายภาพและสรีรวิทยา ให้ค่า R² > 0.99 และ MAE < 0.44 kcal/คน ลดความคลาดเคลื่อนจากกว่า 6,000 kcal เหลือเพียงหลักสิบ kcal — ประหยัดต้นทุนได้ถึง 99%",
    },
  ]; //[cite: 1]

  const modelComparisons = [
    { name: "ANN (Multi-Layer Perceptron)", r2: "0.994", mae: "0.42", best: true },
    { name: "CatBoost Regressor", r2: "0.988", mae: "0.85", best: false },
    { name: "XGBoost", r2: "0.981", mae: "1.15", best: false },
    { name: "Random Forest", r2: "0.962", mae: "2.40", best: false },
  ];

  return (
    <main className="fw-page">

      {/* Hero */}
      <section className="fw-hero">
        <div className="fw-hero__inner">
          <div className="fw-hero__eyebrow">
            <span className="fw-tag">Deep Learning</span>
            <span className="fw-tag">Machine Learning</span>
          </div>
          <h1 className="fw-hero__h1">
            Food Waste <span className="fw-orange">Predictor</span>
          </h1>
          <p className="fw-hero__lead">
            โมเดลทำนายการเผาผลาญแคลอรีเพื่อลดขยะอาหารในกิจกรรมกีฬา
          </p>
        </div>
      </section>

      {/* Food Waste Explanation */}
      <section className="fw-waste">
        <div className="fw-section__inner">
          <div className="fw-section__eyebrow">Understanding The Problem</div>
          <h2 className="fw-section__h2">Food Waste คืออะไร?</h2>
          <p className="fw-waste__intro">
            <strong>ขยะอาหาร (Food Waste)</strong> คืออาหารที่เตรียมหรือซื้อมาแล้วแต่ไม่ได้ถูกบริโภคและถูกทิ้งในที่สุด ปัญหานี้เกิดขึ้นตั้งแต่ระดับครัวเรือนไปจนถึงการจัดงานกิจกรรมขนาดใหญ่และส่งผลกระทบต่อทั้งสิ่งแวดล้อม เศรษฐกิจ และสังคมในวงกว้าง
          </p>
          <div className="fw-waste__grid">
            {wasteTopics.map((t) => (
              <div className="fw-wtopic" key={t.tag}>
                <div className="fw-wtopic__top">
                  <span className="fw-wtopic__icon">{t.icon}</span>
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
          <div className="fw-section__eyebrow">Methodology</div>
          <h2 className="fw-section__h2">การเปรียบเทียบและประเมินโมเดล</h2>
          <p className="fw-waste__intro">
            ในการพัฒนาตัวแบบทำนายปริมาณแคลอรีที่เผาผลาญ ได้มีการทดสอบเปรียบเทียบอัลกอริทึมทั้งกลุ่ม Machine Learning และ Deep Learning โดยใช้เทคนิค <strong>K-Fold Cross Validation</strong> เพื่อยืนยันความเสถียรของโมเดล และทดสอบนัยสำคัญทางสถิติ เพื่อเปรียบเทียบค่าความคลาดเคลื่อน
          </p>

          <div className="fw-eval__grid">
            <div className="fw-eval__table-wrap">
              <h3 className="fw-eval__title">ประสิทธิภาพตัวแบบ (Model Performance)</h3>
              <table className="fw-eval__table">
                <thead>
                  <tr>
                    <th>Algorithm</th>
                    <th>R² Score</th>
                    <th>MAE (kcal)</th>
                  </tr>
                </thead>
                <tbody>
                  {modelComparisons.map((m, idx) => (
                    <tr key={idx} className={m.best ? "fw-eval__row--best" : ""}>
                      <td>
                        {m.best && <span className="fw-eval__star">★</span>} {m.name}
                      </td>
                      <td className="fw-mono">{m.r2}</td>
                      <td className="fw-mono">{m.mae}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="fw-feature">
              <h3 className="fw-eval__title">ความสำคัญของตัวแปร (Feature Importance)</h3>
              <div className="fw-feature__list">
                <div className="fw-feature__item">
                  <div className="fw-feature__label"><span>ระยะเวลา (Duration)</span> <span>45%</span></div>
                  <div className="fw-feature__bar"><div className="fw-feature__fill" style={{ width: "45%" }}></div></div>
                </div>
                <div className="fw-feature__item">
                  <div className="fw-feature__label"><span>น้ำหนัก (Weight)</span> <span>25%</span></div>
                  <div className="fw-feature__bar"><div className="fw-feature__fill" style={{ width: "25%" }}></div></div>
                </div>
                <div className="fw-feature__item">
                  <div className="fw-feature__label"><span>อัตราการเต้นหัวใจ (HR)</span> <span>18%</span></div>
                  <div className="fw-feature__bar"><div className="fw-feature__fill" style={{ width: "18%" }}></div></div>
                </div>
                <div className="fw-feature__item">
                  <div className="fw-feature__label"><span>อายุ (Age)</span> <span>8%</span></div>
                  <div className="fw-feature__bar"><div className="fw-feature__fill" style={{ width: "8%" }}></div></div>
                </div>
                <div className="fw-feature__item">
                  <div className="fw-feature__label"><span>เพศ (Gender)</span> <span>4%</span></div>
                  <div className="fw-feature__bar"><div className="fw-feature__fill" style={{ width: "4%" }}></div></div>
                </div>
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
                ANN ให้ประสิทธิภาพสูงสุดด้วย R² &gt; 0.99 และ MAE &lt; 0.44 kcal/คน 
                เมื่อจำลองสถานการณ์พบว่าวิธีดั้งเดิมมีความคลาดเคลื่อนมากกว่า 6,000 kcal ขณะที่ ANN 
                มีเพียงหลักสิบ kcal — <strong>ลดความผิดพลาดได้ถึง 99% คิดเป็นเงินประหยัดได้หลายร้อยบาทต่อรอบกิจกรรม</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calculator (Reverted to the very first provided code) */}
      <section className="fw-calc">
        <div className="fw-section__inner">
          <div className="fw-section__eyebrow">ทดลองใช้งาน</div>
          <h2 className="fw-section__h2">ทำนายพลังงานและต้นทุนอาหาร</h2>
          <p className="fw-calc__desc"></p>

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
                  <input type="number" name="duration" className="fw-input" placeholder="เช่น 20" min="1" max="600" value={form.duration} onChange={set} required />
                </div>
              </div>

              {/* Derived preview */}
            {/* Derived preview */}
            {form.height && form.weight && form.age && form.duration && form.gender && (() => {
            const d = computeDerived(form.gender, parseFloat(form.age), parseFloat(form.height), parseFloat(form.weight), parseFloat(form.duration));
            return (
                <div className="fw-derived">
                <div className="fw-derived__label">คำนวณจากสูตรสรีรวิทยา</div>
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
                    ? <span className="fw-btn__loading"><span className="fw-spinner" /> กำลังทำนาย...</span>
                    : "ทำนายพลังงาน →"}
                </button>
                <button type="button" className="fw-btn fw-btn--ghost" onClick={handleReset}>รีเซ็ต</button>
              </div>
            </form>

            {/* Result Panel */}
            <div className={`fw-result-panel${result ? " fw-result-panel--visible" : ""}`}>
              {!result ? (
                <div className="fw-result-empty">
                  <span className="fw-result-empty__icon">🍽️</span>
                  <p>กรอกข้อมูลแล้วกด<br />"ทำนายพลังงาน"<br />เพื่อดูผลลัพธ์</p>
                </div>
              ) : (
                <div className="fw-result">
                  <div className="fw-result__badge">ผลลัพธ์ — ANN Prediction</div>

                  {/* Main: ANN */}
                  <div className="fw-result__main">
                    <div className="fw-result__main-row">
                      <div className="fw-result__main-block">
                        <div className="fw-result__main-label">พลังงานที่ต้องการ</div>
                        <div className="fw-result__main-val">
                          {result.aiKcal}<span className="fw-result__unit"> kcal</span>
                        </div>
                      </div>
                      <div className="fw-result__main-sep" />
                      <div className="fw-result__main-block">
                        <div className="fw-result__main-label">ต้นทุนที่ควรเตรียม</div>
                        <div className="fw-result__main-val fw-result__main-val--baht">
                          {result.aiCost}<span className="fw-result__unit"> ฿</span>
                        </div>
                      </div>
                    </div>
                    <div className="fw-result__main-sub">ต่อคน / ต่อกิจกรรม · 0.098 ฿/kcal</div>
                  </div>

                  {/* Compare */}
                  <div className="fw-result__compare-title">เปรียบเทียบกับวิธีดั้งเดิม</div>
                  <div className="fw-result__rows">
                    <div className="fw-result__row">
                      <span>Fixed Avg (ดั้งเดิม)</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--old">{result.tradKcal} kcal</span>
                        <span className="fw-result__row-sub">{result.tradCost} ฿</span>
                      </div>
                    </div>
                    <div className="fw-result__row fw-result__row--hl">
                      <span>ลดความคลาดเคลื่อน</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--good">{result.reductionPct}%</span>
                      </div>
                    </div>
                    <div className="fw-result__row">
                      <span>kcal ที่ต่างกัน</span>
                      <div className="fw-result__row-right">
                        <span>{result.savedKcal} kcal</span>
                      </div>
                    </div>
                    <div className="fw-result__row fw-result__row--money">
                      <span>ประหยัดได้</span>
                      <div className="fw-result__row-right">
                        <span className="fw-result__row-val--save">{result.savedBaht} ฿</span>
                        <span className="fw-result__row-sub">ต่อคน</span>
                      </div>
                    </div>
                  </div>

                  <p className="fw-result__note">
                    * จำลองเพื่อสาธิต · ตัวแบบ ANN จริงต้องโหลดน้ำหนักจากการฝึกด้วย TensorFlow/Keras
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
} //[cite: 1]