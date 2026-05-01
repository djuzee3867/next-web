"use client";
import { SUBJECT_COLORS } from '../lib/scheduleStore';

export default function SubjectSidebar({ subjects, onAdd, onDelete }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>รายวิชา</h3>
        <button className="add-btn" onClick={onAdd}>+ เพิ่มวิชา</button>
      </div>

      <div className="subject-list">
        {subjects.length === 0 && <div className="empty">ยังไม่มีรายวิชา</div>}
        
       {subjects.map(sub => {
          const color = sub.color || SUBJECT_COLORS[sub.colorIndex]; // อัปเดตให้รองรับ Custom Color
          return (
            <div 
              key={sub.id} className="subject-card" 
              style={{ borderLeftColor: color.bg }} // ใช้สีพื้นหลังของ Custom
              draggable
              onDragStart={(e) => {
                // ส่งรหัส id ของวิชาผ่านระบบ Drag & Drop
                e.dataTransfer.setData('text/plain', sub.id);
                e.dataTransfer.effectAllowed = 'copyMove';
              }}
              title="ลากเพื่อนำไปใส่ในตาราง"
            >
              <div className="sub-info" style={{ cursor: 'grab' }}>
                <div className="sub-name">
                  <span className="drag-icon">⋮⋮</span> {sub.name}
                </div>
                {sub.code && <div className="sub-code">{sub.code}</div>}
              </div>
              <button className="del-btn" onClick={() => onDelete(sub.id)} title="ลบวิชา">✕</button>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .sidebar { display: flex; flex-direction: column; gap: 16px; }
        .sidebar-header { display: flex; align-items: center; justify-content: space-between; }
        .sidebar-header h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .add-btn { background: var(--accent-subtle); color: var(--accent); border: none; padding: 6px 12px; border-radius: 8px; font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: 0.2s; }
        .add-btn:hover { background: var(--accent); color: #fff; }
        .subject-list { display: flex; flex-direction: column; gap: 10px; }
        .empty { text-align: center; font-size: 0.85rem; color: var(--text-muted); padding: 20px 0; }
        
        .subject-card { 
          display: flex; align-items: center; justify-content: space-between; 
          padding: 12px; background: var(--surface-alt); border-radius: 10px; 
          border-left: 4px solid; transition: transform 0.2s, box-shadow 0.2s; 
        }
        .sub-info { 
          flex: 1; /* ให้ใช้พื้นที่ที่เหลือทั้งหมด */
          min-width: 0; /* สำคัญมาก! ช่วยให้ text-overflow ทำงานได้เมื่ออยู่ร่วมกับ Flexbox */
          cursor: grab;
        }
          .subject-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        
        .drag-icon { font-size: 0.8rem; opacity: 0.4; margin-right: 4px; cursor: grab; flex-shrink: 0; }
        .subject-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .drag-icon { font-size: 0.8rem; opacity: 0.4; margin-right: 4px; cursor: grab; }
        .sub-name { 
          font-weight: 700; font-size: 0.9rem; color: var(--text-primary); 
          display: flex; align-items: center; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; /* ตัดข้อความที่ยาวเกินด้วย ... */
        }
        .sub-code { 
          font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; padding-left: 18px; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; /* ตัดข้อความที่ยาวเกินด้วย ... */
        }        
        .del-btn { 
          flex-shrink: 0; /* บังคับไม่ให้ปุ่มลบหดตัว */
          margin-left: 8px; /* เว้นระยะห่างจากชื่อวิชาหน่อย */
          background: none; border: none; color: var(--text-muted); cursor: pointer; 
          border-radius: 6px; width: 24px; height: 24px; display: flex; 
          align-items: center; justify-content: center; transition: 0.2s; 
        }
        .del-btn:hover { background: #ff475720; color: #ff4757; }
      `}</style>
    </div>
  );
}