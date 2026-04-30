"use client";
import { useState, useEffect } from 'react';
import { DAYS, SUBJECT_COLORS, generateId } from '../lib/scheduleStore';

export default function ClassModal({ subjects, onSave, onClose, prefill }) {
  const [form, setForm] = useState({
    name: '', colorIndex: 0,
    day: prefill?.day ?? 0,
    startTime: prefill?.startTime || '08:00',
    endTime: prefill?.endTime || '09:00',
  });

  useEffect(() => {
    const existing = subjects.find(s => s.name === form.name);
    if (existing) {
      setForm(prev => ({ ...prev, colorIndex: existing.colorIndex }));
    }
  }, [form.name, subjects]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (form.startTime >= form.endTime) { alert('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น'); return; }

    const subjectData = {
      id: subjects.find(s => s.name === form.name)?.id || generateId(),
      name: form.name.trim(),
      colorIndex: form.colorIndex,
    };
    const sessionData = {
      id: generateId(),
      day: Number(form.day),
      startTime: form.startTime,
      endTime: form.endTime,
    };
    onSave(subjectData, sessionData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>เพิ่มวิชาเรียน</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ชื่อวิชา * (พิมพ์ชื่อเดิมเพื่อดึงสีเก่า)</label>
            <input
              list="subject-names" type="text" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="" required
            />
            <datalist id="subject-names">{subjects.map(s => <option key={s.id} value={s.name} />)}</datalist>
          </div>

          <div className="form-group">
            <label>สี</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map((color, i) => (
                <button
                  key={i} type="button" className={`color-dot ${form.colorIndex === i ? 'selected' : ''}`}
                  style={{ background: color.bg }} onClick={() => setForm({ ...form, colorIndex: i })}
                />
              ))}
            </div>
          </div>

          <hr className="divider" />

          <div className="form-row">
            <div className="form-group">
              <label>วัน</label>
              <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}>
                {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>เวลาเริ่มต้น</label>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>เวลาสิ้นสุด</label>
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} required />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ background: SUBJECT_COLORS[form.colorIndex].bg }}>เพิ่มลงตาราง</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 15, 35, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; width: 100%; max-width: 440px; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: slideUp 0.25s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }
        .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
        .form-group { margin-bottom: 16px; width: 100%; }
        .form-row { display: flex; gap: 16px; }
        @media (max-width: 600px) {
          .modal { padding: 24px 20px; }
          .form-row { flex-direction: column; gap: 16px; } /* ให้ฟอร์มเรียงซ้อนกันบนมือถือ */
          .modal-actions { flex-direction: column-reverse; } /* ปุ่มบันทึกอยู่บน ปุ่มยกเลิกอยู่ล่าง */
          .btn-primary, .btn-secondary { width: 100%; text-align: center; }
        }
        label { display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
        input, select { width: 100%; padding: 12px 16px; background: var(--input-bg); border: 1.5px solid var(--border); border-radius: 12px; color: var(--text-primary); font-size: 0.95rem; font-family: inherit; box-sizing: border-box; outline: none; transition: 0.2s; }
        input:focus, select:focus { border-color: var(--accent); }
        .divider { border: 0; border-top: 1px solid var(--border); margin: 24px 0; }
        .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-dot { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: 0.2s; }
        .color-dot.selected { transform: scale(1.15); box-shadow: 0 0 0 2px var(--surface); border-color: var(--text-primary); }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        .btn-primary, .btn-secondary { padding: 11px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; }
        .btn-primary { color: #fff; }
        .btn-secondary { background: var(--surface-alt); color: var(--text-secondary); }
      `}</style>
    </div>
  );
}