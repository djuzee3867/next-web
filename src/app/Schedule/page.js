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
      document.body.classList.add('export-mode');

      // ใช้ JS ล็อกความกว้าง 1440px ป้องกัน Layout พังตอนหน้าจอเล็ก
      const target = captureRef.current;
      const originalWidth = target.style.width;
      target.style.width = '1440px';

      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(target, {
        backgroundColor: theme === 'dark' ? '#0b0f19' : '#f8fafc',
        scale: 2, 
        useCORS: true, // สำคัญ: ช่วยแก้ Error แครชเวลาประมวลผล
        windowWidth: 1440, // บอกให้ html2canvas รู้ว่าหน้าจอกว้าง 1440px
        ignoreElements: (el) => el.getAttribute('data-html2canvas-ignore') === 'true'
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Class_Schedule_${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();

      target.style.width = originalWidth; // คืนค่าความกว้างเดิม

    } catch (err) {
      console.error(err);
      showAlert('Error', 'Failed to export image.');
    } finally {
      document.body.classList.remove('export-mode');
      document.body.classList.remove('hide-empty-title'); 
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
        .schedule-wrapper { 
          font-family: 'Inter', 'Outfit', 'Sarabun', sans-serif; 
          min-height: 100vh; 
          --bg-grad: radial-gradient(circle at top center, #1e1b4b 0%, #0f172a 40%, #020617 100%);
          --bg: #020617;
          --surface: rgba(30, 41, 59, 0.5); 
          --surface-alt: rgba(51, 65, 85, 0.4); 
          --surface-hover: rgba(71, 85, 105, 0.6); 
          --border: rgba(255, 255, 255, 0.08); 
          --border-grid: rgba(255, 255, 255, 0.03); 
          --border-strong: rgba(255, 255, 255, 0.15); 
          --text-primary: #f8fafc; 
          --text-secondary: #cbd5e1; 
          --text-muted: #94a3b8; 
          --accent: #818cf8; 
          --accent-subtle: rgba(129, 140, 248, 0.15); 
          --accent-glow: 0 0 20px rgba(129, 140, 248, 0.4);
          --input-bg: rgba(15, 23, 42, 0.6); 
          background: var(--bg-grad); 
          background-color: var(--bg);
          color: var(--text-primary); 
          transition: background 0.3s, color 0.3s; 
        }
        .schedule-wrapper.theme-light { 
          --bg-grad: radial-gradient(circle at top center, #f1f5f9 0%, #e2e8f0 100%);
          --bg: #f8fafc;
          --surface: rgba(255, 255, 255, 0.7); 
          --surface-alt: rgba(241, 245, 249, 0.7); 
          --surface-hover: rgba(226, 232, 240, 0.8); 
          --border: rgba(15, 23, 42, 0.1); 
          --border-grid: rgba(15, 23, 42, 0.05); 
          --border-strong: rgba(15, 23, 42, 0.2); 
          --text-primary: #0f172a; 
          --text-secondary: #334155; 
          --text-muted: #64748b; 
          --accent: #4f46e5; 
          --accent-subtle: rgba(79, 70, 229, 0.1); 
          --accent-glow: 0 0 15px rgba(79, 70, 229, 0.3);
          --input-bg: rgba(255, 255, 255, 0.9); 
        }
        .app { min-height: 100vh; display: flex; flex-direction: column; }
        .header { display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); }
        .logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { font-size: 1.8rem; }
        .logo h1 { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.5px; background: linear-gradient(90deg, #fff, #cbd5e1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        :global(.theme-light) .logo h1 { background: linear-gradient(90deg, #0f172a, #334155); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header-right { display: flex; align-items: center; gap: 24px; }
        .action-buttons { display: flex; align-items: center; gap: 12px; }
        .btn-print, .btn-clear { padding: 10px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; align-items: center; gap: 8px; backdrop-filter: blur(8px); }
        .btn-print { background: var(--surface-alt); color: var(--text-primary); }
        .btn-print:hover { background: var(--surface-hover); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-color: var(--border-strong); }
        .btn-clear { background: rgba(255, 71, 87, 0.1); color: #ff4757; border-color: rgba(255, 71, 87, 0.2); }
        .btn-clear:hover { background: #ff4757; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3); }
        .theme-btn { width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface-alt); cursor: pointer; font-size: 1.2rem; transition: all 0.3s; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); }
        .theme-btn:hover { transform: scale(1.05); background: var(--surface-hover); }
        .btn-add-mobile { display: none; background: var(--accent); color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; border: none; cursor: pointer; box-shadow: var(--accent-glow); transition: all 0.3s; }
        .btn-add-mobile:hover { transform: translateY(-2px); filter: brightness(1.1); }
        
        .main-layout { display: grid; grid-template-columns: 280px 1fr; flex: 1; overflow: hidden; }
        .sidebar-panel { background: var(--surface); border-right: 1px solid var(--border); padding: 28px 20px; overflow-y: auto; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .content { padding: 32px; overflow: auto; display: flex; flex-direction: column; gap: 40px; }
        .summary-section { background: var(--surface); border-radius: 20px; border: 1px solid var(--border); padding: 28px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .summary-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
        .summary-title { font-size: 1.35rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; letter-spacing: -0.3px; }
        .summary-icon { font-size: 1.5rem; }
        .summary-badges { display: flex; gap: 12px; }
        .badge { padding: 8px 16px; border-radius: 10px; font-size: 0.85rem; font-weight: 700; backdrop-filter: blur(8px); border: 1px solid var(--border); }
        .badge-gray { background: var(--surface-alt); color: var(--text-primary); }
        .badge-purple { background: var(--accent-subtle); color: var(--accent); border-color: rgba(129, 140, 248, 0.3); }
        
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .day-card { background: var(--surface-alt); border-radius: 16px; padding: 20px; border: 1px solid var(--border); transition: transform 0.3s, box-shadow 0.3s; }
        .day-card:hover { transform: translateY(-4px); box-shadow: 0 10px 25px rgba(0,0,0,0.15); border-color: var(--border-strong); }
        .day-title { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
        .day-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--accent); box-shadow: var(--accent-glow); }
        .day-sessions { display: flex; flex-direction: column; gap: 12px; }
        .session-row { display: flex; justify-content: space-between; align-items: center; background: var(--surface); padding: 14px 18px; border-radius: 12px; border: 1px solid var(--border); transition: all 0.2s; }
        .session-row:hover { background: var(--surface-hover); border-color: var(--border-strong); }
        .row-left { display: flex; gap: 14px; align-items: center; }
        .row-color-bar { width: 6px; height: 38px; border-radius: 6px; }
        .row-subj-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); margin-bottom: 4px; }
        .row-subj-meta { font-size: 0.8rem; color: var(--text-secondary); font-family: 'Space Mono', monospace; }
        .row-del-btn { background: rgba(255, 71, 87, 0.1); border: 1px solid transparent; color: #ff4757; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; opacity: 0.8; }
        .row-del-btn:hover { opacity: 1; background: #ff4757; color: #fff; transform: scale(1.05); }

        /* --- สไตล์ของ Custom Popup --- */
        .custom-dialog-overlay { position: fixed; inset: 0; background: rgba(2, 6, 23, 0.8); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .custom-dialog { background: var(--surface); border-radius: 24px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); border: 1px solid var(--border-strong); text-align: center; animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); backdrop-filter: blur(16px); }
        @keyframes popIn { 0% { transform: scale(0.9) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .dialog-icon { font-size: 3.5rem; margin-bottom: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
        .custom-dialog h3 { font-size: 1.5rem; color: var(--text-primary); margin-bottom: 14px; font-weight: 800; }
        .custom-dialog p { font-size: 1rem; color: var(--text-secondary); margin-bottom: 32px; line-height: 1.6; }
        .custom-dialog-actions { display: flex; gap: 14px; justify-content: center; }
        .custom-dialog-actions button { padding: 14px 24px; border-radius: 14px; font-weight: 700; cursor: pointer; border: 1px solid transparent; flex: 1; font-size: 1rem; transition: all 0.2s; }
        .btn-dialog-cancel { background: var(--surface-alt); color: var(--text-primary); border-color: var(--border); }
        .btn-dialog-cancel:hover { background: var(--surface-hover); border-color: var(--border-strong); transform: translateY(-2px); }
        .btn-dialog-confirm { background: var(--accent); color: #fff; box-shadow: var(--accent-glow); }
        .btn-dialog-confirm:hover { filter: brightness(1.15); transform: translateY(-2px); }
        .btn-dialog-danger { background: linear-gradient(135deg, #ff4757, #ff6b81); color: #fff; box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4); }
        .btn-dialog-danger:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(255, 71, 87, 0.6); }

        @media (max-width: 1024px) { .main-layout { grid-template-columns: 1fr; } .sidebar-panel { display: none; } .btn-add-mobile { display: block; } }
        @media (max-width: 768px) { .header { padding: 16px; flex-wrap: wrap; gap: 16px; } .logo h1 { font-size: 1.2rem; } .hide-mobile { display: none; } .content { padding: 20px; gap: 28px; } .summary-header { flex-direction: column; align-items: flex-start; gap: 16px; } .summary-badges { flex-wrap: wrap; } .summary-grid { grid-template-columns: 1fr; } }
        :global(body.export-mode) { overflow-x: auto; }
        :global(body.export-mode .schedule-wrapper) { 
          min-width: max-content !important; 
          background: #020617 !important;
        }
        :global(body.theme-light.export-mode .schedule-wrapper) { 
          background: #f8fafc !important;
        }
        :global(body.export-mode .header) { position: relative !important; backdrop-filter: none !important; box-shadow: none !important; }
        :global(body.export-mode .main-layout) { display: block !important; overflow: visible !important; }
        :global(body.export-mode .content) { overflow: visible !important; }
        :global(body.export-mode .grid-wrapper) { overflow: visible !important; }
        :global(body.export-mode .sidebar-panel), :global(body.export-mode .action-buttons), :global(body.export-mode .row-del-btn) { display: none !important; }
        :global(body.export-mode .action-buttons),
        :global(body.export-mode .row-del-btn) { 
          display: none !important; 
        }
      
      
      `}</style>
    </div>
  );
}