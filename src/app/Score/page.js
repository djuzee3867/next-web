'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

const DIFFICULTIES = [
  { id: 'easy',   label: 'ง่าย (x1)',    multiplier: 1, classSuffix: '1' },
  { id: 'medium', label: 'ปานกลาง (x2)', multiplier: 2, classSuffix: '2' },
  { id: 'hard',   label: 'ยาก (x3)',     multiplier: 3, classSuffix: '3' },
];

function fmt(n) {
  if (typeof n !== 'number') return n;
  if (Number.isInteger(n)) return n.toLocaleString('th-TH');
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

export default function ScoreTrackerPage() {
  const [currentScore, setCurrentScore] = useState(0);
  const [history, setHistory]           = useState([]);
  const [baseInput, setBaseInput]       = useState('');
  const [betInput, setBetInput]         = useState('');
  
  const [multiplierMode, setMultiplierMode] = useState('preset'); 
  const [multiplier, setMultiplier]         = useState(1); 
  const [customMult, setCustomMult]         = useState(''); 

  const [flash, setFlash]               = useState(null);
  const [baseSet, setBaseSet]           = useState(false);
  
  // เปลี่ยนชื่อ Ref จากตาราง มาเป็น Scoreboard แทน
  const scoreboardRef = useRef(null);
  const [isMounted, setIsMounted]       = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({ action: '', bet: '', rawMultiplier: '' });

  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('invest_game_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setCurrentScore(parsedData.currentScore || 0);
        setHistory(parsedData.history || []);
        setBaseSet(parsedData.baseSet || false);
      } catch (error) {
        console.error("โหลดข้อมูลเดิมไม่สำเร็จ", error);
      }
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('invest_game_data', JSON.stringify({ currentScore, history, baseSet }));
    }
  }, [currentScore, history, baseSet, isMounted]);

  const triggerFlash = (dir) => {
    setFlash(dir);
    setTimeout(() => setFlash(null), 600);
  };

  // ฟังก์ชันสำหรับเลื่อนจอขึ้นไปที่กล่องเงินทุน (จัดให้อยู่กลางจอพอดี)
  const scrollToScoreboard = () => {
    setTimeout(() => {
      scoreboardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const recalculateAndSave = (currentHist) => {
    if (!currentHist || currentHist.length === 0) {
      setCurrentScore(0);
      setHistory([]);
      setBaseSet(false);
      return;
    }

    let runningTotal = 0;
    const reversed = [...currentHist].reverse();
    
    const newHist = reversed.map((row) => {
      if (row.action === 'SET') {
        const baseVal = row.editedBase !== undefined ? row.editedBase : row.result;
        runningTotal = baseVal;
        return { ...row, result: baseVal, delta: null, editedBase: undefined };
      } else if (row.action === 'WIN') {
        const mult = parseFloat(row.rawMultiplier) || 1;
        const b = parseFloat(row.bet) || 0;
        const d = b * mult;
        runningTotal += d;
        return { ...row, bet: b, rawMultiplier: mult, multiplier: `x${mult}`, delta: d, result: runningTotal, label: `ตอบถูก (ตัวคูณ x${mult})` };
      } else if (row.action === 'LOSE') {
        const b = parseFloat(row.bet) || 0;
        const d = -b;
        runningTotal += d;
        return { ...row, bet: b, multiplier: '—', rawMultiplier: 1, delta: d, result: runningTotal, label: 'ตอบผิด / หมดเวลา' };
      }
      return row;
    });

    const finalHist = newHist.reverse();
    setHistory(finalHist);
    setCurrentScore(finalHist[0].result);
    setBaseSet(finalHist.some(h => h.action === 'SET'));
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    const currentMult = row.rawMultiplier || parseFloat(String(row.multiplier).replace('x', '')) || 1;
    setEditForm({
      action: row.action,
      bet: row.action === 'SET' ? row.result : row.bet,
      rawMultiplier: currentMult
    });
  };

  const handleSaveEdit = (id) => {
    const mapped = history.map(h => {
      if (h.id === id) {
        if (h.action === 'SET') {
          return { ...h, editedBase: parseFloat(editForm.bet) || 0 };
        } else {
          return { 
            ...h, 
            action: editForm.action, 
            bet: parseFloat(editForm.bet) || 0, 
            rawMultiplier: parseFloat(editForm.rawMultiplier) || 1 
          };
        }
      }
      return h;
    });
    recalculateAndSave(mapped);
    setEditingId(null);
    triggerFlash('up');
  };

  const handleDelete = (id) => {
    if (confirm('แน่ใจหรือไม่ที่จะลบรายการนี้? (ระบบจะคำนวณยอดเงินสะสมใหม่ทั้งหมด)')) {
      const filtered = history.filter(h => h.id !== id);
      recalculateAndSave(filtered);
      triggerFlash('down');
    }
  };

  const handleSetBase = () => {
    const val = parseFloat(baseInput);
    if (isNaN(val)) return;
    const newRow = {
      id: Date.now(), label: 'เงินทุนเริ่มต้น', action: 'SET',
      bet: '—', rawMultiplier: 1, multiplier: '—', result: val, delta: null,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };
    recalculateAndSave([newRow, ...history]);
    setBaseInput('');
    scrollToScoreboard(); // สั่งเลื่อนขึ้นไปดูกล่องเงิน
  };

  const handleWin = () => {
    const bet = parseFloat(betInput);
    if (isNaN(bet) || bet <= 0 || multiplier <= 0) return;
    const newRow = {
      id: Date.now(), label: `ตอบถูก (ตัวคูณ x${multiplier})`, action: 'WIN',
      bet: bet, rawMultiplier: multiplier, multiplier: `x${multiplier}`, result: 0, delta: 0,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };
    recalculateAndSave([newRow, ...history]);
    setBetInput('');
    scrollToScoreboard(); // สั่งเลื่อนขึ้นไปดูกล่องเงิน
  };

  const handleLose = () => {
    const bet = parseFloat(betInput);
    if (isNaN(bet) || bet <= 0) return;
    const newRow = {
      id: Date.now(), label: 'ตอบผิด / หมดเวลา', action: 'LOSE',
      bet: bet, rawMultiplier: 1, multiplier: '—', result: 0, delta: 0,
      timestamp: new Date().toLocaleTimeString('th-TH')
    };
    recalculateAndSave([newRow, ...history]);
    setBetInput('');
    scrollToScoreboard(); // สั่งเลื่อนขึ้นไปดูกล่องเงิน
  };

  const confirmReset = () => {
    recalculateAndSave([]);
    localStorage.removeItem('invest_game_data');
    setShowResetModal(false);
  };

  if (!isMounted) return <div style={{ minHeight: '100vh', backgroundColor: '#060913' }}></div>;

  const scoreboardClass = [styles.scoreboard, flash === 'up' ? styles.flashUp : '', flash === 'down' ? styles.flashDown : ''].filter(Boolean).join(' ');
  const parsedBet = parseFloat(betInput);
  const isValidBet = !isNaN(parsedBet) && parsedBet > 0 && multiplier > 0;
  const winPreview = isValidBet ? currentScore + (parsedBet * multiplier) : null;
  const losePreview = isValidBet ? currentScore - parsedBet : null;

  return (
    <div className={styles.page}>
      
      {showResetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalIcon}>⚠️</div>
            <h3 className={styles.modalTitle}>ยืนยันการล้างข้อมูล</h3>
            <p className={styles.modalText}>
              คุณแน่ใจหรือไม่ที่จะ <b>"ล้างข้อมูลเกมทั้งหมด"</b> ?<br />
              ข้อมูลที่บันทึกไว้จะหายไป และไม่สามารถกู้คืนได้!
            </p>
            <div className={styles.modalActions}>
              <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setShowResetModal(false)}>ยกเลิก</button>
              <button className={styles.btnResetDanger} onClick={confirmReset} style={{ width: '100%', justifyContent: 'center' }}>ล้างข้อมูลเลย</button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>INVEST<span className={styles.titleAccent}>GAME</span></h1>
            <p className={styles.subtitle}>ระบบคำนวณเงินเกมลงทุนสำหรับ Staff</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnResetDanger} onClick={() => setShowResetModal(true)} disabled={history.length === 0}>
              ✕ ล้างข้อมูล
            </button>
          </div>
        </header>

        {/* นำ ref มาแปะไว้ที่กล่อง Scoreboard นี้ เพื่อให้เป้าหมายการเลื่อนจอมาหยุดตรงนี้ */}
        <div className={scoreboardClass} ref={scoreboardRef}>
          <div className={styles.scoreboardLeft}>
            <div className={styles.scoreLabel}>เงินทุนคงเหลือปัจจุบัน</div>
            <div className={styles.scoreValue}>{fmt(currentScore)}</div>
          </div>
          <div className={styles.scoreboardRight}>
            <span className={styles.roundBadge}>{history.length}</span>
            <span className={styles.roundLabel}>รอบที่บันทึก</span>
          </div>
        </div>

        {!baseSet && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>ตั้งค่าเงินทุนเริ่มต้นให้กลุ่ม</div>
            <div className={styles.field} style={{ marginBottom: '1rem' }}>
              <input type="number" inputMode="numeric" className={styles.input} placeholder="เช่น 1000" value={baseInput} onChange={e => setBaseInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSetBase()} />
            </div>
            <button className={`${styles.btn} ${styles.btnPrimary} ${styles.btnFull}`} onClick={handleSetBase} disabled={baseInput === '' || isNaN(parseFloat(baseInput))}>เริ่มเปิดระบบเดินเงิน →</button>
          </div>
        )}

        <div className={`${styles.card} ${!baseSet ? styles.cardDisabled : ''}`}>
          <div className={styles.cardTitle}>กรอกเงินเดิมพัน & สรุปผลคำถาม</div>
          <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
            <label className={styles.fieldLabel}>เงินที่กลุ่มลงเดิมพันในข้อนี้</label>
            <input type="number" inputMode="numeric" className={styles.input} placeholder={baseSet ? "ระบุจำนวนเงินที่น้องลง..." : "กรุณาตั้งเงินทุนเริ่มต้นก่อน"} value={betInput} onChange={e => setBetInput(e.target.value)} disabled={!baseSet} />
          </div>
          <div className={styles.field} style={{ marginBottom: '1.25rem' }}>
            <label className={styles.fieldLabel}>เลือกระดับความยาก (หรือกำหนดตัวคูณเอง)</label>
            <div className={styles.opGrid}>
              {DIFFICULTIES.map(diff => (
                <button key={diff.id} disabled={!baseSet} className={`${styles.opPill} ${multiplierMode === 'preset' && multiplier === diff.multiplier ? styles['active' + diff.classSuffix] : ''}`} onClick={() => { setMultiplierMode('preset'); setMultiplier(diff.multiplier); }}>{diff.label}</button>
              ))}
              <button disabled={!baseSet} className={`${styles.opPill} ${multiplierMode === 'custom' ? styles.activeCustom : ''}`} onClick={() => { setMultiplierMode('custom'); setMultiplier(parseFloat(customMult) || 0); }}>กำหนดเอง</button>
            </div>
            {multiplierMode === 'custom' && (
              <div className={styles.field} style={{ marginTop: '0.75rem' }}>
                <input type="number" inputMode="decimal" step="0.1" className={styles.input} style={{ borderColor: '#a855f7' }} placeholder="ระบุตัวคูณ เช่น 1.5, 4" value={customMult} onChange={e => { setCustomMult(e.target.value); setMultiplier(parseFloat(e.target.value) || 0); }} />
              </div>
            )}
          </div>
          
          {isValidBet && baseSet && (
            <div className={styles.previewBox}>
              <div className={styles.previewWin}>🟢 <b>ถ้าตอบถูก:</b> {fmt(currentScore)} + ({fmt(parsedBet)} × {multiplier}) = <b>{fmt(winPreview)}</b></div>
              <div className={styles.previewLose}>🔴 <b>ถ้าตอบผิด:</b> {fmt(currentScore)} − {fmt(parsedBet)} = <b>{fmt(losePreview)}</b></div>
            </div>
          )}

          <div className={styles.actionGrid}>
            <button className={`${styles.btn} ${styles.btnWin}`} onClick={handleWin} disabled={!baseSet || !isValidBet}>✅ ตอบถูก (Win)</button>
            <button className={`${styles.btn} ${styles.btnLose}`} onClick={handleLose} disabled={!baseSet || !isValidBet}>❌ ตอบผิด / ไม่ทัน (Lose)</button>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.tableSection}>
          <div className={styles.tableSectionTitle}>ประวัติการทำรายการ</div>
          <div className={styles.tableWrap}>
            {history.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📋</span>
                <span className={styles.emptyText}>ยังไม่มีรายการบันทึกคะแนนในขณะนี้</span>
              </div>
            ) : (
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>รอบ</th>
                    <th className={styles.th}>ผลลัพธ์</th>
                    <th className={styles.th}>เงินตั้งต้น/เดิมพัน</th>
                    <th className={styles.th}>ตัวคูณ</th>
                    <th className={styles.th}>เปลี่ยนแปลง</th>
                    <th className={styles.th}>ยอดสุทธิ</th>
                    <th className={styles.th}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => {
                    const isEditing = editingId === row.id;

                    if (isEditing) {
                      return (
                        <tr key={row.id} className={styles.trBody} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                          <td className={`${styles.td} ${styles.tdNum}`}>{history.length - i}</td>
                          <td className={styles.td}>
                            {row.action === 'SET' ? <span className={styles.tagSet}>เริ่มเงินทุน</span> : (
                              <select className={styles.editInput} value={editForm.action} onChange={e => setEditForm({...editForm, action: e.target.value})}>
                                <option value="WIN">ชนะ (Win)</option>
                                <option value="LOSE">แพ้ (Lose)</option>
                              </select>
                            )}
                          </td>
                          <td className={styles.td}>
                            <input type="number" className={styles.editInput} style={{ width: '80px' }} value={editForm.bet} onChange={e => setEditForm({...editForm, bet: e.target.value})} />
                          </td>
                          <td className={styles.td}>
                            {row.action === 'SET' || editForm.action === 'LOSE' ? '—' : (
                              <input type="number" step="0.1" className={styles.editInput} style={{ width: '60px' }} value={editForm.rawMultiplier} onChange={e => setEditForm({...editForm, rawMultiplier: e.target.value})} />
                            )}
                          </td>
                          <td className={styles.td}>—</td>
                          <td className={styles.td}>—</td>
                          <td className={styles.td}>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button className={styles.actionBtn} style={{ color: '#4fffb0', borderColor: '#4fffb0' }} onClick={() => handleSaveEdit(row.id)}>💾</button>
                              <button className={styles.actionBtn} style={{ color: '#ff4d6d', borderColor: '#ff4d6d' }} onClick={() => setEditingId(null)}>✕</button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    const deltaStr = row.delta === null ? '—' : row.delta > 0 ? `+${fmt(row.delta)}` : fmt(row.delta);
                    const deltaClass = row.delta === null ? styles.tdDeltaZero : row.delta > 0 ? styles.tdDeltaPos : styles.tdDeltaNeg;

                    return (
                      <tr key={row.id} className={`${styles.trBody} ${i === 0 ? styles.trLatest : ''}`}>
                        <td className={`${styles.td} ${styles.tdNum}`}>{history.length - i}</td>
                        <td className={styles.td}>
                          <span className={row.action === 'SET' ? styles.tagSet : row.action === 'WIN' ? styles.tagWin : styles.tagLose}>
                            {row.action === 'SET' ? 'เริ่มเงินทุน' : row.action === 'WIN' ? 'ชนะ' : 'แพ้'}
                          </span>
                        </td>
                        <td className={styles.td}>{row.action === 'SET' ? fmt(row.result) : fmt(row.bet)}</td>
                        <td className={styles.td}>{row.multiplier}</td>
                        <td className={`${styles.td} ${deltaClass}`}>{deltaStr}</td>
                        <td className={`${styles.td} ${styles.tdResult}`}>{fmt(row.result)}</td>
                        <td className={styles.td}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className={styles.actionBtn} onClick={() => startEdit(row)}>✏️</button>
                            <button className={styles.actionBtn} onClick={() => handleDelete(row.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}