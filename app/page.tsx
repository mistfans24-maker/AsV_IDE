"use client";

import { useEffect, useState } from "react";

const sketch = `#include <WiFi.h>

constexpr int STATUS_LED = 2;

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
  Serial.println("AsV node online");
}

void loop() {
  digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  delay(500);
}`;

const glyphs = "リ∆⟟꙰ꖎ⚚ᔑ╎ᓭ⍊ᒷℸ ̣ᓵᓵ∴ ̇/⍑ᒲᓭ↸!¡⚍⊣";

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [active, setActive] = useState("Explorer");
  const [connected, setConnected] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [pluginOpen, setPluginOpen] = useState(false);
  const [glyphLine, setGlyphLine] = useState("");
  const [code, setCode] = useState(sketch);

  useEffect(() => {
    const makeGlyphs = () => setGlyphLine(Array.from({ length: 24 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(""));
    makeGlyphs();
    const characterTimer = window.setInterval(makeGlyphs, 100);
    const bootTimer = window.setTimeout(() => setBooting(false), 2100);
    return () => { window.clearInterval(characterTimer); window.clearTimeout(bootTimer); };
  }, []);

  if (booting) return (
    <main className="boot-screen">
      <div className="boot-mark">A<span>V</span></div>
      <div className="boot-name">AsV_IDE</div>
      <div className="glyph-line">{glyphLine}</div>
      <div className="boot-loader"><i /></div>
      <p>INITIALIZING ESP WORKSPACE</p>
    </main>
  );

  return (
    <main className="ide-shell">
      <header className="topbar">
        <div className="brand"><b>A<span>V</span></b><strong>AsV_IDE</strong><em>BUILD WITHOUT LIMITS</em></div>
        <div className="project-pill"><span className="dot" /> blink_node.ino <kbd>⌘ S</kbd></div>
        <div className="top-actions">
          <button className="board-pill">ESP32 DevKit V1 <span>⌄</span></button>
          <button className={connected ? "connect connected" : "connect"} onClick={() => setConnected(!connected)}>{connected ? "● Connected" : "Connect device"}</button>
          <button className="avatar">AR</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="activity-bar">
          {[
            ["⌘", "Explorer"], ["⌕", "Search"], ["⑂", "Source"], ["▣", "Extensions"], ["◈", "Device"],
          ].map(([icon, label]) => <button key={label} title={label} onClick={() => setActive(label)} className={active === label ? "active" : ""}>{icon}</button>)}
          <button className="settings" title="Settings">⚙</button>
        </aside>
        <aside className="side-panel">
          <div className="panel-heading">{active.toUpperCase()} <button>•••</button></div>
          {active === "Extensions" ? <Plugins onClose={() => setPluginOpen(true)} /> : <Explorer />}
          <div className="side-bottom"><span>◉ ESP-IDF v5.3</span><span>◉ Arduino Core 3.0</span></div>
        </aside>
        <section className="editor-area">
          <div className="editor-tabs"><button className="file-tab">⌘ &nbsp; blink_node.ino <span>×</span></button><button>+</button></div>
          <div className="crumbs">AsV_IDE &nbsp;/&nbsp; projects &nbsp;/&nbsp; blink-node &nbsp;/&nbsp; <b>blink_node.ino</b></div>
          <div className="editor-wrap">
            <ol className="line-numbers">{Array.from({length: 16}, (_, i) => <li key={i}>{i + 1}</li>)}</ol>
            <textarea aria-label="Code editor" spellCheck="false" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div className="editor-status"><span>Ln 1, Col 1</span><span>Spaces: 2</span><span>UTF-8</span><span>C++</span><span>ESP32</span></div>
        </section>
        <aside className="inspector">
          <div className="inspector-head"><span>DEVICE PULSE</span><span className={connected ? "pulse online" : "pulse"}>{connected ? "ONLINE" : "WAITING"}</span></div>
          <div className="device-card"><div className="chip-art">ESP<br/><b>32</b></div><h3>{connected ? "ESP32 DevKit V1" : "No device attached"}</h3><p>{connected ? "COM3 · 115200 baud" : "Connect by USB or Wi‑Fi"}</p><button onClick={() => setConnected(!connected)}>{connected ? "Disconnect" : "Find device"}</button></div>
          <div className="metrics"><Metric label="FLASH" value="1.2 / 4 MB" width="30%" /><Metric label="HEAP" value="281 KB" width="68%" /><Metric label="CPU" value="240 MHz" width="88%" /></div>
          <button className="ai-card" onClick={() => setAiOpen(true)}><span>✦</span><div><b>AsV Intelligence</b><small>Ask, fix, optimize code</small></div><i>→</i></button>
        </aside>
      </section>
      <section className="terminal"><div className="terminal-bar"><div><b>TERMINAL</b><span>OUTPUT</span><span>PROBLEMS <i>0</i></span><span>SERIAL MONITOR</span></div><button>⌄</button></div><div className="terminal-body"><p><b>›</b> Ready to compile <span>blink-node</span> for ESP32 DevKit V1</p><p><b>›</b> Plugin host initialized — 12 extensions available</p><p className="muted">Connect a board to begin live serial output.</p></div></section>
      <footer><div><span className="sync">↻</span> main* &nbsp; <span>◉</span> 0 errors &nbsp; 0 warnings</div><div>ESP32 &nbsp; | &nbsp; UTF-8 &nbsp; | &nbsp; Turbo build engine <b>⚡</b></div></footer>
      <button className="fab" onClick={() => setPluginOpen(true)}>✦ <span>Plugin hub</span></button>
      {aiOpen && <AiModal onClose={() => setAiOpen(false)} />}
      {pluginOpen && <PluginModal onClose={() => setPluginOpen(false)} />}
    </main>
  );
}

function Explorer() { return <><div className="tree-title">▾ BLINK-NODE <button>+</button></div><div className="tree-file selected">⌘ &nbsp; blink_node.ino</div><div className="tree-file">▱ &nbsp; platformio.ini</div><div className="tree-file">▣ &nbsp; README.md</div><div className="tree-title closed">› LIBRARIES</div><div className="tree-title closed">› EXAMPLES</div></>; }
function Plugins({onClose}:{onClose:()=>void}) { return <div className="plugin-mini"><p>Make your workflow yours.</p><div><b>✦ Gemini Assist</b><small>AI completion & review</small><button>Active</button></div><div><b>◉ Serial Studio</b><small>Visual telemetry</small><button>Active</button></div><button className="browse" onClick={onClose}>Browse plugin hub →</button></div>; }
function Metric({label,value,width}:{label:string,value:string,width:string}) { return <div className="metric"><div><span>{label}</span><b>{value}</b></div><i><em style={{width}} /></i></div>; }
function AiModal({onClose}:{onClose:()=>void}) { return <div className="modal-back"><section className="modal ai-modal"><button className="modal-close" onClick={onClose}>×</button><div className="modal-icon">✦</div><h2>Connect Gemini</h2><p>Use Gemini to explain, generate, and improve your ESP32 code.</p><label>GEMINI API KEY<input type="password" placeholder="Paste your API key" /></label><small>Your key stays in this browser for this demo. In a production app, keep API keys on your own server—never commit them to GitHub.</small><button className="primary" onClick={onClose}>Save connection</button></section></div>; }
function PluginModal({onClose}:{onClose:()=>void}) { return <div className="modal-back"><section className="modal plugin-modal"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">EXTENSION MARKETPLACE</span><h2>Build your perfect setup.</h2><p>Extend AsV_IDE with tools for hardware, automation, and AI.</p>{[["✦","Gemini Assist","Inline code completion and refactoring"],["◉","Serial Studio","Charts and inspectable live telemetry"],["◫","Home Assistant","Device discovery and YAML helpers"]].map(([a,b,c])=><div className="market-item" key={b}><span>{a}</span><div><b>{b}</b><small>{c}</small></div><button>Install</button></div>)}</section></div>; }
