"use client";
import { useState, useEffect } from 'react';
import { DAYS, DAYS_SHORT, SUBJECT_COLORS, generateId, getContrastYIQ } from '../lib/scheduleStore';

const parseTime = (input) => {
  if (!input) return '08:00';
  let str = input.replace(/\D/g, ''); 
  if (str === '') return '08:00';
  if (str.length === 1) str = `0${str}00`;       
  else if (str.length === 2) str = `${str}00`;   
  else if (str.length === 3) str = `0${str}`;    
  else if (str.length > 4) str = str.substring(0, 4);

  let h = parseInt(str.substring(0, 2), 10);
  let m = parseInt(str.substring(2, 4), 10);
  if (h < 8) h = 8;
  if (h > 18) { h = 18; m = 0; }
  if (h === 18 && m > 0) m = 0; 
  if (m > 59) m = 59;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function ClassModal({ subjects, onSave, onClose, prefill }) {
  const [form, setForm] = useState({
    code: prefill?.code || '', 
    name: prefill?.name || '', 
    colorMode: prefill?.color ? 'custom' : 'preset',
    colorIndex: prefill?.colorIndex ?? 0,
    customColor: prefill?.color?.bg || '#6366f1',
    days: prefill?.days || (prefill?.day !== undefined ? [prefill.day] : [0]),
    startTime: prefill?.startTime || '08:00',
    endTime: prefill?.endTime || '09:00',
  });
  
  const [hasSession, setHasSession] = useState(!!prefill?.startTime || !!prefill?.isEdit);

  useEffect(() => {
    if (prefill?.isEdit) return; 
    const existing = subjects.find(s => s.name === form.name);
    if (existing) {
      setForm(prev => ({ 
        ...prev, code: existing.code || '', 
        colorMode: existing.color ? 'custom' : 'preset',
        colorIndex: existing.colorIndex ?? 0,
        customColor: existing.color?.bg || '#6366f1'
      }));
    }
  }, [form.name, subjects, prefill]);

  const handleTimeBlur = (field) => { setForm(prev => ({ ...prev, [field]: parseTime(prev[field]) })); };
  const toggleDay = (dayIndex) => {
    setForm(prev => {
      const newDays = prev.days.includes(dayIndex) ? prev.days.filter(d => d !== dayIndex) : [...prev.days, dayIndex].sort((a,b) => a-b);
      return { ...prev, days: newDays };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const finalStart = parseTime(form.startTime);
    const finalEnd = parseTime(form.endTime);

    if (hasSession) {
      if (form.days.length === 0) { alert('กรุณาเลือกวันอย่างน้อย 1 วัน'); return; }
      const startMins = parseInt(finalStart.split(':')[0]) * 60 + parseInt(finalStart.split(':')[1]);
      const endMins = parseInt(finalEnd.split(':')[0]) * 60 + parseInt(finalEnd.split(':')[1]);
      if (startMins < 8 * 60 || endMins > 18 * 60) { alert('เวลาเรียนต้องอยู่ระหว่าง 08:00 ถึง 18:00 น.'); return; }
      if (startMins >= endMins) { alert('เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น'); return; }
    }

    const subjectData = {
      id: subjects.find(s => s.name === form.name)?.id || generateId(),
      code: form.code.trim(),
      name: form.name.trim(),
      colorIndex: form.colorMode === 'preset' ? form.colorIndex : null,
      color: form.colorMode === 'custom' ? { bg: form.customColor, text: getContrastYIQ(form.customColor) } : null,
    };

    const sessionsData = hasSession ? form.days.map(d => ({
      id: generateId(), day: Number(d), startTime: finalStart, endTime: finalEnd,
    })) : null;

    onSave(subjectData, sessionsData, prefill?.isEdit ? prefill.sessionId : null);
  };

  const currentColorObj = form.colorMode === 'custom' ? { bg: form.customColor } : SUBJECT_COLORS[form.colorIndex];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{prefill?.isEdit ? 'แก้ไขคาบเรียน' : (prefill ? 'เพิ่มคาบเรียน' : 'เพิ่มรายวิชา')}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>รหัสวิชา</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="01000001" />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>ชื่อวิชา *</label>
              <input list="subject-names" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Calculus 9" required />
              <datalist id="subject-names">{subjects.map(s => <option key={s.id} value={s.name} />)}</datalist>
            </div>
          </div>

          <div className="form-group">
            <label>สี (สามารถเลือกสีเองได้)</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map((color, i) => (
                <button 
                  key={i} type="button" 
                  className={`color-dot ${form.colorMode === 'preset' && form.colorIndex === i ? 'selected' : ''}`} 
                  style={{ background: color.bg }} 
                  onClick={() => setForm({ ...form, colorMode: 'preset', colorIndex: i })} 
                />
              ))}
              
              {/* ปุ่มเลือกสีเอง (Custom Color Picker) */}
              <label 
                className={`color-dot custom-color-btn ${form.colorMode === 'custom' ? 'selected' : ''}`} 
                style={{ background: form.colorMode === 'custom' ? form.customColor : 'var(--surface-alt)' }}
                title="เลือกสีเอง"
              >
                {form.colorMode !== 'custom' && <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>+</span>}
                <input 
                  type="color" value={form.customColor} 
                  onChange={e => setForm({...form, colorMode: 'custom', customColor: e.target.value})} 
                  style={{ opacity: 0, position: 'absolute', cursor: 'pointer', width: '100%', height: '100%' }}
                />
              </label>
            </div>
          </div>

          <hr className="divider" />

          <div className="form-group checkbox-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
              <input type="checkbox" checked={hasSession} onChange={e => setHasSession(e.target.checked)} style={{ width: 'auto' }} />
              ระบุเวลาเรียน
            </label>
          </div>

          {hasSession && (
            <div className="time-section">
              <div className="form-group">
                <label>เลือกวัน (เลือกได้มากกว่า 1 วัน)</label>
                <div className="days-selector">
                  {DAYS.map((d, i) => (
                    <div key={i} className={`day-btn ${form.days.includes(i) ? 'active' : ''}`} onClick={() => toggleDay(i)}>
                      {DAYS_SHORT[i]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>เวลาเริ่มต้น</label>
                  <input type="text" placeholder="เช่น 800 หรือ 08:30" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} onBlur={() => handleTimeBlur('startTime')} required />
                </div>
                <div className="form-group">
                  <label>เวลาสิ้นสุด</label>
                  <input type="text" placeholder="เช่น 1000 หรือ 10:30" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} onBlur={() => handleTimeBlur('endTime')} required />
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" style={{ background: currentColorObj.bg, color: currentColorObj.text || '#fff' }}>บันทึกข้อมูล</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 15, 35, 0.75); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; }
        .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 32px; width: 100%; max-width: 480px; box-shadow: 0 24px 60px rgba(0,0,0,0.4); animation: slideUp 0.25s ease; max-height: 90vh; overflow-y: auto; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .modal-header h2 { font-size: 1.3rem; font-weight: 700; color: var(--text-primary); }
        .close-btn { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
        .form-group { margin-bottom: 16px; width: 100%; }
        .form-row { display: flex; gap: 12px; }
        label { display: block; margin-bottom: 8px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
        input[type="text"], input[type="time"], select { width: 100%; padding: 12px 16px; background: var(--input-bg); border: 1.5px solid var(--border); border-radius: 12px; color: var(--text-primary); font-size: 0.95rem; font-family: 'Space Mono', 'Sarabun', sans-serif; box-sizing: border-box; outline: none; transition: 0.2s; }
        input:focus, select:focus { border-color: var(--accent); }
        .divider { border: 0; border-top: 1px solid var(--border); margin: 20px 0; }
        .checkbox-group { background: var(--surface-alt); padding: 12px 16px; border-radius: 12px; margin-bottom: 16px; }
        
        .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-dot { width: 32px; height: 32px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: 0.2s; }
        .color-dot.selected { transform: scale(1.15); box-shadow: 0 0 0 2px var(--surface); border-color: var(--text-primary); }
        .custom-color-btn { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        
        .days-selector { display: flex; gap: 8px; flex-wrap: wrap; }
        .day-btn { padding: 8px 14px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface-alt); cursor: pointer; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); transition: 0.2s; }
        .day-btn:hover { border-color: var(--text-muted); }
        .day-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .time-section { animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
        .btn-primary, .btn-secondary { padding: 11px 24px; border-radius: 12px; font-weight: 600; cursor: pointer; border: none; }
        .btn-secondary { background: var(--surface-alt); color: var(--text-secondary); }
        
        @media (max-width: 600px) { .modal { padding: 24px 20px; } .form-row { flex-direction: column; gap: 16px; } .modal-actions { flex-direction: column-reverse; } .btn-primary, .btn-secondary { width: 100%; text-align: center; } }
      `}</style>
    </div>
  );
}