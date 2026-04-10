"use client";

import React, { useState } from 'react';
import './sc.css'; // <--- อย่าลืมนำเข้าไฟล์ CSS ที่สร้างไว้

const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
const presetColors = ['#6366f1', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#10b981'];

export default function Timetable() {
    const [classes, setClasses] = useState([]);

    const [formData, setFormData] = useState({
        subject: '', details: '', color: '#6366f1',
        day: 'จันทร์', startTime: '', endTime: '',
        hasSecondDay: false, day2: 'พฤหัสบดี', startTime2: '', endTime2: ''
    });

    const [timeError, setTimeError] = useState('');

    const validateTimeFormat = (time) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);

    const getAllClassInstances = (classList) => {
        const instances = [];
        classList.forEach(c => {
            instances.push({ ...c, refId: c.id, part: 1 });
            if (c.hasSecondDay) {
                instances.push({ ...c, id: `${c.id}-2`, refId: c.id, day: c.day2, startTime: c.startTime2, endTime: c.endTime2, part: 2 });
            }
        });
        return instances;
    };

    const handleAddClass = (e) => {
        e.preventDefault();
        setTimeError('');

        if (!validateTimeFormat(formData.startTime) || !validateTimeFormat(formData.endTime)) {
            return setTimeError('พิมพ์เวลาวันที่ 1 ในรูปแบบ HH:MM เช่น 08:30');
        }
        if (formData.hasSecondDay && (!validateTimeFormat(formData.startTime2) || !validateTimeFormat(formData.endTime2))) {
            return setTimeError('พิมพ์เวลาวันที่ 2 ในรูปแบบ HH:MM เช่น 13:00');
        }

        const startVal1 = parseInt(formData.startTime.replace(':', ''));
        const endVal1 = parseInt(formData.endTime.replace(':', ''));
        if (startVal1 >= endVal1) return setTimeError('เวลาเริ่มวันที่ 1 ต้องมาก่อนเวลาจบ');

        let startVal2, endVal2;
        if (formData.hasSecondDay) {
            startVal2 = parseInt(formData.startTime2.replace(':', ''));
            endVal2 = parseInt(formData.endTime2.replace(':', ''));
            if (startVal2 >= endVal2) return setTimeError('เวลาเริ่มวันที่ 2 ต้องมาก่อนเวลาจบ');
        }

        const allExisting = getAllClassInstances(classes);
        let isConflict = false;
        let conflictSubjects = [];

        const checkConflict = (day, sVal, eVal) => {
            allExisting.forEach(item => {
                if (item.day !== day) return;
                const eS = parseInt(item.startTime.replace(':', ''));
                const eE = parseInt(item.endTime.replace(':', ''));
                if (sVal < eE && eVal > eS) {
                    isConflict = true;
                    if (!conflictSubjects.includes(item.subject)) conflictSubjects.push(item.subject);
                }
            });
        };

        checkConflict(formData.day, startVal1, endVal1);
        if (formData.hasSecondDay) checkConflict(formData.day2, startVal2, endVal2);

        if (isConflict) {
            if (!window.confirm(`⚠️ เวลานี้ชนกับวิชา: ${conflictSubjects.join(', ')} \n`)) return;
        }

        setClasses([...classes, { ...formData, id: Date.now().toString() }]);
        setFormData({ ...formData, subject: '', details: '', startTime: '', endTime: '', startTime2: '', endTime2: '', hasSecondDay: false });
    };

    const removeClass = (refId) => {
        if (window.confirm("ต้องการลบวิชานี้ไหม? (หากมี 2 วันจะถูกลบทั้งคู่)")) {
            setClasses(classes.filter(c => c.id !== refId));
        }
    };

    const getPositionStyle = (start, end) => {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        const startDecimal = sH + sM / 60;
        const endDecimal = eH + eM / 60;

        const left = ((startDecimal - 7) / 11) * 100;
        const width = ((endDecimal - startDecimal) / 11) * 100;
        return { left: `${left}%`, width: `${width}%` };
    };

    const calculateTotalHours = () => {
        let total = 0;
        getAllClassInstances(classes).forEach(c => {
            const [sH, sM] = c.startTime.split(':').map(Number);
            const [eH, eM] = c.endTime.split(':').map(Number);
            total += (eH + eM / 60) - (sH + sM / 60);
        });
        return total.toFixed(1);
    };

    const flatClasses = getAllClassInstances(classes);

    return (
        <div className="tt-wrapper">
            <div className="tt-container">

                <h1 className="tt-title">Class Schedule Planner</h1>

                {/* 1. Form Section */}
                <div className="tt-card">
                    <form onSubmit={handleAddClass}>
                        <div className="tt-form-grid">
                            <div className="tt-input-group col-span-2">
                                <label className="tt-label">ชื่อวิชา</label>
                                <input type="text" className="tt-input" required placeholder=""
                                    value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                            </div>
                            <div className="tt-input-group">
                                <label className="tt-label">รายละเอียด</label>
                                <input type="text" className="tt-input" placeholder=""
                                    value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })} />
                            </div>
                            <div className="tt-input-group">
                                <label className="tt-label">สี</label>
                                <div className="tt-color-picker">
                                    {presetColors.map(color => (
                                        <button type="button" key={color} onClick={() => setFormData({ ...formData, color })}
                                            className={`tt-color-btn ${formData.color === color ? 'active' : ''}`}
                                            style={{ backgroundColor: color }} aria-label="Color" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Day 1 */}
                        <div className="tt-section-day1 tt-form-grid">
                            <div className="tt-input-group">
                                <label className="tt-label">วันที่เรียน (หลัก)</label>
                                <select className="tt-input" value={formData.day} onChange={e => setFormData({ ...formData, day: e.target.value })}>
                                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="tt-input-group">
                                <label className="tt-label">เวลาเริ่ม (HH:MM)</label>
                                <input type="text" className="tt-input tt-input-center" required placeholder="08:30"
                                    value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                            </div>
                            <div className="tt-input-group">
                                <label className="tt-label">เวลาจบ (HH:MM)</label>
                                <input type="text" className="tt-input tt-input-center" required placeholder="10:00"
                                    value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                            </div>
                        </div>

                        {/* Day 2 Toggle */}
                        <label className="tt-checkbox-wrapper">
                            <input type="checkbox" className="tt-checkbox" checked={formData.hasSecondDay}
                                onChange={e => setFormData({ ...formData, hasSecondDay: e.target.checked })} />
                            เพิ่มวันที่เรียนอีก 1 วัน
                        </label>

                        {/* Day 2 */}
                        {formData.hasSecondDay && (
                            <div className="tt-section-day2 tt-form-grid">
                                <div className="tt-input-group">
                                    <label className="tt-label">วันที่เรียน (วันที่สอง)</label>
                                    <select className="tt-input" value={formData.day2} onChange={e => setFormData({ ...formData, day2: e.target.value })}>
                                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="tt-input-group">
                                    <label className="tt-label">เวลาเริ่ม (HH:MM)</label>
                                    <input type="text" className="tt-input tt-input-center" required placeholder="13:00"
                                        value={formData.startTime2} onChange={e => setFormData({ ...formData, startTime2: e.target.value })} />
                                </div>
                                <div className="tt-input-group">
                                    <label className="tt-label">เวลาจบ (HH:MM)</label>
                                    <input type="text" className="tt-input tt-input-center" required placeholder="15:00"
                                        value={formData.endTime2} onChange={e => setFormData({ ...formData, endTime2: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="tt-form-footer">
                            <span className="tt-error">{timeError}</span>
                            <button type="submit" className="tt-btn-submit">เพิ่มลงตาราง</button>
                        </div>
                    </form>
                </div>

                {/* 2. Timetable Grid */}
                <div className="tt-grid-container">
                    <div className="tt-grid-header">
                        <div className="tt-col-day">DAY \ TIME</div>
                        <div className="tt-col-time-wrapper">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="tt-time-label" style={{ left: `${(i / 11) * 100}%` }}>
                                    {i + 7}:00
                                </div>
                            ))}
                        </div>
                    </div>

                    {days.map((day) => (
                        <div key={day} className="tt-grid-row">
                            <div className="tt-day-name">{day}</div>
                            <div className="tt-canvas">

                                {/* Lines */}
                                <div className="tt-bg-lines">
                                    {Array.from({ length: 11 }).map((_, i) => (
                                        <div key={i} className="tt-hour-block">
                                            <div className="tt-half-hour-line"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cards */}
                                {flatClasses.filter(c => c.day === day).map((cls) => {
                                    const style = getPositionStyle(cls.startTime, cls.endTime);
                                    return (
                                        <div key={cls.id} className="tt-subject-card"
                                            style={{ ...style, backgroundColor: `${cls.color}25`, borderColor: cls.color }}>
                                            <div className="tt-card-header">
                                                <div className="tt-subject-name">{cls.subject}</div>
                                                <button type="button" onClick={() => removeClass(cls.refId)} className="tt-btn-delete">✕</button>
                                            </div>
                                            <div className="tt-time-badge" style={{ color: cls.color }}>{cls.startTime} - {cls.endTime}</div>
                                            {cls.details && <div className="tt-details">{cls.details}</div>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3. Summary */}
                <div className="tt-card">
                    <div className="tt-summary-header">
                        <div className="tt-summary-title">📋 สรุปวิชาเรียนทั้งหมด</div>
                        <div className="tt-stats">
                            <span className="tt-stat-badge">ทั้งหมด: {classes.length} วิชา</span>
                            <span className="tt-stat-badge highlight">เวลารวม: {calculateTotalHours()} ชม./สัปดาห์</span>
                        </div>
                    </div>

                    {classes.length === 0 ? (
                        <div className="tt-empty">ยังไม่มีข้อมูลในตาราง</div>
                    ) : (
                        <div className="tt-summary-grid">
                            {days.map(day => {
                                const dayClasses = flatClasses.filter(c => c.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
                                if (dayClasses.length === 0) return null;
                                return (
                                    <div key={`sum-${day}`} className="tt-summary-day">
                                        <h3><div className="tt-day-dot"></div>{day}</h3>
                                        {dayClasses.map(cls => (
                                            <div key={`list-${cls.id}`} className="tt-summary-item">
                                                <div className="tt-item-color" style={{ backgroundColor: cls.color }}></div>
                                                <div className="tt-item-info">
                                                    <div className="tt-item-title">{cls.subject}</div>
                                                    <div className="tt-item-time">{cls.startTime} - {cls.endTime} {cls.details && `• ${cls.details}`}</div>
                                                </div>
                                                <button type="button" onClick={() => removeClass(cls.refId)} className="tt-item-delete">ลบ</button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}