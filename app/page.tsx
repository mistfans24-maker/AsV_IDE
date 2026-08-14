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
const templates: Record<string, string> = {
  "Arduino C++": sketch,
  Python: "from machine import Pin\nfrom time import sleep\n\nled = Pin(2, Pin.OUT)\nwhile True:\n    led.toggle()\n    sleep(0.5)\n",
  Lua: "gpio.mode(4, gpio.OUTPUT)\n\ntmr.create():alarm(500, tmr.ALARM_AUTO, function()\n  gpio.write(4, gpio.read(4) == 0 and 1 or 0)\nend)\n",
  HTML: "<!doctype html>\n<html><body><h1>ESP32 Dashboard</h1><p>Local web interface</p></body></html>\n",
  Ruby: "# Host-side automation script\nputs 'Watching ESP32 serial output'\n",
  JavaScript: "console.log('Local JavaScript tool ready');\n",
};

export default function Home() {
  const [booting, setBooting] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [projectName, setProjectName] = useState("blink-node");
  const [language, setLanguage] = useState("Arduino C++");
  const [background, setBackground] = useState("aurora");
  const [notebook, setNotebook] = useState(false);
  const [active, setActive] = useState("Explorer");
  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("No device attached");
  const [deviceNote, setDeviceNote] = useState("Connect by USB or Bluetooth");
  const [terminalNote, setTerminalNote] = useState("Connect a board to begin live serial output.");
  const [aiOpen, setAiOpen] = useState(false);
  const [pluginOpen, setPluginOpen] = useState(false);
  const [flashOpen, setFlashOpen] = useState(false);
  const [liteMode, setLiteMode] = useState(true);
  const [runOpen, setRunOpen] = useState(false);
  const [visualOpen, setVisualOpen] = useState(false);
  const [runOutput, setRunOutput] = useState("Ready to run locally.");
  const [glyphLine, setGlyphLine] = useState("");
  const [code, setCode] = useState(sketch);

  useEffect(() => {
    const makeGlyphs = () => setGlyphLine(Array.from({ length: 24 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]).join(""));
    makeGlyphs();
    const characterTimer = window.setInterval(makeGlyphs, 100);
    const bootTimer = window.setTimeout(() => setBooting(false), 2100);
    return () => { window.clearInterval(characterTimer); window.clearTimeout(bootTimer); };
  }, []);

  useEffect(() => {
    const receiveOutput = (event: Event) => setRunOutput((event as CustomEvent<string>).detail);
    window.addEventListener("asv-execute-output", receiveOutput);
    return () => window.removeEventListener("asv-execute-output", receiveOutput);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  async function connectUsb() {
    const localBrowser = navigator as Navigator & { serial?: { requestPort: () => Promise<{ open: (options: { baudRate: number }) => Promise<void> }> } };
    if (!localBrowser.serial) {
      setTerminalNote("This browser does not support USB serial. Open AsV_IDE in Chrome or Edge on this computer.");
      return;
    }
    try {
      const port = await localBrowser.serial.requestPort();
      await port.open({ baudRate: 115200 });
      setConnected(true); setDeviceName("ESP32 USB serial"); setDeviceNote("USB · 115200 baud");
      setTerminalNote("USB serial connected locally. Your board is ready for a local build and flash.");
    } catch { setTerminalNote("USB connection was cancelled or the serial port could not be opened."); }
  }

  async function pairBluetooth() {
    const localBrowser = navigator as Navigator & { bluetooth?: { requestDevice: (options: { acceptAllDevices: boolean }) => Promise<{ name?: string }> } };
    if (!localBrowser.bluetooth) { setTerminalNote("Bluetooth pairing needs Chrome or Edge on this computer."); return; }
    try {
      const device = await localBrowser.bluetooth.requestDevice({ acceptAllDevices: true });
      setConnected(true); setDeviceName(device.name || "ESP32 BLE device"); setDeviceNote("Bluetooth LE paired locally");
      setTerminalNote("Bluetooth device paired. Install the OTA receiver by USB before sending wireless updates.");
    } catch { setTerminalNote("Bluetooth pairing was cancelled."); }
  }

  if (booting) return (
    <main className="boot-screen">
      <div className="boot-mark">A<span>V</span></div>
      <div className="boot-name">AsV_IDE</div>
      <div className="glyph-line">{glyphLine}</div>
      <div className="boot-loader"><i /></div>
      <p>INITIALIZING ESP WORKSPACE</p>
    </main>
  );

  if (welcome) return <Welcome background={background} setBackground={setBackground} onContinue={() => setWelcome(false)} onCreate={(name, selectedLanguage) => { setProjectName(name || "new-project"); setLanguage(selectedLanguage); setCode(templates[selectedLanguage]); setWelcome(false); }} />;
  if (notebook) return <NotebookPage background={background} onBack={() => setNotebook(false)} />;

  return (
    <main className={`ide-shell theme-${background}`}>
      <header className="topbar">
        <div className="brand"><b>A<span>V</span></b><strong>AsV_IDE</strong><em>BUILD WITHOUT LIMITS</em></div>
        <div className="project-pill"><span className="dot" /> {projectName} <kbd>⌘ S</kbd></div>
        <div className="top-actions">
          <button className="board-pill">{liteMode ? "Lite core · 18 MB" : "Full toolchain · 480 MB"} <span>⌄</span></button>
          <button className="visual-button" onClick={() => setVisualOpen(true)}>◌ Canvas</button>
          <button className="visual-button" onClick={() => setNotebook(true)}>▤ Notebook</button>
          <button className="run-button" onClick={() => setRunOpen(true)}>▶ Run</button>
          <button className={connected ? "connect connected" : "connect"} onClick={connected ? () => { setConnected(false); setDeviceName("No device attached"); setDeviceNote("Connect by USB or Bluetooth"); } : connectUsb}>{connected ? "● Connected" : "Connect USB"}</button>
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
          <div className="editor-tabs"><button className="file-tab">⌘ &nbsp; {projectName} <span>×</span></button><button>+</button></div>
          <div className="crumbs">AsV_IDE &nbsp;/&nbsp; projects &nbsp;/&nbsp; {projectName} &nbsp;/&nbsp; <b>{language}</b></div>
          <div className="editor-wrap">
            <ol className="line-numbers">{Array.from({length: 16}, (_, i) => <li key={i}>{i + 1}</li>)}</ol>
            <textarea aria-label="Code editor" spellCheck="false" value={code} onChange={e => setCode(e.target.value)} />
          </div>
          <div className="editor-status"><span>Ln 1, Col 1</span><span>Spaces: 2</span><span>UTF-8</span><span>{language}</span><span>ESP32 / Arduino</span></div>
        </section>
        <aside className="inspector">
          <div className="inspector-head"><span>DEVICE PULSE</span><span className={connected ? "pulse online" : "pulse"}>{connected ? "ONLINE" : "WAITING"}</span></div>
          <div className="device-card"><div className="chip-art">ESP<br/><b>32</b></div><h3>{connected ? deviceName : "No device attached"}</h3><p>{connected ? deviceNote : "Connect by USB or Bluetooth"}</p><button onClick={connected ? () => setConnected(false) : connectUsb}>{connected ? "Disconnect" : "Connect USB"}</button><button className="ble-flash" onClick={() => setFlashOpen(true)}>⌁ Bluetooth flash</button></div>
          <div className="metrics"><Metric label="FLASH" value="1.2 / 4 MB" width="30%" /><Metric label="HEAP" value="281 KB" width="68%" /><Metric label="CPU" value="240 MHz" width="88%" /></div>
          <button className="ai-card" onClick={() => setAiOpen(true)}><span>✦</span><div><b>AsV Intelligence</b><small>Ask, fix, optimize code</small></div><i>→</i></button>
          <button className={liteMode ? "lite-switch enabled" : "lite-switch"} onClick={() => setLiteMode(!liteMode)}><span>◌</span><div><b>Featherweight mode</b><small>{liteMode ? "Core + active plugins only" : "All offline tools installed"}</small></div><i>{liteMode ? "ON" : "OFF"}</i></button>
        </aside>
      </section>
      <section className="terminal"><div className="terminal-bar"><div><b>TERMINAL</b><span>OUTPUT</span><span>PROBLEMS <i>0</i></span><span>SERIAL MONITOR</span></div><button>⌄</button></div><div className="terminal-body"><p><b>›</b> Ready to compile <span>blink-node</span> for ESP32 DevKit V1</p><p><b>›</b> Local plugin host initialized — 12 extensions available</p><p className="muted">{terminalNote}</p></div></section>
      <footer><div><span className="sync">↻</span> main* &nbsp; <span>◉</span> 0 errors &nbsp; 0 warnings</div><div>ESP32 &nbsp; | &nbsp; UTF-8 &nbsp; | &nbsp; Turbo build engine <b>⚡</b></div></footer>
      <button className="fab" onClick={() => setPluginOpen(true)}>✦ <span>Plugin hub</span></button>
      {aiOpen && <AiModal onClose={() => setAiOpen(false)} />}
      {pluginOpen && <PluginModal onClose={() => setPluginOpen(false)} />}
      {flashOpen && <FlashModal onClose={() => setFlashOpen(false)} onPair={pairBluetooth} />}
      {visualOpen && <VisualModal value={background} onChoose={setBackground} onClose={() => setVisualOpen(false)} />}
      {runOpen && <RunPanel code={code} language={language} output={runOutput} setOutput={setRunOutput} onClose={() => setRunOpen(false)} />}
    </main>
  );
}

function Explorer() { return <><div className="tree-title">▾ BLINK-NODE <button>+</button></div><div className="tree-file selected">⌘ &nbsp; blink_node.ino</div><div className="tree-file">▱ &nbsp; platformio.ini</div><div className="tree-file">▣ &nbsp; README.md</div><div className="tree-title closed">› LIBRARIES</div><div className="tree-title closed">› EXAMPLES</div></>; }
function Welcome({onContinue, onCreate, background, setBackground}:{onContinue:()=>void;onCreate:(name:string,language:string)=>void;background:string;setBackground:(value:string)=>void}) {
  const [name, setName] = useState(""); const [language, setLanguage] = useState("Arduino C++"); const [github, setGithub] = useState(false);
  const [repo, setRepo] = useState(""); const [token, setToken] = useState(""); const [notice, setNotice] = useState("");
  const connectGithub = () => { const vault = (window as Window & { asvVault?: { save:(name:string,secret:string)=>void } }).asvVault; if (!repo || !token) { setNotice("Add your repository URL and GitHub token."); return; } if (!vault) { setNotice("Open the native AsV_IDE app to save GitHub access securely in Keychain."); return; } vault.save("github-repository", repo); vault.save("github-token", token); setToken(""); setNotice("GitHub connection saved locally. Auto-sync turns on when you open this project."); };
  return <main className={`welcome-screen theme-${background}`}><div className="welcome-glow"/><div className="welcome-brand"><b>A<span>V</span></b><strong>AsV_IDE</strong><em>{glyphs.slice(0, 14)}</em></div><section className="welcome-card"><span className="eyebrow">LOCAL CREATOR STUDIO</span><h1>Welcome back.</h1><p>Build for ESP32, Arduino, the web, or your computer—one local workspace.</p><div className="theme-picker"><span>BACKGROUND</span>{["aurora","midnight","neon","sunset"].map(item=><button key={item} onClick={()=>setBackground(item)} className={background===item?`selected ${item}`:item}>{item}</button>)}</div><div className="welcome-actions"><button className="continue-card" onClick={onContinue}><span>↺</span><div><b>Continue project</b><small>blink-node · Arduino C++</small></div><i>→</i></button><div className="new-project"><h2>Create a new project</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Project name"/><div className="language-grid">{Object.keys(templates).map(item=><button key={item} onClick={()=>setLanguage(item)} className={language===item?"selected":""}>{item}</button>)}</div><button className="primary" onClick={()=>onCreate(name, language)}>Create {language} project →</button></div></div><div className="github-box"><div><span>◉</span><b>GitHub Auto-sync</b><small>Optional. Save changes locally, then sync when connected.</small></div><button onClick={()=>setGithub(!github)}>{github?"Hide setup":"Connect GitHub"}</button>{github && <section className="github-form"><input value={repo} onChange={e=>setRepo(e.target.value)} placeholder="https://github.com/you/project.git"/><input type="password" value={token} onChange={e=>setToken(e.target.value)} placeholder="GitHub personal access token"/><button className="primary" onClick={connectGithub}>Save secure connection</button><small>{notice || "Your token is stored only in the macOS Keychain, never in the project."}</small></section>}</div></section><footer className="welcome-footer">LOCAL-FIRST · PLUGINS ON DEMAND · AI OPTIONAL</footer></main>;
}
function VisualModal({value,onChoose,onClose}:{value:string;onChoose:(theme:string)=>void;onClose:()=>void}) { return <div className="modal-back"><section className="modal"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">VISUAL ATMOSPHERE</span><h2>Make it yours.</h2><p>Choose a live background for the whole workspace.</p><div className="visual-grid">{["aurora","midnight","neon","sunset"].map(theme=><button key={theme} onClick={()=>onChoose(theme)} className={`visual-swatch ${theme} ${value===theme?"selected":""}`}><i/><b>{theme}</b></button>)}</div></section></div>; }
function RunPanel({code,language,output,setOutput,onClose}:{code:string;language:string;output:string;setOutput:(text:string)=>void;onClose:()=>void}) { const run=()=>{ if(language==="HTML") { setOutput("HTML preview refreshed below."); return; } const runner=(window as Window & {asvExecutor?:{run:(language:string,code:string)=>void}}).asvExecutor; if(!runner){setOutput("Open the native AsV_IDE app to run local Python, Ruby, Lua, or JavaScript.");return;} if(!["Python","Ruby","Lua","JavaScript"].includes(language)){setOutput("Arduino C++ needs the installed board toolchain and a connected board to compile/upload.");return;} setOutput(`Running ${language} locally…`);runner.run(language,code);}; return <div className="modal-back"><section className="modal run-panel"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">LOCAL EXECUTION</span><h2>Run {language}</h2><p>Nothing is sent to a cloud service.</p><button className="primary" onClick={run}>▶ Execute code</button>{language==="HTML"?<iframe title="HTML preview" sandbox="allow-scripts" srcDoc={code}/>:<pre className="run-output">{output}</pre>}</section></div>; }
function NotebookPage({background,onBack}:{background:string;onBack:()=>void}) {
  const starter = "from http.server import SimpleHTTPRequestHandler, HTTPServer\n\n# Your local web app runs only on this Mac\nserver = HTTPServer(('127.0.0.1', 8000), SimpleHTTPRequestHandler)\nprint('Serving at http://localhost:8000')\nserver.serve_forever()\n";
  const [code,setCode]=useState(starter); const [language,setLanguage]=useState("Python"); const [output,setOutput]=useState("Run a cell to see local output."); const [port,setPort]=useState("8000"); const [url,setUrl]=useState("");
  useEffect(()=>{const receive=(event:Event)=>{const result=(event as CustomEvent<string>).detail;setOutput(result);if(result.startsWith("http"))setUrl(result);};window.addEventListener("asv-server-output",receive);return()=>window.removeEventListener("asv-server-output",receive);},[]);
  const run=()=>{const bridge=(window as Window & {asvExecutor?:{run:(language:string,code:string)=>void}}).asvExecutor;if(!bridge){setOutput("Open the native AsV_IDE app to run this local cell.");return;}setOutput(`Running ${language} cell…`);bridge.run(language,code);};
  const start=()=>{const bridge=(window as Window & {asvServer?:{start:(language:string,code:string,port:string)=>void}}).asvServer;if(!bridge){setOutput("Open the native AsV_IDE app to start a localhost server.");return;}setOutput(`Starting localhost:${port}…`);bridge.start(language,code,port);};
  return <main className={`notebook theme-${background}`}><header className="notebook-top"><div className="brand"><b>A<span>V</span></b><strong>AsV_NOTEBOOK</strong><em>LOCAL COMPUTE</em></div><div><button className="visual-button" onClick={onBack}>← IDE</button><button className="run-button" onClick={run}>▶ Run cell</button></div></header><section className="notebook-sheet"><div className="notebook-title"><span>LOCAL NOTEBOOK</span><h1>Untitled experiment</h1><p>Code, output, and local servers—like a notebook, without cloud compute.</p></div><article className="note-cell markdown"><b># Build something local</b><p>Run Python or JavaScript cells. Start a server from your own code when you are ready.</p></article><article className="note-cell code-cell"><div className="cell-head"><span>⌘ CODE</span><select value={language} onChange={e=>setLanguage(e.target.value)}><option>Python</option><option>JavaScript</option><option>Ruby</option><option>Lua</option></select><button onClick={run}>▶</button></div><textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck="false"/><pre>{output}</pre></article><article className="note-cell server-cell"><div><span>◉ LOCALHOST</span><h2>Start server from this code</h2><p>Your code must create a server on the selected port. It stays on this computer.</p></div><input value={port} onChange={e=>setPort(e.target.value.replace(/[^0-9]/g,""))} aria-label="Local port"/><button className="primary" onClick={start}>Start localhost</button>{url&&<a href={url} target="_blank" rel="noreferrer">Open {url} ↗</a>}</article></section></main>;
}
function Plugins({onClose}:{onClose:()=>void}) { return <div className="plugin-mini"><p>Make your workflow yours.</p><div><b>✦ Gemini Assist</b><small>AI completion & review</small><button>Active</button></div><div><b>◉ Serial Studio</b><small>Visual telemetry</small><button>Active</button></div><button className="browse" onClick={onClose}>Browse plugin hub →</button></div>; }
function Metric({label,value,width}:{label:string,value:string,width:string}) { return <div className="metric"><div><span>{label}</span><b>{value}</b></div><i><em style={{width}} /></i></div>; }
function AiModal({onClose}:{onClose:()=>void}) {
  const [provider, setProvider] = useState("OpenAI");
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("Keys are stored in the macOS Keychain when you use the native AsV_IDE app.");
  const saveKey = () => {
    const vault = (window as Window & { asvVault?: { save: (name: string, secret: string) => void } }).asvVault;
    if (!key.trim()) { setMessage("Paste a key first."); return; }
    if (!vault) { setMessage("Open this in the AsV_IDE macOS app to save keys securely in Keychain."); return; }
    vault.save(provider, key); setKey(""); setMessage(`${provider} key saved in your macOS Keychain.`);
  };
  return <div className="modal-back"><section className="modal ai-modal"><button className="modal-close" onClick={onClose}>×</button><div className="modal-icon">✦</div><h2>AI Vault</h2><p>Choose your coding assistant. All providers are optional.</p><div className="provider-tabs">{["OpenAI","Gemini","Claude","Ollama","Custom"].map(name => <button key={name} onClick={() => setProvider(name)} className={provider === name ? "selected" : ""}>{name}</button>)}</div><label>{provider.toUpperCase()} {provider === "Ollama" ? "LOCAL URL" : "API KEY"}<input type={provider === "Ollama" ? "url" : "password"} value={key} onChange={e => setKey(e.target.value)} placeholder={provider === "Ollama" ? "http://localhost:11434" : `Paste ${provider} API key`} /></label><small>{message}</small><button className="primary" onClick={saveKey}>Save to local vault</button></section></div>;
}
function PluginModal({onClose}:{onClose:()=>void}) { return <div className="modal-back"><section className="modal plugin-modal"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">EXTENSION MARKETPLACE</span><h2>Build your perfect setup.</h2><p>Extend AsV_IDE with tools for hardware, automation, and AI.</p>{[["✦","Gemini Assist","Inline code completion and refactoring"],["◉","Serial Studio","Charts and inspectable live telemetry"],["◫","Home Assistant","Device discovery and YAML helpers"]].map(([a,b,c])=><div className="market-item" key={b}><span>{a}</span><div><b>{b}</b><small>{c}</small></div><button>Install</button></div>)}</section></div>; }
function FlashModal({onClose,onPair}:{onClose:()=>void;onPair:()=>Promise<void>}) { return <div className="modal-back"><section className="modal flash-modal"><button className="modal-close" onClick={onClose}>×</button><span className="eyebrow">WIRELESS FLASHING</span><h2>Bluetooth OTA flash</h2><p>Send a compiled update to a nearby ESP32 over Bluetooth Low Energy.</p><div className="flash-step done"><b>1</b><div><strong>Connect by USB once</strong><small>Install the AsV BLE OTA receiver on the board.</small></div></div><div className="flash-step"><b>2</b><div><strong>Pair your ESP32</strong><small>Choose it from nearby secure BLE devices.</small></div><button onClick={onPair}>Scan nearby</button></div><div className="flash-step"><b>3</b><div><strong>Flash future updates wirelessly</strong><small>Signed update packages protect the board.</small></div></div><small className="security-note">Bluetooth flashing is for your own trusted devices. Keep OTA authentication enabled and never expose the receiver without a password or signed firmware.</small><button className="primary" onClick={onClose}>Set up Bluetooth flashing</button></section></div>; }
