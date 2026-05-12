"use client";

import { useState, useRef } from "react";
import QRCode from "qrcode";
import "./qr.css";

export default function QRGeneratorPage() {
  const [text, setText] = useState("");
  const [qrUrl, setQrUrl] = useState(null);
  const [fgColor, setFgColor] = useState("#1a1a2e");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [loading, setLoading] = useState(false);

  const fgRef = useRef(null);
  const bgRef = useRef(null);

  const generateQR = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, text, {
        width: 512,
        margin: 2,
        color: {
          dark: fgColor,
          light: transparent ? "#ffffff" : bgColor,
        },
        errorCorrectionLevel: "H",
      });

      if (transparent) {
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) d[i + 3] = 0;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      setQrUrl(canvas.toDataURL("image/png"));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = "qrcode.png";
    a.click();
  };

  return (
    <main className="qr-page">
      <div className="qr-bg-orb orb1" />
      <div className="qr-bg-orb orb2" />

      <div className="qr-container">
        <header className="qr-header">
          <div className="qr-logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <rect x="2" y="2" width="14" height="14" rx="3" fill="#6c63ff" />
              <rect x="20" y="2" width="14" height="14" rx="3" fill="#6c63ff" opacity="0.6" />
              <rect x="2" y="20" width="14" height="14" rx="3" fill="#6c63ff" opacity="0.6" />
              <rect x="22" y="22" width="4" height="4" rx="1" fill="#6c63ff" />
              <rect x="28" y="22" width="6" height="4" rx="1" fill="#6c63ff" opacity="0.4" />
              <rect x="22" y="28" width="6" height="6" rx="1" fill="#6c63ff" opacity="0.4" />
              <rect x="5" y="5" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
              <rect x="23" y="5" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
              <rect x="5" y="23" width="8" height="8" rx="1.5" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div>
            <h1 className="qr-title">QR Generator</h1>
            <p className="qr-subtitle"></p>
          </div>
        </header>

        <div className="qr-grid">
          <div className="qr-controls">
            <div className="form-group">
              <label className="form-label">ข้อความ / URL</label>
              <textarea
                className="form-textarea"
                placeholder="https://example.com หรือข้อความอะไรก็ได้..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="form-row">
              {/* FG color */}
              <div className="form-group">
                <label className="form-label">สี QR</label>
                <div className="color-btn" onClick={() => fgRef.current?.click()}>
                  <span className="color-swatch" style={{ background: fgColor }} />
                  <span className="color-value">{fgColor}</span>
                  <input
                    ref={fgRef}
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="hidden-color-input"
                  />
                </div>
              </div>

              {/* BG color */}
              <div className="form-group">
                <label className="form-label">สีพื้นหลัง</label>
                <div
                  className={`color-btn ${transparent ? "disabled" : ""}`}
                  onClick={() => !transparent && bgRef.current?.click()}
                >
                  <span className="color-swatch checker">
                    <span className="color-overlay" style={{ background: bgColor, opacity: transparent ? 0 : 1 }} />
                  </span>
                  <span className="color-value">{transparent ? "โปร่งใส" : bgColor}</span>
                  <input
                    ref={bgRef}
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={transparent}
                    className="hidden-color-input"
                  />
                </div>
              </div>
            </div>

            {/* Transparent toggle */}
            <div className="trans-row">
              <span className="trans-label">พื้นหลังโปร่งใส (PNG)</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={transparent}
                  onChange={(e) => setTransparent(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            <button
              className="btn-generate"
              onClick={generateQR}
              disabled={!text.trim() || loading}
            >
              {loading ? <span className="spinner" /> : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="4" height="4" rx=".5" />
                </svg>
              )}
              {loading ? "กำลังสร้าง..." : "สร้าง QR Code"}
            </button>
          </div>

          <div className="qr-preview-area">
            {qrUrl ? (
              <div className="qr-result">
                <div className={`qr-image-wrap ${transparent ? "transparent-bg" : ""}`}>
                  <img src={qrUrl} alt="QR Code" className="qr-image" />
                </div>
                <div className="qr-meta">
                  <span className="qr-tag">512×512px</span>
                  <span className="qr-tag">Error H</span>
                  {transparent && <span className="qr-tag green">โปร่งใส</span>}
                </div>
                <button className="btn-download" onClick={downloadQR}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  ดาวน์โหลด PNG
                </button>
              </div>
            ) : (
              <div className="qr-empty">
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="4 2" />
                  <rect x="36" y="4" width="24" height="24" rx="4" stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="4 2" />
                  <rect x="4" y="36" width="24" height="24" rx="4" stroke="#6c63ff" strokeWidth="1.5" strokeDasharray="4 2" />
                  <rect x="10" y="10" width="12" height="12" rx="2" fill="#6c63ff" opacity="0.2" />
                  <rect x="42" y="10" width="12" height="12" rx="2" fill="#6c63ff" opacity="0.2" />
                  <rect x="10" y="42" width="12" height="12" rx="2" fill="#6c63ff" opacity="0.2" />
                </svg>
                <p className="qr-empty-text">QR Code จะปรากฏที่นี่</p>
                <p className="qr-empty-hint">กรอกข้อความแล้วกดสร้าง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}