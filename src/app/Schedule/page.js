"use client";
import { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import ScheduleGrid from './components/ScheduleGrid';
import SessionDetailModal from './components/SessionDetailModal';
import ClassModal from './components/ClassModal';
import SubjectSidebar from './components/SubjectSidebar';
import { SAMPLE_DATA, DAYS, SUBJECT_COLORS } from './lib/scheduleStore';

const STORAGE_KEY = 'schedule_subjects_v9';

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [theme, setTheme] = useState('dark'); 
  const [activeModal, setActiveModal] = useState(null);
  const [sessionPrefill, setSessionPrefill] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // State สำหรับ Popup แจ้งเตือนและยืนยัน
  const [dialog, setDialog] = useState(null); 
  const captureRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      setSubjects(saved ? JSON.parse(saved) : SAMPLE_DATA);
    } catch { setSubjects(SAMPLE_DATA); }
  }, []);

  useEffect(() => {
    if (isMounted) localStorage.setItem(STORAGE_KEY, JSON.stringify(subjects));
  }, [subjects, isMounted]);

  // ฟังก์ชันแสดง Popup
  const showConfirm = (title, message, onConfirm, isDanger = false) => {
    setDialog({ type: 'confirm', title, message, onConfirm, isDanger });
  };
  const showAlert = (title, message) => {
    setDialog({ type: 'alert', title, message });
  };

  // ฟังก์ชันเช็คเวลาชนกัน
  const checkConflict = (newSessions, excludeSessionId) => {
    if (!newSessions) return null;
    for (const n of newSessions) {
      const nStart = parseInt(n.startTime.replace(':', ''));
      const nEnd = parseInt(n.endTime.replace(':', ''));
      for (const subj of subjects) {
        for (const ex of (subj.sessions || [])) {
          if (ex.id === excludeSessionId) continue; 
          if (ex.day === n.day) {
            const exStart = parseInt(ex.startTime.replace(':', ''));
            const exEnd = parseInt(ex.endTime.replace(':', ''));
            if (nStart < exEnd && nEnd > exStart) return subj.name;
          }
        }
      }
    }
    return null;
  };

  const handleSaveClass = (subjectData, sessionsData, editSessionId = null) => {
    const conflictSubject = checkConflict(sessionsData, editSessionId);
    if (conflictSubject) {
      showAlert('เวลาเรียนชนกัน!', `ไม่สามารถเพิ่มคาบเรียนได้ เนื่องจากเวลาซ้อนกับวิชา "${conflictSubject}"`);
      return; 
    }

    setSubjects(prev => {
      let updatedSubjects = [...prev];
      if (editSessionId) {
        updatedSubjects = updatedSubjects.map(s => ({
          ...s, sessions: s.sessions.filter(se => se.id !== editSessionId)
        }));
      }
      const existingSubjIndex = updatedSubjects.findIndex(s => s.name === subjectData.name);
      if (existingSubjIndex >= 0) {
        updatedSubjects[existingSubjIndex] = {
          ...updatedSubjects[existingSubjIndex], ...subjectData,
          sessions: sessionsData?.length > 0 
            ? [...(updatedSubjects[existingSubjIndex].sessions || []), ...sessionsData]
            : (updatedSubjects[existingSubjIndex].sessions || [])
        };
      } else {
        updatedSubjects.push({ ...subjectData, sessions: sessionsData || [] });
      }
      return updatedSubjects;
    });
    setActiveModal(null);
    setSessionPrefill(null);
  };

  const handleCellDrop = (subjectId, day, startTime, endTime) => {
    const droppedSubj = subjects.find(s => s.id === subjectId);
    if (droppedSubj) {
      setSessionPrefill({ 
        day, startTime, endTime, name: droppedSubj.name, 
        colorIndex: droppedSubj.colorIndex, color: droppedSubj.color 
      });
      setActiveModal('class');
    }
  };

  const handleDeleteSession = (subjectId, sessionId) => {
    showConfirm('ลบคาบเรียน?', 'คุณแน่ใจหรือไม่ที่จะลบคาบเรียนนี้ออก?', () => {
      setSubjects(prev => prev.map(s => {
        if (s.id === subjectId) return { ...s, sessions: s.sessions.filter(se => se.id !== sessionId) };
        return s;
      }));
      setViewingSession(null);
      setDialog(null);
    }, true);
  };

  const handleDeleteSubject = (subjectId) => {
    showConfirm('ลบวิชาเรียน?', 'คุณต้องการลบวิชานี้และคาบเรียนทั้งหมดที่เกี่ยวข้องใช่หรือไม่?', () => {
      setSubjects(prev => prev.filter(s => s.id !== subjectId));
      setDialog(null);
    }, true);
  };

  const handleClearAll = () => {
    showConfirm('ล้างตารางทั้งหมด?', 'ข้อมูลทั้งหมดจะถูกลบและไม่สามารถกู้คืนได้', () => {
      setSubjects([]);
      setDialog(null);
    }, true);
  };

const handleExportImage = async () => {
    if (!captureRef.current) return;
    try {
      // 1. เพิ่ม Class ไปที่ Body เพื่อปลดล็อกให้ตารางกางออกเต็ม 100%
      document.body.classList.add('export-mode');
      
      // 2. รอให้ Browser ประมวลผล Layout ใหม่แป๊บนึง (สำคัญมาก)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 3. เริ่ม Capture รูปภาพ
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: theme === 'dark' ? '#0b0f19' : '#f8fafc',
        scale: 2, // เพิ่มความละเอียดภาพ
        windowWidth: captureRef.current.scrollWidth, // บังคับให้อ่านความกว้างที่แท้จริง
        ignoreElements: (el) => el.getAttribute('data-html2canvas-ignore') === 'true'
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Schedule_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      showAlert('ข้อผิดพลาด', 'ไม่สามารถบันทึกรูปภาพได้ในขณะนี้');
    } finally {
      // 4. เอา Class ออก เพื่อให้หน้าเว็บกลับมามี Scroll เลื่อนได้ตามปกติ
      document.body.classList.remove('export-mode');
    }
  };

  let totalMinutes = 0;
  let allSessions = [];
  subjects.forEach(subj => {
    (subj.sessions || []).forEach(sess => {
      if (sess.startTime && sess.endTime) {
        const [sh, sm] = sess.startTime.split(':').map(Number);
        const [eh, em] = sess.endTime.split(':').map(Number);
        totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
        allSessions.push({ subject: subj, session: sess });
      }
    });
  });

  const totalHoursStr = (totalMinutes / 60).toFixed(1);
  const sessionsByDay = DAYS.map((dayName, index) => {
    const daySessions = allSessions.filter(s => s.session.day === index);
    daySessions.sort((a, b) => a.session.startTime.localeCompare(b.session.startTime));
    return { dayName, index, sessions: daySessions };
  }).filter(d => d.sessions.length > 0);

  if (!isMounted) return null;

  return (
    <div className={`schedule-wrapper theme-${theme}`} ref={captureRef}>
      <div className="app">
        <header className="header">
          <div className="logo">
            <div><h1>Class Schedule Planner</h1></div>
          </div>
          <div className="header-right" data-html2canvas-ignore="true">
            <div className="action-buttons">
              <button className="btn-add-mobile" onClick={() => { setSessionPrefill(null); setActiveModal('class'); }}>+ Add</button>
              <a href='/' style={{ textDecoration: 'none' }} >    <button className="btn-print" > <span>Home</span></button></a>
              <button className="btn-print" onClick={handleExportImage} title="บันทึกเป็นรูปภาพ"> <span >Save</span></button>
              <button className="btn-clear" onClick={handleClearAll} title="ล้างตาราง">🗑️ <span className="hide-mobile">Clear</span></button>
              <button className="theme-btn" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        <div className="main-layout">
          <aside className="sidebar-panel" data-html2canvas-ignore="true">
            <SubjectSidebar subjects={subjects} onAdd={() => { setSessionPrefill(null); setActiveModal('class'); }} onDelete={handleDeleteSubject} />
          </aside>

          <main className="content">
            <ScheduleGrid 
              subjects={subjects} 
              onCellClick={(day, startTime, endTime) => { setSessionPrefill({ day, startTime, endTime }); setActiveModal('class'); }} 
              onCellDrop={handleCellDrop} 
              onSessionClick={(subj, sess) => setViewingSession({ subject: subj, session: sess })} 
            />
            
            {allSessions.length > 0 && (
              <div className="summary-section">
                <div className="summary-header">
                  <div className="summary-title"><span className="summary-icon"></span> สรุปวิชาเรียนทั้งหมด</div>
                  <div className="summary-badges">
                    <span className="badge badge-gray">ทั้งหมด: {subjects.length} วิชา</span>
                    <span className="badge badge-purple">เวลารวม: {totalHoursStr} ชม./สัปดาห์</span>
                  </div>
                </div>
                <div className="summary-grid">
                  {sessionsByDay.map(dayGroup => (
                    <div key={dayGroup.index} className="day-card">
                      <h4 className="day-title"><span className="day-dot"></span> {dayGroup.dayName}</h4>
                      <div className="day-sessions">
                        {dayGroup.sessions.map(({ subject, session }) => {
                          const color = subject.color || SUBJECT_COLORS[subject.colorIndex];
                          return (
                            <div key={session.id} className="session-row">
                              <div className="row-left">
                                <div className="row-color-bar" style={{ background: color.bg }}></div>
                                <div className="row-info">
                                  <div className="row-subj-name">{subject.name}</div>
                                  <div className="row-subj-meta">{session.startTime} - {session.endTime} {subject.code ? `• ${subject.code}` : ''}</div>
                                </div>
                              </div>
                              <button className="row-del-btn" data-html2canvas-ignore="true" onClick={() => handleDeleteSession(subject.id, session.id)}>ลบ</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {activeModal === 'class' && (
        <ClassModal subjects={subjects} prefill={sessionPrefill} onSave={handleSaveClass} onClose={() => { setActiveModal(null); setSessionPrefill(null); }} />
      )}

      {viewingSession && (
        <SessionDetailModal
          subject={viewingSession.subject} session={viewingSession.session}
          onDelete={handleDeleteSession} 
          onEdit={(subj, sess) => {
             setViewingSession(null);
             setSessionPrefill({
               isEdit: true, sessionId: sess.id, subjectId: subj.id,
               code: subj.code, name: subj.name, colorIndex: subj.colorIndex, color: subj.color,
               day: sess.day, days: [sess.day], startTime: sess.startTime, endTime: sess.endTime
             });
             setActiveModal('class');
          }}
          onClose={() => setViewingSession(null)}
        />
      )}

      {/* --- Popup แจ้งเตือน และ ยืนยัน กลางจอ --- */}
      {dialog && (
        <div className="custom-dialog-overlay" onClick={() => setDialog(null)}>
          <div className="custom-dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon">{dialog.type === 'alert' ? '⚠️' : '❓'}</div>
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="custom-dialog-actions">
              {dialog.type === 'confirm' && (
                <button className="btn-dialog-cancel" onClick={() => setDialog(null)}>ยกเลิก</button>
              )}
              <button 
                className={dialog.isDanger ? "btn-dialog-danger" : "btn-dialog-confirm"} 
                onClick={() => { if(dialog.onConfirm) dialog.onConfirm(); else setDialog(null); }}
              >
                ตกลง
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .schedule-wrapper { font-family: 'Sarabun', sans-serif; min-height: 100vh; --bg: #0b0f19; --surface: #151b2b; --surface-alt: #1e2638; --surface-hover: #263045; --border: #ffffff1a; --border-grid: #ffffff0d; --border-strong: #ffffff26; --text-primary: #f8fafc; --text-secondary: #94a3b8; --text-muted: #64748b; --accent: #6366f1; --accent-subtle: #6366f120; --input-bg: #0f1423; background: var(--bg); color: var(--text-primary); transition: background 0.3s, color 0.3s; }
        .schedule-wrapper.theme-light { --bg: #f8fafc; --surface: #ffffff; --surface-alt: #f1f5f9; --surface-hover: #e2e8f0; --border: #e2e8f0; --border-grid: #cbd5e166; --border-strong: #cbd5e1; --text-primary: #0f172a; --text-secondary: #475569; --text-muted: #94a3b8; --accent: #4f46e5; --accent-subtle: #4f46e515; --input-bg: #f8fafc; }
        .app { min-height: 100vh; display: flex; flex-direction: column; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { font-size: 1.8rem; }
        .logo h1 { font-size: 1.3rem; font-weight: 800; color: var(--text-primary); margin: 0; }
        .header-right { display: flex; align-items: center; gap: 24px; }
        .action-buttons { display: flex; align-items: center; gap: 10px; }
        .btn-print, .btn-clear { padding: 8px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: none; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
        .btn-print { background: var(--surface-alt); color: var(--text-primary); border: 1px solid var(--border); }
        .btn-print:hover { background: var(--surface-hover); }
        .btn-clear { background: #ff475715; color: #ff4757; }
        .btn-clear:hover { background: #ff4757; color: #fff; }
        .theme-btn { width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface-alt); cursor: pointer; font-size: 1.1rem; transition: transform 0.2s; }
        .theme-btn:hover { transform: scale(1.1); }
        .btn-add-mobile { display: none; background: var(--accent); color: #fff; padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; border: none; cursor: pointer; }
        
        .main-layout { display: grid; grid-template-columns: 260px 1fr; flex: 1; overflow: hidden; }
        .sidebar-panel { background: var(--surface); border-right: 1px solid var(--border); padding: 24px 16px; overflow-y: auto; }
        .content { padding: 24px; overflow: auto; display: flex; flex-direction: column; gap: 32px; }
        .summary-section { background: var(--surface); border-radius: 16px; border: 1px solid var(--border-strong); padding: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02); }
        .summary-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
        .summary-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 8px; }
        .summary-icon { font-size: 1.4rem; }
        .summary-badges { display: flex; gap: 10px; }
        .badge { padding: 6px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; }
        .badge-gray { background: var(--surface-alt); color: var(--text-secondary); }
        .badge-purple { background: rgba(99, 102, 241, 0.1); color: #4f46e5; }
        :global(.theme-dark) .badge-purple { background: rgba(99, 102, 241, 0.2); color: #818cf8; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .day-card { background: var(--surface-alt); border-radius: 12px; padding: 16px; border: 1px solid var(--border); }
        .day-title { font-size: 1rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .day-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); }
        .day-sessions { display: flex; flex-direction: column; gap: 8px; }
        .session-row { display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--border); }
        .row-left { display: flex; gap: 12px; align-items: center; }
        .row-color-bar { width: 4px; height: 32px; border-radius: 4px; }
        .row-subj-name { font-weight: 700; font-size: 0.95rem; color: var(--text-primary); }
        .row-subj-meta { font-size: 0.75rem; color: var(--text-muted); font-family: 'Space Mono', monospace; margin-top: 2px; }
        .row-del-btn { background: none; border: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .row-del-btn:hover { color: #ff4757; }

        /* --- สไตล์ของ Custom Popup --- */
        .custom-dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .custom-dialog { background: var(--surface); border-radius: 16px; padding: 32px; width: 100%; max-width: 380px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid var(--border); text-align: center; animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .dialog-icon { font-size: 3rem; margin-bottom: 16px; }
        .custom-dialog h3 { font-size: 1.3rem; color: var(--text-primary); margin-bottom: 12px; font-weight: 800; }
        .custom-dialog p { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 28px; line-height: 1.5; }
        .custom-dialog-actions { display: flex; gap: 12px; justify-content: center; }
        .custom-dialog-actions button { padding: 12px 20px; border-radius: 12px; font-weight: 700; cursor: pointer; border: none; flex: 1; font-size: 0.95rem; transition: 0.2s; }
        .btn-dialog-cancel { background: var(--surface-alt); color: var(--text-secondary); }
        .btn-dialog-cancel:hover { background: var(--surface-hover); color: var(--text-primary); }
        .btn-dialog-confirm { background: var(--accent); color: #fff; }
        .btn-dialog-confirm:hover { filter: brightness(1.1); transform: translateY(-2px); }
        .btn-dialog-danger { background: #ff4757; color: #fff; }
        .btn-dialog-danger:hover { background: #ff3742; transform: translateY(-2px); }

        @media (max-width: 1024px) { .main-layout { grid-template-columns: 1fr; } .sidebar-panel { display: none; } .btn-add-mobile { display: block; } }
        @media (max-width: 768px) { .header { padding: 12px 16px; flex-wrap: wrap; gap: 12px; } .logo h1 { font-size: 1.1rem; } .hide-mobile { display: none; } .content { padding: 16px; gap: 24px; } .summary-header { flex-direction: column; align-items: flex-start; gap: 12px; } .summary-badges { flex-wrap: wrap; } .summary-grid { grid-template-columns: 1fr; } }
        :global(body.export-mode) { overflow-x: auto; }
        :global(body.export-mode .schedule-wrapper) { 
          width: max-content !important; 
          min-width: 100% !important; 
        }
        :global(body.export-mode .header) { 
          position: relative !important; /* ปลด Header ไม่ให้เกาะติดขอบจอ */
        }
        :global(body.export-mode .main-layout) { 
          display: block !important; /* ยกเลิก Grid ของ Sidebar */
          overflow: visible !important; 
        }
        :global(body.export-mode .content) { 
          overflow: visible !important; 
        }
        :global(body.export-mode .grid-wrapper) { 
          overflow: visible !important; /* ปลด Scroll ตารางแนวนอน */
        }
        
        /* ซ่อนส่วนที่ไม่ต้องการให้อยู่ในรูปภาพ */
        :global(body.export-mode .sidebar-panel),
        :global(body.export-mode .action-buttons),
        :global(body.export-mode .row-del-btn) { 
          display: none !important; 
        }
      
      
      `}</style>
    </div>
  );
}