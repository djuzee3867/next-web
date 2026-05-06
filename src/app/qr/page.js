"use client";
import { useState, useEffect } from "react";
import "./qr.css";

export default function QRGenerator() {
  const [url, setUrl] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    setIsFormValid(url.trim().length > 0);
  }, [url]);

  useEffect(() => {
    if (qrCode) {
      setShowQR(false);
      const timer = setTimeout(() => {
        setShowQR(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [qrCode]);

  const generateQR = async () => {
    if (!url.trim()) {
      const input = document.querySelector('.input');
      input?.classList.add('shake');
      setTimeout(() => input?.classList.remove('shake'), 600);
      return;
    }

    setIsGenerating(true);
    setShowQR(false);
    const startTime = Date.now();

    setTimeout(() => {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
      setQrCode(qrUrl);
      setGenerationTime(((Date.now() - startTime) / 1000).toFixed(2));
      setIsGenerating(false);
    }, Math.random() * 2000 + 1000);
  };

  const downloadQR = () => {
    if (!qrCode) return;
    
    const btn = document.querySelector('.download-btn');
    btn?.classList.add('downloading');
    
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = "qr-code.png";
    link.click();

    setTimeout(() => {
      btn?.classList.remove('downloading');
    }, 1500);
  };

  const shareQR = async () => {
    if (!qrCode) return;
    
    const btn = document.querySelector('.share-btn');
    btn?.classList.add('sharing');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QR Code",
          text: "",
          url: qrCode
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(qrCode);
      showToast("QR code URL copied to clipboard!");
    }
    
    setTimeout(() => {
      btn?.classList.remove('sharing');
    }, 1000);
  };

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('toast-show'), 100);
    
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    if (qrCode) {
      setQrCode("");
      setShowQR(false);
    }
  };

  return (
    <div className="qr-container">
      {/* Header */}
      <header className="header slide-down">
        <div className="header-content">
          <div className="logo">
            <div className="">
            </div>
            <span className="logo-text">QRGenerator</span>
          </div>
          <nav className="nav">
            <a href="/">
              <button className="nav-button hover-lift">Homepage</button>
            </a>
          </nav>
        </div>
      </header>

      <div className="main-container">
        {/* Left Panel */}
        <div className="panel left-panel slide-up">
          <h1 className="title fade-in">สร้าง QR code</h1>
          
          <div className="form-container">
            <div className="input-group">
              <label className="label">ใส่ลิ้ง/ข้อความ</label>
              <input 
                type="text" 
                value={url}
                onChange={handleUrlChange}
                placeholder="djuzee-website.web.app"
                className={`input ${isFormValid ? 'valid' : ''}`}
              />
              <p className="help-text">สร้าง QR Code แบบง่ายๆ</p>
            </div>

            <button 
              className={`generate-btn ${isGenerating ? 'generating' : ''} ${isFormValid ? 'ready' : ''}`}
              onClick={generateQR}
              disabled={isGenerating}
            >
              <span className={`icon ${isGenerating ? 'spinning' : ''}`}>
                {isGenerating ? '⟳' : ''}
              </span>
              <span>{isGenerating ? 'กำลังสร้าง QR Code' : 'กดเพื่อสร้าง QR Code'}</span>
              {isGenerating && <div className="loading-bar"></div>}
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="panel right-panel slide-up delay-1">
          <h2 className="title fade-in">QR Code</h2>
          
          <div className="qr-display">
            {qrCode ? (
              <div className={`qr-result ${showQR ? 'show' : ''}`}>
                <div className="qr-image-container">
                  <div className="qr-background pulse"></div>
                  <div className="qr-content">
                    <div className="qr-wrapper scale-in">
                      <img 
                        src={qrCode} 
                        alt="Generated QR Code"
                        className={`qr-image ${showQR ? 'qr-animate' : ''}`}
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                <div className={`result-actions ${showQR ? 'fade-in-up' : ''}`}>
                  <p className="generation-time">
                    ใช้เวลา <span className="highlight">{generationTime}</span> วินาทีในการสร้าง
                  </p>
                  
                  <div className="action-buttons">
                    <button className="download-btn hover-lift" onClick={downloadQR}>
                      <span className="btn-icon"></span>
                      <span>Download</span>
                    </button>
                    
                    <button className="share-btn hover-lift" onClick={shareQR}>
                      <span className="btn-icon"></span>
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="qr-placeholder">
                <div className="placeholder-icon floating">
                </div>
                <p className="placeholder-text">QR Code จะแสดงตรงนี้</p>
                <p className="placeholder-subtext">ใส่ลิ้งหรือข้อความเพื่อสร้าง</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}