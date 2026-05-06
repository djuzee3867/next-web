"use client";

import React from "react";
import Link from "next/link";
import "./page.css";

export default function LinkPage() {
  // นำวันที่ (date) และ isDark ออกทั้งหมด
  const links = [
    { title: "E-portfolio", desc: "My personal works and resume", url: "https://djuzee-website.vercel.app/" },
    // { title: "File", desc: "Cloud storage and document processing", url: "/file" },
    { title: "Python Visualizer", desc: "Interactive python code execution", url: "/python" },
    { title: "Bot discord", desc: "Server management and automation", url: "https://discord.com/oauth2/authorize?client_id=1293199567503753307&permissions=8&integration_type=0&scope=bot" },
    { title: "Schedule", desc: "Timetable and appointment tracking", url: "/Schedule" },
    { title: "QR Code", desc: "Generate and manage quick links", url: "/qr" },
    { title: "Foodwaste", desc: "The Past of Research for KKR-NCST", url: "/foodwaste" },
  ];

  return (
    <div className="page-wrapper">
      <main className="main-content">
        
        {/* Header Section */}
        <div className="section-header">
          <div>
            <h1 className="main-title">djuzee</h1>
            <h3>Quick Access Links</h3>
          </div>
          <span className="count-badge">{links.length} Links</span>
        </div>

        {/* Cards Grid */}
        <div className="cards-grid">
          {links.map((link, i) => {
            const isInternal = link.url.startsWith("/");
            const CardWrapper = isInternal ? Link : "a";
            const wrapperProps = isInternal 
              ? { href: link.url, prefetch: true } 
              : { href: link.url, target: "_blank", rel: "noreferrer noopener" };

            return (
              <CardWrapper 
                key={i} 
                {...wrapperProps} 
                className="project-card"
              >
                <div className="card-header">
                  <h4>{link.title}</h4>
                  <span className="more-options">⋮</span>
                </div>
                <p className="card-desc">{link.desc}</p>
                
                {/* เอาส่วนวันที่ออก เหลือแค่ลูกศร */}
                <div className="card-footer">
                  <span className="arrow-icon">→</span>
                </div>
              </CardWrapper>
            );
          })}
        </div>

      </main>
    </div>
  );
}