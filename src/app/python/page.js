"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./python.css";

// Stable, module-scoped editor to avoid remounting on each render
function EditorWithGutter({ code, setCode, codeLines, editorWrap, editorFont, editorSize, onResize }) {
  const taRef = useRef(null);
  const gutRef = useRef(null);
  const shellRef = useRef(null);
  const dragStateRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  useEffect(() => {
    const ta = taRef.current;
    const g = gutRef.current;
    if (!ta || !g) return;
    const onScroll = () => { g.scrollTop = ta.scrollTop; };
    ta.addEventListener('scroll', onScroll);
    return () => ta.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!onResize) return;
    if (!shellRef.current) return;
    if (editorSize && editorSize.width && editorSize.height) return;
    const rect = shellRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    onResize({ width: Math.max(320, Math.round(rect.width)), height: Math.max(260, Math.round(rect.height)) });
  }, [editorSize, onResize]);

  const digits = String(codeLines.length).length;
  const approxDigitPx = Math.max(8, Math.round(editorFont * 0.6));
  const gutterWidth = Math.max(3, digits + 1) * approxDigitPx; // px
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const state = dragStateRef.current;
      if (!state || !onResize) return;
      const { dir, startX, startY, startWidth, startHeight } = state;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      let width = startWidth;
      let height = startHeight;
      if (dir.includes('e')) width = Math.max(320, startWidth + dx);
      if (dir.includes('s')) height = Math.max(260, startHeight + dy);
      if (dir.includes('w')) width = Math.max(320, startWidth - dx);
      if (dir.includes('n')) height = Math.max(260, startHeight - dy);
      onResize({ width: Math.round(width), height: Math.round(height) });
    };
    const onUp = () => {
      dragStateRef.current = null;
      setDragging(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, onResize]);

  const beginResize = (dir) => (e) => {
    if (!shellRef.current) return;
    e.preventDefault();
    dragStateRef.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: shellRef.current.offsetWidth || 0,
      startHeight: shellRef.current.offsetHeight || 0,
    };
    setDragging(dir);
  };

  const shellStyle = { fontSize: `${editorFont}px` };
  if (editorSize && editorSize.width) shellStyle.width = editorSize.width;
  if (editorSize && editorSize.height) shellStyle.height = editorSize.height;
  return (
    <div className="editor-shell" ref={shellRef} style={shellStyle} data-dragging={dragging ? dragging : undefined}>
      <div className="editor-resize-handle handle-n" onPointerDown={beginResize('n')} />
      <div className="editor-resize-handle handle-s" onPointerDown={beginResize('s')} />
      <div className="editor-resize-handle handle-e" onPointerDown={beginResize('e')} />
      <div className="editor-resize-handle handle-w" onPointerDown={beginResize('w')} />
      <div className="editor-resize-handle handle-ne" onPointerDown={beginResize('ne')} />
      <div className="editor-resize-handle handle-nw" onPointerDown={beginResize('nw')} />
      <div className="editor-resize-handle handle-se" onPointerDown={beginResize('se')} />
      <div className="editor-resize-handle handle-sw" onPointerDown={beginResize('sw')} />
      <div
        className="editor-gutter"
        ref={gutRef}
        style={{ width: `${gutterWidth}px` }}
        aria-hidden
      >
        {codeLines.map((_, i) => (
          <div key={i} className="gut-line">{i + 1}</div>
        ))}
      </div>
      <textarea
        ref={taRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        className={`editor ${editorWrap ? 'wrap' : ''}`}
        aria-label="Python code editor"
      />
    </div>
  );
}

export default function PythonVisualizerPage() {
  const [pyodide, setPyodide] = useState(null);
  const [loadingPyodide, setLoadingPyodide] = useState(true);
  const [code, setCode] = useState(`def fib(n):
    a, b = 0, 1
    seq = []
    for _ in range(n):
        seq.append(a)
        a, b = b, a + b
    return seq

nums = fib(6)
print("fib:", nums)
total = sum(nums)
print("total:", total)
`);
  const [events, setEvents] = useState([]);
  const [current, setCurrent] = useState(0);
  const [runError, setRunError] = useState("");
  const [running, setRunning] = useState(false);
  // Single editor view (Preview removed)
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [tutorReady, setTutorReady] = useState(false);
  const [rawInputs, setRawInputs] = useState([]);
  const rawInputsRef = useRef([]);
  const vizResizeObserverRef = useRef(null);
  const vizObservedHostRef = useRef(null);
  const vizPointerUpHandlerRef = useRef(null);
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [showContent, setShowContent] = useState(false);
  const [editorWrap, setEditorWrap] = useState(true);
  const [editorFont, setEditorFont] = useState(14);
  const [editorSize, setEditorSize] = useState({ width: 0, height: 0 });

  // Load Pyodide on client
  useEffect(() => {
    // entrance effect
    const t = setTimeout(() => setShowContent(true), 20);
    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js";
    script.async = true;
    script.onload = async () => {
      try {
        const py = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        });
        if (cancelled) return;
        setPyodide(py);
        const tracer = `
import sys, json, builtins, types

MAX_NODES = 200
MAX_DEPTH = 3
MAX_ITEMS = 50
MAX_REPR = 140

def _short_repr(v):
    try:
        r = repr(v)
    except Exception:
        r = f'<{type(v).__name__}>'
    if len(r) > MAX_REPR:
        r = r[:MAX_REPR] + '…'
    return r

def _is_primitive(v):
    return isinstance(v, (int, float, str, bool, type(None)))

class _StdoutCatcher:
    def __init__(self, buf):
        self.buf = buf
    def write(self, s):
        self.buf.append(s)
    def flush(self):
        pass

def run_with_trace(code_str):
    events = []
    g = {'__name__': '__main__'}
    stdout = []
    old_stdout = sys.stdout
    sys.stdout = _StdoutCatcher(stdout)

    def walk_stack(f):
        # Collect frames bottom->top limited to user code
        chain = []
        while f is not None:
            if f.f_code.co_filename == '<user_code>':
                chain.append(f)
            f = f.f_back
        chain.reverse()
        return chain

    def snapshot(frame, event, arg):
        # Build heap & stack snapshot
        node_count = 0
        heap = {}
        seen = {}

        def refify(v, depth=0):
            nonlocal node_count
            if _is_primitive(v):
                return v
            oid = id(v)
            key = f'id{oid}'
            if key in seen:
                return {'$ref': key}
            if node_count >= MAX_NODES or depth >= MAX_DEPTH:
                return _short_repr(v)
            seen[key] = True
            node_count += 1
            data = {'type': type(v).__name__, 'repr': _short_repr(v)}
            try:
                if isinstance(v, (list, tuple, set, frozenset)):
                    it = list(v)[:MAX_ITEMS]
                    data['items'] = [refify(x, depth+1) for x in it]
                elif isinstance(v, dict):
                    ent = list(v.items())[:MAX_ITEMS]
                    kv = []
                    for k, val in ent:
                        # keys: try keep primitive else repr
                        kk = k if _is_primitive(k) else _short_repr(k)
                        kv.append([kk, refify(val, depth+1)])
                    data['entries'] = kv
                elif isinstance(v, types.ModuleType):
                    pass
                elif hasattr(v, '__dict__'):
                    ent = list(v.__dict__.items())[:MAX_ITEMS]
                    kv = []
                    for k, val in ent:
                        if k.startswith('__') and k.endswith('__'):
                            continue
                        kv.append([k, refify(val, depth+1)])
                    data['attrs'] = kv
                # else: leave repr only
            except Exception:
                pass
            heap[key] = data
            return {'$ref': key}

        stack_out = []
        for fr in walk_stack(frame):
            loc_out = {}
            for k, v in fr.f_locals.items():
                if k.startswith('__') and k.endswith('__'):
                    continue
                try:
                    loc_out[k] = refify(v)
                except Exception:
                    loc_out[k] = _short_repr(v)
            stack_out.append({
                'func': fr.f_code.co_name,
                'line': fr.f_lineno,
                'locals': loc_out,
            })

        ev = {
            'event': event,
            'line': frame.f_lineno,
            'stack': stack_out,
            'heap': heap,
            'stdout': ''.join(stdout)
        }
        if event == 'return':
            try:
                ev['return'] = refify(arg)
            except Exception:
                ev['return'] = _short_repr(arg)
        return ev

    def tracer(frame, event, arg):
        if event not in ('call', 'line', 'return'):
            return tracer
        if frame.f_code.co_filename != '<user_code>':
            return tracer
        events.append(snapshot(frame, event, arg))
        return tracer

    sys.settrace(tracer)
    try:
        compiled = compile(code_str, '<user_code>', 'exec')
        exec(compiled, g, g)
        status = 'ok'
        error = None
    except Exception as e:
        status = 'error'
        error = repr(e)
    finally:
        sys.settrace(None)
        sys.stdout = old_stdout
    return json.dumps({'status': status, 'events': events, 'error': error, 'stdout': ''.join(stdout)})
`;
        await py.runPythonAsync(tracer);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadingPyodide(false);
      }
    };
    document.body.appendChild(script);
    return () => {
      cancelled = true;
      try { document.body.removeChild(script); } catch {}
      clearTimeout(t);
    };
  }, []);

  function ripple(e) {
    const target = e.currentTarget;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.2;
    const x = (e.clientX ?? rect.width / 2) - rect.left;
    const y = (e.clientY ?? rect.height / 2) - rect.top;
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;
    span.style.left = `${x - size / 2}px`;
    span.style.top = `${y - size / 2}px`;
    target.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  }

  const hasEvents = events && events.length > 0;

  // Python Tutor 
  const pgLoggerLoadedRef = useRef(false);
  const tutorAssetsLoadedRef = useRef(false);

  async function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) return resolve();
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(new Error(`Failed to load ${src}`));
      document.body.appendChild(s);
    });
  }
  async function loadCssOnce(href) {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = href;
    document.head.appendChild(l);
  }

  async function ensureTutorAssets() {
    if (tutorAssetsLoadedRef.current) return;
    const localBase = '/pythontutor/v3';
    const remoteBase = 'https://raw.githubusercontent.com/pathrise-eng/pathrise-python-tutor/master/v3';
    const base = (process.env.NODE_ENV === 'production') ? localBase : localBase; // prefer local always
    const fall = remoteBase;
    async function tryLoad(loader, path) {
      try { await loader(`${base}${path}`); }
      catch { await loader(`${fall}${path}`); }
    }
    await tryLoad(loadCssOnce, `/js/jquery-ui-1.11.4/jquery-ui.css`);
    await tryLoad(loadCssOnce, `/css/jquery.qtip.css`);
    await tryLoad(loadCssOnce, `/css/pytutor.css`);
    // must keep order due to globals
    await tryLoad(loadScriptOnce, `/js/d3.v2.min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery-1.8.2.min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery.ba-bbq.min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery.ba-dotimeout.min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery.corner.js`);
    await tryLoad(loadScriptOnce, `/js/jquery-ui-1.11.4/jquery-ui.min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery.jsPlumb-1.3.10-all-min.js`);
    await tryLoad(loadScriptOnce, `/js/jquery.qtip.min.js`);
    await tryLoad(loadScriptOnce, `/js/pytutor.js`);
    tutorAssetsLoadedRef.current = true;
  }

  async function ensurePgLogger() {
    if (!pyodide) return;
    if (pgLoggerLoadedRef.current) return;
    // load modules directly into sys.modules to satisfy imports
    const localEnc = '/pythontutor/v3/pg_encoder.py';
    const localLog = '/pythontutor/v3/pg_logger.py';
    const remoteEnc = 'https://raw.githubusercontent.com/pathrise-eng/pathrise-python-tutor/master/v3/pg_encoder.py';
    const remoteLog = 'https://raw.githubusercontent.com/pathrise-eng/pathrise-python-tutor/master/v3/pg_logger.py';
    async function getText(url, fallback) { try { const r = await fetch(url); if (!r.ok) throw new Error(); return await r.text(); } catch { const rr = await fetch(fallback); return await rr.text(); } }
    const [encSrc, logSrc] = await Promise.all([
      getText(localEnc, remoteEnc),
      getText(localLog, remoteLog),
    ]);
    const pythonLoader = `
import sys, types
m_enc = types.ModuleType('pg_encoder');
exec(compile(${JSON.stringify(''+"" )} or '', '<loader>', 'exec'))
`;
    // Due to string escaping complexity in template literal, we will set content via globals
    pyodide.globals.set('___enc_src___', encSrc);
    pyodide.globals.set('___log_src___', logSrc);
    await pyodide.runPythonAsync(`
import sys, types
# stub optional custom modules used by pg_logger so imports don't fail
for _name in ('callback_module','ttt_module','html_module','htmlexample_module','matrix','htmlFrame'):
    if _name not in sys.modules:
        sys.modules[_name] = types.ModuleType(_name)

m_enc = types.ModuleType('pg_encoder')
exec(___enc_src___, m_enc.__dict__)
sys.modules['pg_encoder'] = m_enc

m_log = types.ModuleType('pg_logger')
exec(___log_src___, m_log.__dict__)
sys.modules['pg_logger'] = m_log
`);
    pgLoggerLoadedRef.current = true;
  }

  async function runWithTutor(resume = false, inputsOverride = null) {
    if (!pyodide) return;
    setRunning(true);
    setRunError("");
    try {
      await ensureTutorAssets();
      await ensurePgLogger();
      // Build Python Tutor trace using pg_logger within Pyodide
      // decide which inputs to use: fresh run => [], resume => existing + override
      const inputs = resume ? (inputsOverride || rawInputsRef.current || []) : [];
      if (!resume) {
        rawInputsRef.current = [];
        setRawInputs([]); // clear inputs on fresh run
      }
      pyodide.globals.set('___code_str___', code);
      pyodide.globals.set('___raw_inputs___', JSON.stringify(inputs));
      const jsonStr = await pyodide.runPythonAsync(`
import json, sys
import pg_logger
trace = pg_logger.exec_script_str_local(___code_str___, ___raw_inputs___, False, False, lambda cod, tr: tr)
json.dumps({'code': ___code_str___, 'trace': trace})
`);
      const data = JSON.parse(jsonStr);
      const host = document.getElementById('opt-viz');
      if (vizObservedHostRef.current && vizPointerUpHandlerRef.current) {
        try { vizObservedHostRef.current.removeEventListener('pointerup', vizPointerUpHandlerRef.current); } catch {}
        vizObservedHostRef.current = null;
        vizPointerUpHandlerRef.current = null;
      }
      if (host) host.innerHTML = '';
      const safeData = Array.isArray(data.trace) ? data : { code, trace: [] };
      const viz = new window.ExecutionVisualizer('opt-viz', safeData, {
        startingInstruction: 0,
        executeCodeWithRawInputFunc: (rawInputStr /*, curInstr */) => {
          const v = rawInputStr == null ? '' : String(rawInputStr);
          const base = Array.isArray(rawInputsRef.current) ? rawInputsRef.current : [];
          const nextInputs = [...base, v];
          rawInputsRef.current = nextInputs;
          setRawInputs(nextInputs);
          setAwaitingInput(false);
          runWithTutor(true, nextInputs);
        },
      });
      try {
        window.myVisualizer = viz;
        setTimeout(() => { try { viz.redrawConnectors(); } catch {} }, 0);
        if (window.myVizResizeHandler) {
          window.removeEventListener('resize', window.myVizResizeHandler);
        }
        window.myVizResizeHandler = () => { try { window.myVisualizer && window.myVisualizer.redrawConnectors(); } catch {} };
        window.addEventListener('resize', window.myVizResizeHandler);
        if (vizResizeObserverRef.current) {
          try { vizResizeObserverRef.current.disconnect(); } catch {}
          vizResizeObserverRef.current = null;
        }
        if (typeof ResizeObserver !== 'undefined' && host) {
          const ro = new ResizeObserver(() => {
            try { viz.redrawConnectors(); } catch {}
          });
          const watchTargets = [
            host,
            host.querySelector('.executionVisualizer'),
            host.querySelector('#dataViz'),
            host.querySelector('#pyOutputPane'),
            host.querySelector('#pyOutputPane textarea'),
            host.querySelector('.ui-resizable'),
          ].filter(Boolean);
          watchTargets.forEach((el) => {
            try { ro.observe(el); } catch {}
          });
          vizResizeObserverRef.current = ro;
        }
        if (host) {
          const onPointerUp = () => {
            try { viz.redrawConnectors(); } catch {}
          };
          host.addEventListener('pointerup', onPointerUp);
          vizObservedHostRef.current = host;
          vizPointerUpHandlerRef.current = onPointerUp;
        }
        // also check trace directly from viz to detect raw_input
        try {
          const t2 = Array.isArray(viz.curTrace) ? viz.curTrace : [];
          const last2 = t2.length ? t2[t2.length - 1] : null;
          if (last2 && last2.event === 'raw_input') {
            setAwaitingInput(true);
            setInputPrompt(String(last2.prompt || 'Input'));
          }
        } catch {}
      } catch {}
      setTutorReady(true);
      // detect raw_input request 
      try {
        const t = Array.isArray(safeData.trace) ? safeData.trace : [];
        const ri = [...t].reverse().find((e) => e && e.event === 'raw_input');
        if (ri) {
          setAwaitingInput(true);
          setInputPrompt(String(ri.prompt || 'Input'));
        } else {
          setAwaitingInput(false);
          setInputPrompt("");
        }
      } catch {}
      // previously switched to preview; now editor-only
    } catch (e) {
      setRunError(String(e));
    } finally {
      setRunning(false);
    }
  }

  async function submitInput() {
    if (!awaitingInput) return;
    const v = inputValue == null ? '' : String(inputValue);
    const base = Array.isArray(rawInputsRef.current) ? rawInputsRef.current : [];
    const nextInputs = [...base, v];
    rawInputsRef.current = nextInputs;
    setRawInputs(nextInputs);
    setInputValue("");
    // re-run new input
    setAwaitingInput(false);
    runWithTutor(true, nextInputs);
  }

  const stepPrev = () => setCurrent((i) => Math.max(0, i - 1));
  const stepNext = () => setCurrent((i) => Math.min((events.length || 1) - 1, i + 1));
  const updateEditorSize = useCallback((next) => {
    if (!next) return;
    setEditorSize((prev) => {
      const width = Math.max(320, Math.round((next.width ?? prev.width ?? 0)));
      const height = Math.max(260, Math.round((next.height ?? prev.height ?? 0)));
      if (prev.width === width && prev.height === height) return prev;
      return { width, height };
    });
  }, []);

  const reset = () => {
    setEvents([]);
    setCurrent(0);
    setRunError("");
    setAwaitingInput(false);
    setInputPrompt("");
    rawInputsRef.current = [];
    setRawInputs([]);
    setInputValue("");
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.myVizResizeHandler) {
        window.removeEventListener('resize', window.myVizResizeHandler);
        delete window.myVizResizeHandler;
      }
      if (vizResizeObserverRef.current) {
        try { vizResizeObserverRef.current.disconnect(); } catch {}
        vizResizeObserverRef.current = null;
      }
      if (vizObservedHostRef.current && vizPointerUpHandlerRef.current) {
        try { vizObservedHostRef.current.removeEventListener('pointerup', vizPointerUpHandlerRef.current); } catch {}
        vizObservedHostRef.current = null;
        vizPointerUpHandlerRef.current = null;
      }
    };
  }, []);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (!hasEvents) return;
      if (e.key === "ArrowLeft") stepPrev();
      if (e.key === "ArrowRight") stepNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hasEvents, events.length]);

  const codeLines = useMemo(() => code.split("\n"), [code]);

  

  // Python Tutor rendering entirely.

  const rootStyle = useMemo(() => {
    if (!editorSize.width) return undefined;
    const pad = 60;
    const width = Math.max(320, editorSize.width + pad);
    return { '--editor-panel-width': `${width}px` };
  }, [editorSize.width]);

  return (
    <div className={`py-root ${showContent ? 'show' : ''}`} style={rootStyle}>
      <header className="py-header">
        <div className="py-header-inner">
          <div className="brand">
            <span className="brand-name">djuzeePython Visualizer</span>
          </div>
          <nav className="py-nav">
            <a href="/" className="nav-btn">Linkpage</a>
          </nav>
        </div>
      </header>

      <main className="py-main">
        <section className="panel editor-panel">
          <div className="panel-header">
            {/* tabs removed */}
            <div className="status">
              {loadingPyodide ? (
                <span className="badge loading">กำลังโหลด Python</span>
              ) : pyodide ? (
                <span className="badge ok">พร้อมแล้ว</span>
              ) : (
                <span className="badge error">โหลด failed</span>
              )}
            </div>
          </div>

          <div className="editor-wrap">
              <div className="editor-toolbar">
                <div className="tool-group">
                  <label className="tool-label">ตัวอย่าง</label>
                  <select
                    className="tool-select"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === 'fib') {
                        setCode(`def fib(n):\n    a, b = 0, 1\n    out = []\n    for _ in range(n):\n        out.append(a)\n        a, b = b, a + b\n    return out\n\nprint(fib(10))`);
                      }
                      e.target.value = '';
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select…</option>
                    <option value="fib">For_loop</option>
                  </select>
                </div>
                <div className="tool-group">
                  <label className="tool-label">Font</label>
                  <input
                    type="range"
                    min={12}
                    max={20}
                    step={1}
                    value={editorFont}
                    onChange={(e) => setEditorFont(parseInt(e.target.value || '14', 10))}
                    className="tool-range"
                  />
                  <span className="tool-value">{editorFont}px</span>
                </div>
                <div className="tool-group">
                  <label className="tool-checkbox">
                    <input type="checkbox" checked={editorWrap} onChange={(e) => setEditorWrap(e.target.checked)} />
                    Wrap
                  </label>
                </div>
                <div className="tool-spacer" />
                <button className="mini-btn" onPointerDown={ripple} onClick={async () => { try { await navigator.clipboard.writeText(code); } catch {} }}>Copy</button>
                <button className="mini-btn" onPointerDown={ripple} onClick={async () => { try { const t = await navigator.clipboard.readText(); if (t) setCode(t); } catch {} }}>Paste</button>
                <button className="mini-btn danger" onPointerDown={ripple} onClick={() => setCode('')}>Clear</button>
              </div>
              <EditorWithGutter
                code={code}
                setCode={setCode}
                codeLines={codeLines}
                editorWrap={editorWrap}
                editorFont={editorFont}
                editorSize={editorSize}
                onResize={updateEditorSize}
              />
            </div>

          <div className="controls">
            <button className={`btn primary ${running ? 'busy' : ''}`} onPointerDown={ripple} onClick={() => runWithTutor(false)} disabled={!pyodide || loadingPyodide || running}>
              {running ? "Tracing..." : "Run (Python Tutor)"}
            </button>
            {awaitingInput && (
              <>
                <input
                  className="input prompt"
                  placeholder={inputPrompt || 'Input'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submitInput(); }}
                  aria-label="Program input"
                />
                <button className="btn attention" onPointerDown={ripple} onClick={submitInput} disabled={running || !pyodide}>Submit</button>
              </>
            )}
            <button className="btn" onPointerDown={ripple} onClick={reset} disabled={running}>Reset</button>
          </div>

          {runError && (
            <div className="callout error">
              <div className="callout-title">Error</div>
              <div className="callout-body">{runError}</div>
            </div>
          )}
        </section>

        <section className="panel inspect-panel">
          <div className="panel-header">
            <h2 className="panel-title">Python Tutor จาก pythontutor.com</h2>
            <div className="step-meta">
              {tutorReady ? <span className="meta">พร้อมแล้ว</span> : <span className="meta">กำลังรอ</span>}
            </div>
          </div>
          <div className="inspect-grid">
            <div className={`card tutor ${awaitingInput ? 'awaiting' : ''} ${tutorReady ? 'ready' : ''}`}>
              <div className="card-title">Visualization</div>
              <div className="card-body">
                <div id="opt-viz"></div>
                {awaitingInput && (
                  <div style={{marginTop: 12, display: 'flex', gap: 8, alignItems: 'center'}}>
                    <span style={{fontSize:12,color:'var(--muted)'}}>{inputPrompt || 'Input'}</span>
                    <input
                      className="input prompt"
                      placeholder={inputPrompt || 'Input'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submitInput(); }}
                      aria-label="Program input"
                    />
                    <button className="btn" onClick={submitInput} disabled={running || !pyodide}>Submit</button>
                  </div>
                )}
                {!tutorReady && <div className="empty">กด clear แล้ววางโค้ด</div>}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-footer">
      </footer>
    </div>
  );
}

