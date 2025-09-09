"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./file.css";

function NavBar() {
  const [show, setShow] = useState(true);
  const [last, setLast] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 40) {
        setShow(true);
        setScrolled(false);
        setLast(y);
        return;
      }
      setShow(y < last);
      setScrolled(y > 6);
      setLast(y);
    };
    window.addEventListener("scroll", onScroll);
    // initialize on mount
    setScrolled(window.scrollY > 6);
    return () => window.removeEventListener("scroll", onScroll);
  }, [last]);

  return (
    <nav className={`navbar${show ? "" : " navbar--hidden"}${scrolled ? " navbar--scrolled" : ""}`}>
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">Files Hub</Link>
        <div className="navbar-links">
          <Link href="/" className="navbar-link">Home</Link>
          
        </div>
      </div>
    </nav>
  );
}

function parseGViz(text) {
  // gviz wraps JSON: "/*O_o*/\ngoogle.visualization.Query.setResponse(...)".
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}

export default function FilePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");

  // Global ripple effect for clickable elements (.bt, .course-btn, .navbar-link)
  useEffect(() => {
    function createRippleFromEvent(e) {
      const isTouch = e.touches && e.touches[0];
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      const target = (e.target && e.target.closest) ? e.target.closest('.bt, .course-btn, .navbar-link') : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 1.8;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const span = document.createElement('span');
      span.className = 'ripple';
      span.style.width = size + 'px';
      span.style.height = size + 'px';
      span.style.left = x + 'px';
      span.style.top = y + 'px';
      target.appendChild(span);
      setTimeout(() => span.remove(), 720);
    }

    const onMouseDown = (e) => createRippleFromEvent(e);
    const onTouchStart = (e) => createRippleFromEvent(e);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const sheetId = "1a91Mu_pN8C9bdDk13SSGfu6Xh3SraGhV79ez0Fv3lMQ";
    const sheetName = "Sheet1";
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

    fetch(url, { signal: controller.signal })
      .then((r) => r.text())
      .then((text) => {
        const json = parseGViz(text);
        const labels = json.table.cols.map((c) => c.label);
        const data = json.table.rows.map((row) => {
          const obj = {};
          row.c.forEach((cell, i) => {
            obj[labels[i]] = cell ? cell.v : "";
          });
          return obj;
        });
        setRows(data);
        setError("");
      })
      .catch((e) => {
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
        setTimeout(() => setShowContent(true), 120);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  // Utility: pick a value from possible keys
  const pick = (obj, keys) => {
    for (const k of keys) {
      if (k in obj && obj[k]) return String(obj[k]);
    }
    return "";
  };

  // Normalize rows into a common shape, trying multiple key names.
  const items = useMemo(() => {
    return rows.map((r) => {
      const name = pick(r, ["ชื่อสรุป", "หัวข้อ", "ชื่อ", "title", "Title", "name", "Name"]);
      const desc = pick(r, ["คำอธิบาย", "รายละเอียด", "description", "Description", "desc"]);
      const category = pick(r, ["หมวดหมู่", "หมวด", "category", "Category"]) || "ไม่ระบุหมวดหมู่";
      const url = pick(r, ["อัพโหลดไฟล์", "ลิงก์", "ลิงค์", "url", "URL", "link", "Link"]);
      const title = pick(r, ["title", "Title"]) || name;
      return { raw: r, title, name, desc, category, url };
    });
  }, [rows]);

  const categories = useMemo(() => {
    const set = new Set(["ทั้งหมด"]);
    items.forEach((it) => set.add(it.category || "ไม่ระบุหมวดหมู่"));
    return Array.from(set);
  }, [items]);

  const filtered = items.filter((it) => {
    const okCat = selectedCategory === "ทั้งหมด" || it.category === selectedCategory;
    const q = query.trim().toLowerCase();
    const okSearch = !q ||
      it.title.toLowerCase().includes(q) ||
      it.name.toLowerCase().includes(q) ||
      it.desc.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q);
    return okCat && okSearch;
  });

  return (
    <>
      <NavBar />
      <div className={`file-app fade-in-content${showContent ? " show" : ""}`}>
        <h1 className="main-title">รวบรวมสรุปหรือชีทเรียนต่างๆ</h1>
        <p className="main-desc">เว็บไซต์นี้จัดเก็บไฟล์สรุปและชีทเรียนต่างๆ เพื่อความสะดวกในการเข้าถึงและใช้งาน</p>

        <div className="main-actions">
          <a href="https://docs.google.com/forms/d/e/1FAIpQLScGTgiS_qUKAxXu_-6JgXbLDY6tNAZob4FzTl6BQG6OCyPJtw/viewform" className="bt outline" target="_blank" rel="noopener noreferrer">เพิ่มไฟล์<br />คลิกที่นี่</a>
          <a href="https://drive.google.com/drive/folders/1t3Cb_su_3q55iew8CggnnHH-eHGosy0H?usp=sharing" className="bt outline" target="_blank" rel="noopener noreferrer">ดูไฟล์ใน Google Drive</a>
        </div>

        <div className="toolbar">
          <div className="category-select-wrapper">
            <label htmlFor="category-select" className="category-label">เลือกหมวดหมู่</label>
            <select id="category-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="category-select">
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="search-box">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาไฟล์..." className="search-input"/>
          </div>
        </div>

        {error && (
          <div className="callout">
            <div className="callout-title">เกิดข้อผิดพลาด</div>
            <div className="callout-desc">{error}</div>
            <button className="bt primary" onClick={() => location.reload()}>ลองอีกครั้ง</button>
          </div>
        )}

        <div className="courses-grid">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div className="course-card skeleton" key={i}>
                <div className="course-content">
                  <div className="skeleton-line w-60" />
                  <div className="skeleton-line w-80" />
                  <div className="skeleton-line w-40" />
                  <div className="skeleton-btn" />
                </div>
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="empty">ไม่พบผลลัพธ์</div>
          ) : (
            filtered.map((course, idx) => (
              <div className="course-card" key={idx}>
                <div className="course-content">
                  <div className="course-header">
                    <span className="badge">{course.category || "ไม่ระบุหมวดหมู่"}</span>
                  </div>
                  {course.title && <div className="course-title">{course.title}</div>}
                  {course.name && course.name !== course.title && (
                    <div className="course-title subtle">{course.name}</div>
                  )}
                  {course.desc && <div className="course-description">{course.desc}</div>}
                  {course.url && (
                    <a href={course.url} target="_blank" rel="noopener noreferrer" className="course-btn">เปิดไฟล์</a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <footer className="footer">
        contact us <a href="https://djuzee-website.web.app/" target="_blank" rel="noopener noreferrer">@djuzee_</a>
        <br />this website created with Next.js
      </footer>
    </>
  );
}
