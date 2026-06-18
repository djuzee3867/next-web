"use client";

import React, { useState, useEffect, useMemo } from "react";
import styles from "./page.module.css";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

// 🎨 กำหนดสีของแต่ละภาคส่วนให้ดู Modern
const THEME = {
  power: "#FEB019",      // Amber Glow
  transport: "#FF4560",  // Neon Pink/Red
  industry: "#008FFB",   // Electric Blue
};

const SECTORS = [
  {
    id: "power", name: "การผลิตไฟฟ้า (Power Generation)", icon: "⚡",
    bestModel: "Hybrid 1", mape: "4.40%", outlook: "SARIMAX + Ridge Regression", direction: "down", color: THEME.power,
    desc: "ปรับแก้ความคลาดเคลื่อนของ SARIMAX ด้วย Ridge Regression ที่เรียนรู้จากสัดส่วนเชื้อเพลิง ตอบสนองต่อแนวโน้มได้อย่างแม่นยำ",
  },
  {
    id: "transport", name: "การขนส่ง (Transport)", icon: "🚗",
    bestModel: "Hybrid 2", mape: "1.77%", outlook: "ETS + Ridge Regression", direction: "up", color: THEME.transport,
    desc: "ภาคส่วนที่มีความผันผวนสูง การใช้ Exponential Smoothing (ETS) เป็นฐานแล้วชดเชยด้วย Ridge ทำให้ได้โมเดลที่มีค่า Error ต่ำที่สุด",
  },
  {
    id: "industry", name: "อุตสาหกรรม (Industry)", icon: "🏭",
    bestModel: "Hybrid 3", mape: "3.55%", outlook: "SARIMAX + Prophet", direction: "down", color: THEME.industry,
    desc: "เทคนิค Ensemble ระหว่าง SARIMAX และ Prophet เพื่อรักษาความเสถียรของเส้นพยากรณ์ ลดปัญหา Overfitting จากความซับซ้อนของภาคอุตสาหกรรม",
  },
];

// 🌟 สร้าง Custom Tooltip แบบ Glassmorphism (กึ่งโปร่งใส)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "16px",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.5)",
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        minWidth: "220px"
      }}>
        <p style={{ margin: "0 0 12px 0", fontWeight: "800", color: "#1a1a2e", fontSize: "15px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: entry.color, boxShadow: `0 0 8px ${entry.color}80` }}></div>
              <span style={{ color: "#555", fontSize: "13px", fontWeight: "600" }}>{entry.name}</span>
            </div>
            <span style={{ fontWeight: "900", color: entry.color, fontSize: "15px" }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function CO2ResearchPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewFilter, setViewFilter] = useState("ALL"); 

  useEffect(() => { setIsMounted(true); }, []);

  const fetchPrediction = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ส่งค่าเฉลี่ยเชื้อเพลิงพื้นฐานไปให้ API เพื่อให้กราฟวาดเส้น Baseline ได้อย่างสมบูรณ์
        body: JSON.stringify({
          coal: 2000,
          oil: 2500,
          gas: 4500,
        })
      });
      const result = await response.json();
      setChartData(result.data); 
    } catch (error) {
      console.error("เชื่อมต่อ API ไม่สำเร็จ:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchPrediction(); 
    }
  }, [isMounted]);

  const displayedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (viewFilter === "ALL") return chartData;
    if (viewFilter === "5Y") return chartData.filter(d => parseInt(d.name.split(" ")[1]) >= 2022);
    if (viewFilter === "FORECAST") return chartData.filter(d => parseInt(d.name.split(" ")[1]) >= 2026);
    return chartData;
  }, [chartData, viewFilter]);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>งานวิจัย · ภาคพลังงานของประเทศไทย</span>
          <h1 className={styles.heroTitle}>การพยากรณ์การปล่อยก๊าซ CO₂ จาก 3 ภาคพลังงานหลัก</h1>
          <p className={styles.heroSub}>
            ขับเคลื่อนด้วย 3 โมเดล Hybrid แบบเจาะจงรายภาคส่วน (SARIMA, ETS, Prophet, Ridge Regression)
            พร้อมกราฟแสดงผลแนวโน้มแบบเต็มหน้าจอ (2010–2027)
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.predictionSection}`}>
        <div className={styles.wideContainer}>
          <div className={styles.predictionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>ผลการพยากรณ์ (Prediction Dashboard)</h2>
              <p className={styles.sectionSub}>แสดงแนวโน้มการปล่อยก๊าซ CO₂ ในอดีตและผลลัพธ์ที่โมเดลพยากรณ์ไว้ในอนาคต</p>
            </div>
            
            <div className={styles.timeSelector}>
              <button className={viewFilter === "ALL" ? styles.activeBtn : ""} onClick={() => setViewFilter("ALL")}>All Data</button>
              <button className={viewFilter === "5Y" ? styles.activeBtn : ""} onClick={() => setViewFilter("5Y")}>Last 5 Years</button>
              <button className={viewFilter === "FORECAST" ? styles.activeBtn : ""} onClick={() => setViewFilter("FORECAST")}>Forecast Only</button>
            </div>
          </div>
          
          <div className={styles.predictionLayout}>
            {/* Chart Panel (ขยายใหญ่ ไม่มีแถบ Input แล้ว) */}
            <div className={styles.giantChartPanel}>
              <div className={styles.chartWrapperGiant}>
                {!isMounted || isLoading ? (
                  <div className={styles.loadingState}>กำลังดาวน์โหลดข้อมูลจากโมเดล...</div>
                ) : displayedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayedData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      
                      {/* 🌟 Filter ทำ Glow Effect ให้เส้นกราฟ */}
                      <defs>
                        <filter id="glowPower" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={THEME.power} floodOpacity="0.4" />
                        </filter>
                        <filter id="glowTransport" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={THEME.transport} floodOpacity="0.4" />
                        </filter>
                        <filter id="glowIndustry" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={THEME.industry} floodOpacity="0.4" />
                        </filter>
                      </defs>

                      <CartesianGrid strokeDasharray="4 4" vertical={true} horizontal={true} stroke="#f0ede8" />
                      
                      <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#8899bb', fontWeight: 500 }} axisLine={false} tickLine={false} minTickGap={50} dy={10} />
                      <YAxis tick={{ fontSize: 13, fill: '#8899bb', fontWeight: 500 }} axisLine={false} tickLine={false} dx={-10} />
                      
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e8e6e0', strokeWidth: 2, strokeDasharray: '5 5' }} />
                      
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '30px', fontWeight: 600, color: '#4a4a6a' }} />

                      {viewFilter !== "FORECAST" && (
                        <ReferenceLine 
                          x="Jan 2026" stroke="#1a1a2e" strokeDasharray="4 4" strokeWidth={1.5}
                          label={{ position: 'top', value: 'START FORECAST', fill: '#1a1a2e', fontSize: 11, fontWeight: '800', letterSpacing: '0.1em' }} 
                        />
                      )}
                      
                      <Line 
                        type="monotone" name="Hybrid1 (Power)" dataKey="Hybrid1 (Power)" 
                        stroke={THEME.power} strokeWidth={3.5} dot={false} 
                        activeDot={{ r: 8, fill: THEME.power, stroke: '#fff', strokeWidth: 3, filter: 'url(#glowPower)' }} 
                        filter="url(#glowPower)" 
                      />
                      <Line 
                        type="monotone" name="Hybrid2 (Transport)" dataKey="Hybrid2 (Transport)" 
                        stroke={THEME.transport} strokeWidth={3.5} dot={false} 
                        activeDot={{ r: 8, fill: THEME.transport, stroke: '#fff', strokeWidth: 3, filter: 'url(#glowTransport)' }} 
                        filter="url(#glowTransport)" 
                      />
                      <Line 
                        type="monotone" name="Hybrid3 (Industry)" dataKey="Hybrid3 (Industry)" 
                        stroke={THEME.industry} strokeWidth={3.5} dot={false} 
                        activeDot={{ r: 8, fill: THEME.industry, stroke: '#fff', strokeWidth: 3, filter: 'url(#glowIndustry)' }} 
                        filter="url(#glowIndustry)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={styles.loadingState}>ไม่มีข้อมูล</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sectors Grid ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>ข้อมูลเจาะจงรายโมเดล</h2>
          <div className={styles.sectorsGrid}>
            {SECTORS.map((s) => (
              <div key={s.id} className={styles.sectorCard} style={{ "--accent": s.color }}>
                <div className={styles.sectorTop}>
                  <span className={styles.sectorIcon}>{s.icon}</span>
                  <span className={styles.sectorOutlook} data-direction={s.direction}>
                    {s.outlook}
                  </span>
                </div>
                <h3 className={styles.sectorName}>{s.name}</h3>
                <div className={styles.sectorModelRow}>
                  <span className={styles.sectorModelLabel}>Best Model</span>
                  <span className={styles.sectorModel} style={{ background: s.color }}>{s.bestModel}</span>
                  <span className={styles.sectorMape}>MAPE {s.mape}</span>
                </div>
                <p className={styles.sectorDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}