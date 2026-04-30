"use client";
import { SUBJECT_COLORS, DAYS } from '../lib/scheduleStore';

export default function SessionDetailModal({ subject, session, onDelete, onEdit, onClose }) {
  const color = subject.color || SUBJECT_COLORS[subject.colorIndex];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-color-bar" style={{ background: color.bg }} />

        <div className="modal-body">
          {/* Badge แสดงสีให้สอดคล้องกับตัวหนังสือที่คำนวณมา */}
          <div className="subject-badge" style={{ background: color.bg, color: color.text || '#fff' }}>
            {subject.code ? `${subject.code} - ` : ''}{subject.name}
          </div>

          <h2>{subject.name}</h2>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">วัน</span>
              <span className="info-value">{DAYS[session.day]}</span>
            </div>
            <div className="info-item">
              <span className="info-label">เวลา</span>
              <span className="info-value">{session.startTime} – {session.endTime} น.</span>
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>ปิด</button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-edit" onClick={() => onEdit(subject, session)}>แก้ไข</button>
              <button className="btn-danger" onClick={() => { onDelete(subject.id, session.id); onClose(); }}>ลบคาบนี้</button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 15, 35, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; width: 100%; max-width: 380px; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-color-bar { height: 6px; }
        .modal-body { padding: 28px 28px 24px; }
        .subject-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; margin-bottom: 12px; }
        h2 { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin-bottom: 20px; }
        .info-grid { display: flex; flex-direction: column; gap: 12px; }
        .info-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: var(--surface-alt); border-radius: 10px; }
        .info-label { font-size: 0.82rem; color: var(--text-muted); min-width: 70px; }
        .info-value { font-size: 0.92rem; font-weight: 600; color: var(--text-primary); }
        .modal-actions { display: flex; gap: 10px; justify-content: space-between; margin-top: 24px; width: 100%; }
        .btn-secondary, .btn-danger, .btn-edit { padding: 10px 18px; border-radius: 10px; font-size: 0.88rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; }
        .btn-secondary { background: var(--surface-alt); color: var(--text-secondary); }
        .btn-edit { background: var(--accent-subtle); color: var(--accent); }
        .btn-edit:hover { background: var(--accent); color: #fff; }
        .btn-danger { background: #ff475715; color: #ff4757; }
        .btn-danger:hover { background: #ff4757; color: #fff; }
      `}</style>
    </div>
  );
}