"use client";

import { useState, useEffect } from 'react';
import { SUBJECT_COLORS, generateId } from '../lib/scheduleStore';

export default function SubjectModal({ subject, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    teacher: '',
    room: '',
    colorIndex: 0,
  });

  useEffect(() => {
    if (subject) {
      setForm({
        name: subject.name || '',
        teacher: subject.teacher || '',
        room: subject.room || '',
        colorIndex: subject.colorIndex ?? 0,
      });
    }
  }, [subject]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...subject,
      id: subject?.id || generateId(),
      ...form,
      sessions: subject?.sessions || [],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{subject?.id ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ชื่อวิชา *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="เช่น คณิตศาสตร์"
              required
            />
          </div>

          <div className="form-group">
            <label>อาจารย์ผู้สอน</label>
            <input
              type="text"
              value={form.teacher}
              onChange={e => setForm({ ...form, teacher: e.target.value })}
              placeholder="เช่น อ.สมชาย"
            />
          </div>

          <div className="form-group">
            <label>ห้องเรียน</label>
            <input
              type="text"
              value={form.room}
              onChange={e => setForm({ ...form, room: e.target.value })}
              placeholder="เช่น 301"
            />
          </div>

          <div className="form-group">
            <label>สี</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map((color, i) => (
                <button
                  key={i}
                  type="button"
                  className={`color-dot ${form.colorIndex === i ? 'selected' : ''}`}
                  style={{ background: color.bg }}
                  onClick={() => setForm({ ...form, colorIndex: i })}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary">
              {subject?.id ? 'บันทึก' : 'เพิ่มวิชา'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15, 15, 35, 0.7);
          backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; padding: 20px;
        }
        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px;
          width: 100%; max-width: 440px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
          animation: slideUp 0.25s ease;
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 28px;
        }
        .modal-header h2 {
          font-size: 1.3rem; font-weight: 700;
          color: var(--text-primary);
          font-family: 'Sarabun', sans-serif;
        }
        .close-btn {
          background: none; border: none;
          color: var(--text-muted); font-size: 1.2rem;
          cursor: pointer; padding: 4px 8px;
          border-radius: 8px; transition: all 0.2s;
        }
        .close-btn:hover { background: var(--hover); color: var(--text-primary); }
        .form-group { margin-bottom: 20px; }
        .form-group label {
          display: block; margin-bottom: 8px;
          font-size: 0.85rem; font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase; letter-spacing: 0.05em;
        }
        .form-group input {
          width: 100%; padding: 12px 16px;
          background: var(--input-bg);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.95rem;
          font-family: 'Sarabun', sans-serif;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .form-group input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-dot {
          width: 32px; height: 32px; border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer; transition: all 0.2s;
        }
        .color-dot:hover { transform: scale(1.2); }
        .color-dot.selected {
          border-color: var(--text-primary);
          transform: scale(1.2);
          box-shadow: 0 0 0 2px var(--surface);
        }
        .modal-actions {
          display: flex; gap: 12px; justify-content: flex-end;
          margin-top: 28px;
        }
        .btn-primary, .btn-secondary {
          padding: 11px 24px; border-radius: 12px;
          font-size: 0.9rem; font-weight: 600;
          cursor: pointer; border: none;
          font-family: 'Sarabun', sans-serif;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--accent);
          color: #fff;
        }
        .btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .btn-secondary {
          background: var(--hover);
          color: var(--text-secondary);
        }
        .btn-secondary:hover { color: var(--text-primary); }
      `}</style>
    </div>
  );
}
