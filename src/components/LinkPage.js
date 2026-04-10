"use client";

import React from "react";
import Link from "next/link";
import "./page.css";

export default function LinkPage() {
  function handleRipple(e) {
    const target = e.currentTarget;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = (e.clientX ?? rect.width / 2) - rect.left;
    const y = (e.clientY ?? rect.height / 2) - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  }
  const links = [
    // หมายเหตุ: มีข้อความบางส่วนแสดงผลเพี้ยนในไฟล์เดิม จึงปรับให้อ่านง่ายขึ้น
    { title: "E-portfolio", url: "https://djuzee-website.vercel.app/" },
    { title: "QR Code", url: "/qr" },
    { title: "File", url: "/file" },
    { title: "Python Visualizer", url: "/python" },
    { title: "Bot discord", url: "https://discord.com/oauth2/authorize?client_id=1293199567503753307&permissions=8&integration_type=0&scope=bot" },
    { title: "Schedule", url: "/Schedule" },
  ];

  return (
    <div className="page-container">
      <div className="blob-1" />
      <div className="blob-2" />

      <main className="card">
        <header className="profile">
          <div className="profile-text">
            <h1 className="heading">djuzee</h1>
            <p className="subtitle">Link Page • Quick access</p>
          </div>
        </header>

        <nav className="links">
          {links.map((link, i) => {
            const isInternal = link.url.startsWith("/");
            const content = (
              <>
                <span className="title">{link.title}</span>
                <span className="arrow" aria-hidden>→</span>
              </>
            );

            return isInternal ? (
              <Link
                key={i}
                href={link.url}
                className="link"
                prefetch
                onPointerDown={handleRipple}
              >
                {content}
              </Link>
            ) : (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="link"
                onPointerDown={handleRipple}
              >
                {content}
              </a>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
