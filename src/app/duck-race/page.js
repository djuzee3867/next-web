"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import "./page.css";

const DUCK_COLORS = [
  "#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#9B59B6",
  "#FF8C42", "#00BCD4", "#E91E63", "#8BC34A", "#FF5722"
];

const MEDALS = ["🥇", "🥈", "🥉"];

function getPositionLabel(i) {
  if (i < 3) return MEDALS[i];
  return `${i + 1}`;
}

export default function DuckRacePage() {
  const [isDark, setIsDark] = useState(true);
  const [duckCount, setDuckCount] = useState(4);
  const [names, setNames] = useState(() =>
    Array.from({ length: 4 }, (_, i) => `เป็ด ${i + 1}`)
  );

  // Game states: "idle" | "countdown" | "racing" | "finished"
  const [gameState, setGameState] = useState("idle");
  const [countdownNum, setCountdownNum] = useState(3);
  const [positions, setPositions] = useState(() =>
    Array.from({ length: 4 }, () => 0)
  );
  const [finishOrder, setFinishOrder] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [confetti, setConfetti] = useState([]);

  const speedsRef = useRef([]);
  const animFrameRef = useRef(null);
  const positionsRef = useRef([]);
  const finishOrderRef = useRef([]);
  const finishLineRef = useRef(85); // percentage of track width

  // Update names array when duck count changes
  useEffect(() => {
    setNames((prev) => {
      const next = Array.from({ length: duckCount }, (_, i) =>
        prev[i] !== undefined ? prev[i] : `เป็ด ${i + 1}`
      );
      return next;
    });
    setPositions(Array.from({ length: duckCount }, () => 0));
    positionsRef.current = Array.from({ length: duckCount }, () => 0);
  }, [duckCount]);

  const handleNameChange = (index, value) => {
    setNames((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  // --- Countdown then race ---
  const startRace = useCallback(() => {
    // Reset
    const initialPos = Array.from({ length: duckCount }, () => 0);
    setPositions(initialPos);
    positionsRef.current = [...initialPos];
    finishOrderRef.current = [];
    setFinishOrder([]);
    setShowModal(false);
    setConfetti([]);
    speedsRef.current = Array.from({ length: duckCount }, () => 0.3 + Math.random() * 0.3);

    // Countdown
    setGameState("countdown");
    setCountdownNum(3);

    let count = 3;
    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNum(count);
      } else if (count === 0) {
        setCountdownNum(0); // "GO!"
      } else {
        clearInterval(countInterval);
        setGameState("racing");
        beginRace();
      }
    }, 700);
  }, [duckCount]);

  const beginRace = useCallback(() => {
    const raceLoop = () => {
      const newPositions = [...positionsRef.current];
      let allFinished = finishOrderRef.current.length >= newPositions.length;

      for (let i = 0; i < newPositions.length; i++) {
        // Skip already finished ducks
        if (finishOrderRef.current.includes(i)) continue;

        // Random acceleration/deceleration
        const accel = (Math.random() - 0.45) * 0.15;
        speedsRef.current[i] = Math.max(0.1, Math.min(1.2, speedsRef.current[i] + accel));
        newPositions[i] += speedsRef.current[i];

        // Check finish
        if (newPositions[i] >= finishLineRef.current) {
          newPositions[i] = finishLineRef.current;
          finishOrderRef.current = [...finishOrderRef.current, i];
        }
      }

      positionsRef.current = newPositions;
      setPositions([...newPositions]);

      allFinished = finishOrderRef.current.length >= newPositions.length;

      if (allFinished) {
        setFinishOrder([...finishOrderRef.current]);
        setGameState("finished");
        // Delay modal to show the finish
        setTimeout(() => {
          setShowModal(true);
          spawnConfetti();
        }, 600);
        return;
      }

      // Check if first duck finished (show partial results)
      if (finishOrderRef.current.length > 0) {
        setFinishOrder([...finishOrderRef.current]);
      }

      animFrameRef.current = requestAnimationFrame(raceLoop);
    };

    animFrameRef.current = requestAnimationFrame(raceLoop);
  }, []);

  const resetRace = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    const initialPos = Array.from({ length: duckCount }, () => 0);
    setPositions(initialPos);
    positionsRef.current = [...initialPos];
    finishOrderRef.current = [];
    setFinishOrder([]);
    setGameState("idle");
    setShowModal(false);
    setConfetti([]);
  }, [duckCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // --- Confetti ---
  const spawnConfetti = () => {
    const colors = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#9B59B6", "#FF8C42", "#00BCD4", "#E91E63", "#FFD700", "#FF5722"];
    const pieces = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 1.5,
      size: 6 + Math.random() * 10,
      shape: Math.random() > 0.5 ? "circle" : "rect",
    }));
    setConfetti(pieces);
    // Clear confetti after animation
    setTimeout(() => setConfetti([]), 5000);
  };

  const isRaceActive = gameState === "countdown" || gameState === "racing";
  const winnerIndex = finishOrder.length > 0 ? finishOrder[0] : null;

  return (
    <div className={`duck-race ${isDark ? "theme-dark" : "theme-light"}`}>
      {/* ===== RACE AREA ===== */}
      <div className="race-area">
        {/* Sky */}
        <div className="sky-layer">
          <div className="sun" />
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>

        {/* Water + Lanes */}
        <div className="water-area">
          <div className="water-ripple">
            <div className="ripple-wave" />
            <div className="ripple-wave" />
          </div>

          {/* Finish line */}
          <div className="finish-line" style={{ right: `${100 - finishLineRef.current}%` }}>
            <div className="finish-flag">🏁</div>
          </div>

          {/* Lanes */}
          <div className="lanes-container">
            {Array.from({ length: duckCount }, (_, i) => (
              <div className="lane" key={i}>
                <div className="lane-number">{i + 1}</div>

                {/* Duck */}
                <div
                  className={`duck-runner ${
                    gameState === "racing" ? "racing" : ""
                  } ${
                    gameState === "finished" && winnerIndex === i
                      ? "winner-duck"
                      : ""
                  }`}
                  style={{
                    left: `calc(${positions[i]}% + 40px)`,
                  }}
                >
                  {/* Splash */}
                  <div className="splash">
                    <div className="splash-drop" />
                    <div className="splash-drop" />
                    <div className="splash-drop" />
                  </div>

                  {/* Name tag */}
                  <div className="duck-name-tag">
                    {names[i] || `เป็ด ${i + 1}`}
                  </div>

                  {/* Duck emoji with color filter */}
                  <div className="duck-color-wrapper">
                    <span
                      className="duck-emoji"
                      style={{
                        filter: `drop-shadow(2px 2px 3px rgba(0,0,0,0.3)) hue-rotate(${
                          i * 36
                        }deg)`,
                      }}
                    >
                      🦆
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Countdown overlay */}
          {gameState === "countdown" && (
            <div className="countdown-overlay">
              {countdownNum > 0 ? (
                <div className="countdown-number" key={countdownNum}>
                  {countdownNum}
                </div>
              ) : (
                <div className="countdown-number countdown-go" key="go">
                  GO!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== SIDEBAR ===== */}
      <div className="duck-sidebar">
        <div className="sidebar-header">
          <h2>🦆 Duck Race</h2>
          <button
            className="theme-toggle"
            onClick={() => setIsDark(!isDark)}
            title="สลับโหมด"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>

        {/* Duck count */}
        <div className="control-group">
          <span className="control-label">จำนวนเป็ด</span>
          <div className="duck-count-control">
            <button
              className="count-btn"
              onClick={() => setDuckCount((c) => Math.max(2, c - 1))}
              disabled={duckCount <= 2 || isRaceActive}
            >
              −
            </button>
            <span className="count-display">{duckCount}</span>
            <input
              type="range"
              className="count-slider"
              min={2}
              max={10}
              value={duckCount}
              onChange={(e) => setDuckCount(Number(e.target.value))}
              disabled={isRaceActive}
            />
            <button
              className="count-btn"
              onClick={() => setDuckCount((c) => Math.min(10, c + 1))}
              disabled={duckCount >= 10 || isRaceActive}
            >
              +
            </button>
          </div>
        </div>

        {/* Duck names */}
        <div className="control-group" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <span className="control-label">ชื่อเป็ด</span>
          <div className="names-list">
            {Array.from({ length: duckCount }, (_, i) => (
              <div className="name-row" key={i}>
                <div
                  className="name-color-dot"
                  style={{ background: DUCK_COLORS[i % DUCK_COLORS.length] }}
                />
                <input
                  className="name-input"
                  value={names[i] || ""}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  placeholder={`เป็ด ${i + 1}`}
                  disabled={isRaceActive}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="action-buttons">
          {gameState === "idle" && (
            <button className="play-btn" onClick={startRace}>
              <span>▶</span> เริ่มแข่ง!
            </button>
          )}
          {gameState === "racing" && (
            <button className="play-btn" disabled>
              <span>🏊</span> กำลังแข่ง...
            </button>
          )}
          {gameState === "countdown" && (
            <button className="play-btn" disabled>
              <span>⏳</span> เตรียมตัว...
            </button>
          )}
          {gameState === "finished" && (
            <>
              <button className="play-btn" onClick={startRace}>
                <span>🔄</span> แข่งใหม่!
              </button>
              <button className="reset-btn" onClick={resetRace}>
                <span>↩</span> รีเซ็ต
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== WINNER MODAL ===== */}
      {showModal && finishOrder.length > 0 && (
        <div className="winner-overlay" onClick={() => setShowModal(false)}>
          <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
            <div className="trophy-icon">🏆</div>
            <p className="winner-label">ผู้ชนะคือ...</p>
            <h1 className="winner-name">
              {names[finishOrder[0]] || `เป็ด ${finishOrder[0] + 1}`}
            </h1>
            <div className="winner-duck-display">🦆</div>

            {/* Positions */}
            <div className="winner-positions">
              {finishOrder.map((duckIdx, rank) => (
                <div className="position-row" key={duckIdx}>
                  <span className="position-medal">
                    {getPositionLabel(rank)}
                  </span>
                  <span className="position-name">
                    {names[duckIdx] || `เป็ด ${duckIdx + 1}`}
                  </span>
                </div>
              ))}
            </div>

            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ===== CONFETTI ===== */}
      {confetti.length > 0 && (
        <div className="confetti-container">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: piece.shape === "rect" ? `${piece.size * 0.6}px` : `${piece.size}px`,
                background: piece.color,
                borderRadius: piece.shape === "circle" ? "50%" : "2px",
                animationDuration: `${piece.duration}s`,
                animationDelay: `${piece.delay}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
