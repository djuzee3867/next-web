"use client";
import { useState } from 'react';
import { DAYS, TIME_SLOTS, SUBJECT_COLORS } from '../lib/scheduleStore';

export default function ScheduleGrid({ subjects, onCellClick, onCellDrop, onSessionClick }) {
  const [hoveredSession, setHoveredSession] = useState(null);

  const timeColsCount = TIME_SLOTS.length - 1; // 10 ชั่วโมง
  const START_HOUR = parseInt(TIME_SLOTS[0]); // เริ่ม 8
  const TOTAL_MINUTES = timeColsCount * 60; // 600 นาที

  return (
    <div className="grid-wrapper">
      <div className="grid-container">
        
        {/* หัวมุมซ้ายบน */}
        <div className="corner-cell">วัน / เวลา</div>
        
        {/* แถวเวลา (แต่ละช่องกินพื้นที่ 60 นาที) */}
        {TIME_SLOTS.slice(0, -1).map((time, hi) => (
          <div 
            key={hi} 
            className="time-header" 
            style={{ gridColumn: `${2 + hi * 60} / span 60`, gridRow: 1 }}
          >
            <span>{time}</span>
          </div>
        ))}

        {/* แถวของแต่ละวัน + ตารางช่องว่าง */}
        {DAYS.map((day, di) => {
          const rowIdx = di + 2;
          return (
            <div key={`day-row-${di}`} style={{ display: 'contents' }}>
              <div className="day-label" style={{ gridColumn: 1, gridRow: rowIdx }}>{day}</div>
              
              {/* สร้างตารางเปล่า 1 ชั่วโมง (span 60 คอลัมน์) */}
              {Array.from({ length: timeColsCount }).map((_, hi) => {
                const clickedHour = START_HOUR + hi;
                const startTime = `${String(clickedHour).padStart(2, '0')}:00`;
                const endTime = `${String(clickedHour + 1).padStart(2, '0')}:00`;
                
                return (
                  <div 
                    key={`empty-${di}-${hi}`} 
                    className={`cell empty ${di % 2 !== 0 ? 'bg-alt' : ''}`} 
                    style={{ gridColumn: `${2 + hi * 60} / span 60`, gridRow: rowIdx }}
                    onClick={() => onCellClick(di, startTime, endTime)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const subjectId = e.dataTransfer.getData('text/plain');
                      if (subjectId && onCellDrop) {
                        onCellDrop(subjectId, di, startTime, endTime);
                      }
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* กล่องวิชาเรียน - อ้างอิงพิกัดกับ Grid 600 นาทีโดยตรง */}
        {subjects.map(subject => 
          (subject.sessions || []).map(session => {
            const [sh, sm] = session.startTime.split(':').map(Number);
            const [eh, em] = session.endTime.split(':').map(Number);
            
            // แปลงเวลาให้เป็นจุดเริ่มต้น Grid (นาที)
            let startMins = (sh - START_HOUR) * 60 + sm;
            let endMins = (eh - START_HOUR) * 60 + em;
            
            // กันเหนียวกรณีเวลาเกินตาราง
            startMins = Math.max(0, Math.min(startMins, TOTAL_MINUTES));
            endMins = Math.max(0, Math.min(endMins, TOTAL_MINUTES));
            if (startMins >= endMins) return null; 

            // รองรับระบบ Custom Color
            const color = subject.color || SUBJECT_COLORS[subject.colorIndex];
            
            return (
              <div
                key={session.id} 
                className="session-card"
                style={{
                  gridColumn: `${2 + startMins} / ${2 + endMins}`,
                  gridRow: session.day + 2,
                  background: color.bg,
                  color: color.text || '#fff', // ปรับสีตัวอักษรให้อัตโนมัติ
                  boxShadow: hoveredSession === session.id ? `0 8px 25px ${color.bg}80` : '0 4px 12px rgba(0,0,0,0.08)',
                }}
                onClick={(e) => { e.stopPropagation(); onSessionClick(subject, session); }}
                onMouseEnter={() => setHoveredSession(session.id)}
                onMouseLeave={() => setHoveredSession(null)}
              >
              <div className="session-content">
                  {/* แยกรหัสวิชาไว้บรรทัดบน */}
                  {subject.code && <div className="session-code">{subject.code}</div>}
                  
                  {/* ชื่อวิชาอยู่บรรทัดถัดมา */}
                  <div className="session-name" title={subject.name}>
                    {subject.name}
                  </div>
                  
                  <div className="session-time">{session.startTime} – {session.endTime}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .grid-wrapper { 
          overflow-x: auto; border-radius: 16px; border: 1px solid var(--border-strong); 
          background: var(--surface); box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); 
          -webkit-overflow-scrolling: touch; 
        }
        
        /* แบ่ง Grid เป็น 600 ช่องตามจำนวนนาทีจริง */
        .grid-container { 
          display: grid; 
          grid-template-columns: 100px repeat(${TOTAL_MINUTES}, 1fr); 
          grid-template-rows: 50px repeat(7, 95px); 
          min-width: 1000px; 
        }
        
        .time-header { 
          display: flex; align-items: center; justify-content: flex-start; 
          padding-left: 8px; background: var(--surface-alt); font-weight: 700; color: var(--text-secondary); 
          border-bottom: 1px solid var(--border-strong); border-right: 1px solid var(--border-strong); font-size: 0.85rem; 
        }
        
        .corner-cell, .day-label { 
          display: flex; align-items: center; justify-content: center; background: var(--surface-alt); 
          font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border-strong); 
          border-right: 1px solid var(--border-strong); font-size: 0.85rem; 
        }
        
        .cell { 
          border-bottom: 1px solid var(--border-strong); border-right: 1px dashed var(--border-grid); 
          transition: background 0.2s; cursor: pointer; position: relative; 
        }
        
        .cell.bg-alt { background: rgba(0, 0, 0, 0.015); }
        :global(.theme-dark) .cell.bg-alt { background: rgba(255, 255, 255, 0.015); }
        
        .cell.empty:hover { background: var(--surface-hover) !important; }
        .cell.empty:hover::after { 
          content: '+ เพิ่ม'; position: absolute; inset: 0; display: flex; align-items: center; 
          justify-content: center; font-size: 0.9rem; color: var(--accent); font-weight: 600; opacity: 0.8; 
        }
        
        /* สไตล์กล่องวิชาเรียน ถูกวางลงใน Grid ระดับนาทีโดยตรง */
        .session-card { 
          position: relative; 
          margin: 4px 1px; /* หดจากเส้นตารางนิดเดียวเพื่อความสวยงาม */
          border-radius: 6px; border: none; 
          cursor: pointer; pointer-events: auto; 
          transition: transform 0.2s, box-shadow 0.2s, filter 0.2s; 
          z-index: 5; overflow: hidden; padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; 
        }
        .session-card:hover { transform: translateY(-2px); filter: brightness(1.1); z-index: 10; }
        .session-content { 
          position: relative; z-index: 2; height: 100%; 
          display: flex; flex-direction: column; gap: 2px; 
        }
        
        .session-code { 
          font-size: 0.72rem; font-weight: 700; opacity: 0.85; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; 
          letter-spacing: 0.03em;
        }
        
        .session-name { 
          font-weight: 800; font-size: 0.9rem; line-height: 1.2; 
          /* บังคับให้อยู่ในกรอบ ถ้าเกิน 2 บรรทัดให้ใส่ ... */
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; 
          overflow: hidden; text-shadow: 0 1px 2px rgba(0,0,0,0.15); 
          word-break: break-word; /* ป้องกันคำยาวทะลุกรอบ */
        }
        
        .session-time { 
          font-size: 0.7rem; font-weight: 600; opacity: 0.95; 
          margin-top: auto; font-family: 'Space Mono', monospace; 
          background: rgba(0,0,0,0.15); padding: 2px 6px; 
          border-radius: 4px; align-self: flex-start; 
          white-space: nowrap; /* ห้ามเวลาขึ้นบรรทัดใหม่ */
        }
      `}</style>
    </div>
  );
}