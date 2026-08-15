"use client";
/* eslint-disable react-hooks/set-state-in-effect -- browser-only local workspace hydration intentionally restores persisted state after mount. */

import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

const API_ORIGIN = "https://asv-ide-api.mist-fans24.workers.dev";
const APP_VERSION = "0.1.0";

type UpdateInfo = {
  latest: string;
  updateAvailable: boolean;
  downloadUrl?: string;
  notesUrl?: string;
  message?: string;
};

const templates: Record<string, string> = {
  "Arduino C++": `#include <Arduino.h>

constexpr int STATUS_LED = 2;

void setup() {
  Serial.begin(115200);
  pinMode(STATUS_LED, OUTPUT);
}

void loop() {
  digitalWrite(STATUS_LED, !digitalRead(STATUS_LED));
  delay(500);
}`,
  Python: `print("Hello from AsV_IDE")\n\n# Start building your local project here.\n`,
  MicroPython: `from machine import Pin\nfrom time import sleep\n\nled = Pin(2, Pin.OUT)\nwhile True:\n  led.toggle()\n  sleep(0.5)\n`,
  JavaScript: `console.log("Hello from AsV_IDE");\n`,
  TypeScript: `const greeting: string = "Hello from AsV_IDE";\nconsole.log(greeting);\n`,
  HTML: `<!doctype html>\n<html lang="en">\n  <head><meta charset="utf-8" /><title>AsV project</title></head>\n  <body><h1>Hello, AsV_IDE</h1></body>\n</html>\n`,
  CSS: `:root { color-scheme: dark; }\nbody { margin: 0; font-family: system-ui, sans-serif; }\n`,
  "C++": `#include <iostream>\n\nint main() {\n  std::cout << "Hello from AsV_IDE\\n";\n  return 0;\n}\n`,
  C: `#include <stdio.h>\n\nint main(void) {\n  puts("Hello from AsV_IDE");\n  return 0;\n}\n`,
  "C#": `using System;\n\nConsole.WriteLine("Hello from AsV_IDE");\n`,
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello from AsV_IDE");\n  }\n}\n`,
  Kotlin: `fun main() {\n  println("Hello from AsV_IDE")\n}\n`,
  Swift: `import Foundation\n\nprint("Hello from AsV_IDE")\n`,
  Go: `package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello from AsV_IDE")\n}\n`,
  Rust: `fn main() {\n  println!("Hello from AsV_IDE");\n}\n`,
  Lua: `print("Hello from AsV_IDE")\n`,
  Ruby: `puts "Hello from AsV_IDE"\n`,
  PHP: `<?php\necho "Hello from AsV_IDE\\n";\n`,
  Bash: `#!/usr/bin/env bash\necho "Hello from AsV_IDE"\n`,
  SQL: `-- AsV_IDE query\nSELECT 'Hello from AsV_IDE' AS greeting;\n`,
  R: `message("Hello from AsV_IDE")\n`,
  JSON: `{\n  "name": "asv-project",\n  "version": "0.1.0"\n}\n`,
  YAML: `name: asv-project\nversion: 0.1.0\n`,
  Markdown: `# Hello from AsV_IDE\n\nStart writing your project notes here.\n`,
  "Plain Text": `Hello from AsV_IDE\n`,
};
const languageFiles: Record<string, string> = {
  "Arduino C++": "sketch.ino",
  Python: "main.py",
  MicroPython: "main.py",
  JavaScript: "index.js",
  TypeScript: "index.ts",
  HTML: "index.html",
  CSS: "styles.css",
  "C++": "main.cpp",
  C: "main.c",
  "C#": "Program.cs",
  Java: "Main.java",
  Kotlin: "Main.kt",
  Swift: "main.swift",
  Go: "main.go",
  Rust: "main.rs",
  Lua: "main.lua",
  Ruby: "main.rb",
  PHP: "index.php",
  Bash: "main.sh",
  SQL: "query.sql",
  R: "main.R",
  JSON: "data.json",
  YAML: "config.yml",
  Markdown: "notes.md",
  "Plain Text": "notes.txt",
};
const localRuntimes = new Set(["Python", "JavaScript", "Lua", "Ruby"]);
const themes = ["aurora", "midnight", "neon", "sunset"];
const glyphs = "リ∆⟟꙰ꖎ⚚ᔑ╎ᓭ⍊ᒷℸ ̣ᓵᓵ∴";
const welcomeText: Record<
  string,
  { label: string; title: string; description: string }
> = {
  English: {
    label: "LOCAL CREATOR STUDIO",
    title: "Welcome back.",
    description:
      "Build for ESP32, Arduino, the web, or your computer—one local workspace.",
  },
  Arabic: {
    label: "استوديو الإبداع المحلي",
    title: "مرحباً بعودتك.",
    description:
      "أنشئ لمتحكم ESP32 وأردوينو والويب وجهازك في مساحة محلية واحدة.",
  },
  Hindi: {
    label: "लोकल क्रिएटर स्टूडियो",
    title: "वापस आने पर स्वागत है।",
    description:
      "ESP32, Arduino, वेब या अपने कंप्यूटर के लिए एक स्थानीय कार्यक्षेत्र में बनाएं।",
  },
  Spanish: {
    label: "ESTUDIO CREADOR LOCAL",
    title: "Bienvenido de nuevo.",
    description:
      "Crea para ESP32, Arduino, la web o tu ordenador desde un espacio local.",
  },
  French: {
    label: "ATELIER CRÉATEUR LOCAL",
    title: "Bon retour.",
    description:
      "Créez pour ESP32, Arduino, le web ou votre ordinateur dans un espace local.",
  },
};
type Project = {
  name: string;
  language: string;
  code: string;
  mainFile?: string;
  files?: Record<string, string>;
};

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    Explorer: "M3 6.5h6l1.7 2H21v10.5H3z",
    Search: "m20 20-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
    "Source Control":
      "M7 4v11m0-11a3 3 0 1 0 0 6m0 5a3 3 0 1 0 0 6m0-6h10m0 0a3 3 0 1 0 0-6",
    Extensions: "M8 3h4v4H8zm4 10h4v4h-4zM4 13h4v4H4zm8-10h4v4h-4z",
    Device:
      "M8 8V5m8 3V5m-10 3h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm4 4h.01M16 16h.01",
    "About Us": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5m0-8h.01",
    Admin: "M5 20h14M7 20v-7h10v7M6 8l6-4 6 4-6 4z",
    Settings:
      "M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm7-3.2 2-1.2-2-3.4-2.2.9a7.7 7.7 0 0 0-1.6-.9L15 5h-4l-.2 2.4a7.7 7.7 0 0 0-1.6.9L7 7.4l-2 3.4L7 12a7.7 7.7 0 0 0 0 1.8L5 15l2 3.4 2.2-.9a7.7 7.7 0 0 0 1.6.9L11 21h4l.2-2.4a7.7 7.7 0 0 0 1.6-.9l2.2.9 2-3.4-2-1.2a7.7 7.7 0 0 0 0-2Z",
    Notebook: "M5 3h11a3 3 0 0 1 3 3v15H8a3 3 0 0 0-3 0zm3 3h8m-8 4h8m-8 4h5",
  };
  return (
    <svg
      style={{
        width: 20,
        height: 20,
        display: "inline-block",
        verticalAlign: "middle",
      }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.Explorer} />
    </svg>
  );
}

export default function Home() {
  const importInput = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLElement>(null);
  const [booting, setBooting] = useState(true);
  const [welcome, setWelcome] = useState(true);
  const [project, setProject] = useState<Project>({
    name: "blink-node",
    language: "Arduino C++",
    code: templates["Arduino C++"],
  });
  const [theme, setTheme] = useState("aurora");
  const [active, setActive] = useState("Explorer");
  const [file, setFile] = useState("README.md");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [displayAvatar, setDisplayAvatar] = useState("");
  const [notebook, setNotebook] = useState(false);
  const [terminal, setTerminal] = useState("Ready to work locally.");
  const [about, setAbout] = useState(
    "AsV_IDE is built by makers who believe great tools should stay local, fast, and yours.",
  );
  const [hiring, setHiring] = useState(
    "Join our Discord — we are hiring developers, hardware builders, and plugin creators.",
  );
  const [updateHint, setUpdateHint] = useState<UpdateInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 600);
    try {
      const saved = JSON.parse(
        localStorage.getItem("asv-ide-workspace") || "null",
      );
      if (saved?.project) setProject(saved.project);
      if (saved?.theme) setTheme(saved.theme);
      if (saved?.about) setAbout(saved.about);
      if (saved?.hiring) setHiring(saved.hiring);
      if (saved?.adminMode) setAdminMode(true);
      if (saved?.displayName) setDisplayName(saved.displayName);
      if (saved?.displayAvatar) setDisplayAvatar(saved.displayAvatar);
    } catch {
      /* keep the default workspace */
    }
    setLoaded(true);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    const checkRelease = async () => {
      try {
        const response = await fetch(`${API_ORIGIN}/v1/updates?current=${APP_VERSION}`);
        if (!response.ok) return;
        const result = (await response.json()) as UpdateInfo;
        if (result.updateAvailable) setUpdateHint(result);
      } catch {
        // Update checks are optional: the IDE remains entirely usable offline.
      }
    };
    void checkRelease();
  }, []);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const outcome = query.get("oauth");
    if (!outcome) return;
    const provider = query.get("provider") || "account";
    if (outcome === "error") {
      setLoginOpen(true);
      setLoginStatus(`Could not finish ${provider} sign-in. Please try again.`);
    } else {
      setLoginStatus(`${provider} sign-in complete. Restoring your profile…`);
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "asv-ide-workspace",
        JSON.stringify({
          project,
          theme,
          about,
          hiring,
          adminMode,
          displayName,
          displayAvatar,
        }),
      );
  }, [loaded, project, theme, about, hiring, adminMode, displayName, displayAvatar]);
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch(`${API_ORIGIN}/auth/session`, { credentials: "include" });
        const session = await response.json() as { authenticated?: boolean; user?: { name?: string; avatar?: string | null } };
        if (session.authenticated && session.user?.name) {
          setDisplayName(session.user.name);
          setDisplayAvatar(session.user.avatar || "");
          setLoginOpen(false);
          setTerminal(`Signed in as ${session.user.name}.`);
          setLoginStatus("");
        }
      } catch {
        /* Offline/local use remains fully functional without sign-in. */
      }
    };
    void restoreSession();
  }, []);
  const writeTerminal = (message: string) => {
    setTerminal(message);
    window.requestAnimationFrame(() =>
      terminalRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    );
  };
  useEffect(() => {
    const receive = (event: Event) =>
      writeTerminal((event as CustomEvent<string>).detail);
    window.addEventListener("asv-execute-output", receive);
    return () => window.removeEventListener("asv-execute-output", receive);
  }, []);
  useEffect(() => {
    const receive = (event: Event) =>
      writeTerminal((event as CustomEvent<string>).detail);
    window.addEventListener("asv-server-output", receive);
    return () => window.removeEventListener("asv-server-output", receive);
  }, []);
  useEffect(() => {
    const save = () => writeTerminal("Saved locally. Your workspace will be restored when AsV_IDE reopens.");
    window.addEventListener("asv-save", save);
    return () => window.removeEventListener("asv-save", save);
  }, []);
  const createProject = (name: string, language: string) => {
    const cleanName =
      name.trim().replace(/[^a-zA-Z0-9._-]/g, "-") || "new-project";
    const mainFile = languageFiles[language] || "main.txt";
    setProject({
      name: cleanName,
      language,
      mainFile,
      code: templates[language] || templates["Plain Text"],
      files: {},
    });
    setFile("README.md");
    setWelcome(false);
    setTerminal(`Created ${cleanName} locally with ${mainFile}.`);
  };
  const mainFile = project.mainFile || project.name;
  const projectFiles = [
    "README.md",
    mainFile,
    ...Object.keys(project.files || {}),
  ];
  const isReadme = file === "README.md";
  const selectedCode =
    file === mainFile ? project.code : (project.files || {})[file] || "";
  const updateFile = (content: string) =>
    setProject(
      file === mainFile
        ? { ...project, code: content }
        : { ...project, files: { ...(project.files || {}), [file]: content } },
    );
  const addFile = () => {
    setNewFileName("");
    setNewFileOpen(true);
  };
  const saveNewFile = () => {
    const clean = newFileName.trim().replace(/^\/+/, "");
    if (!clean || projectFiles.includes(clean)) {
      setTerminal("Choose a new, unique file name.");
      return;
    }
    setProject({
      ...project,
      files: { ...(project.files || {}), [clean]: "" },
    });
    setFile(clean);
    setNewFileOpen(false);
    setTerminal(`Created ${clean} locally.`);
  };
  const deleteFile = (name: string) => {
    if (name === "README.md" || name === mainFile) {
      setTerminal("The project README and main file cannot be deleted.");
      return;
    }
    const files = { ...(project.files || {}) };
    delete files[name];
    setProject({ ...project, files });
    setFile(mainFile);
    setTerminal(`Deleted ${name}.`);
  };
  const exportProject = () => {
    const archive = JSON.stringify({ format: "asv-ide-project", version: 1, project }, null, 2);
    const url = URL.createObjectURL(new Blob([archive], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "asv-project"}.asv-project.json`;
    link.click();
    URL.revokeObjectURL(url);
    setTerminal(`Exported ${project.name} as a portable AsV_IDE project.`);
  };
  const importProject = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (selected.name.toLowerCase().endsWith(".apk")) {
      setTerminal("APK opened as a binary archive. Inspection is safe; editing or rebuilding a signed APK requires Android build tools and the app owner's permission.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const archive = JSON.parse(String(reader.result)) as { format?: string; project?: Project };
        if (archive.format !== "asv-ide-project" || !archive.project?.name || !archive.project?.language) throw new Error("invalid project");
        setProject({ ...archive.project, files: archive.project.files || {} });
        setFile("README.md");
        setWelcome(false);
        setTerminal(`Imported ${archive.project.name} locally.`);
      } catch {
        setTerminal("That file is not a valid AsV_IDE project export.");
      }
    };
    reader.readAsText(selected);
  };
  const run = () => {
    const isMicroPython =
      project.language === "MicroPython" ||
      /(^|\n)\s*(from\s+machine\s+import|import\s+machine\b)/m.test(
        project.code,
      );
    if (isMicroPython) {
      writeTerminal(
        "ESP32 / MicroPython code detected. This stays in the bottom console: it cannot run with macOS Python because the 'machine' module only exists on a MicroPython board. Connect a flashed ESP32, then use Upload to device when that transport is configured.",
      );
      return;
    }
    if (project.language === "HTML") {
      writeTerminal(
        "HTML projects open in your browser preview when served locally.",
      );
      return;
    }
    const runner = (
      window as Window & {
        asvExecutor?: { run: (language: string, code: string) => void };
      }
    ).asvExecutor;
    if (!runner) {
      writeTerminal(
        "Open the macOS AsV_IDE app to run installed local runtimes.",
      );
      return;
    }
    if (!localRuntimes.has(project.language)) {
      writeTerminal(
        `${project.language} is ready to edit. Running it needs its local compiler/runtime, which is not bundled yet.`,
      );
      return;
    }
    writeTerminal(`Running ${project.language} locally…`);
    runner.run(project.language, project.code);
  };
  const hostLocalProject = () => {
    if (!new Set(["Python", "JavaScript"]).has(project.language)) {
      writeTerminal(
        "Local hosting is available for Python and JavaScript projects that start their own server. Select one of those templates, then make the code listen on port 4173.",
      );
      return;
    }
    const server = (
      window as Window & {
        asvServer?: {
          start: (language: string, code: string, port: string) => void;
          stop: () => void;
        };
      }
    ).asvServer;
    if (!server) {
      writeTerminal("Open the macOS AsV_IDE app to host a local project.");
      return;
    }
    writeTerminal("Starting local server on http://localhost:4173…");
    server.start(project.language, project.code, "4173");
  };
  const stopLocalProject = () => {
    const server = (
      window as Window & { asvServer?: { stop: () => void } }
    ).asvServer;
    if (!server) {
      writeTerminal("Open the macOS AsV_IDE app to stop a local server.");
      return;
    }
    server.stop();
  };
  if (booting)
    return (
      <main className="boot-screen">
        <div className="boot-mark">
          A<span>V</span>
        </div>
        <div className="boot-name">AsV_IDE</div>
        <div className="glyph-line">{glyphs}</div>
        <div className="boot-loader">
          <i />
        </div>
        <p>INITIALIZING LOCAL WORKSPACE</p>
      </main>
    );
  if (welcome)
    return (
      <Welcome
        theme={theme}
        setTheme={setTheme}
        onCreate={createProject}
        onNotebook={() => {
          setWelcome(false);
          setNotebook(true);
        }}
        displayName={displayName}
      />
    );
  if (notebook)
    return <Notebook theme={theme} onBack={() => setNotebook(false)} />;
  const nav = [
    "Explorer",
    "Search",
    "Source Control",
    "Extensions",
    "Device",
    "About Us",
    ...(adminMode ? ["Admin"] : []),
  ];
  return (
    <main className={`ide-shell theme-${theme}`}>
      <header className="topbar">
        <div className="brand">
          <b>
            A<span>V</span>
          </b>
          <strong>AsV_IDE</strong>
          <em>{adminMode ? "ADMIN EDITION" : "LOCAL WORKSPACE"}</em>
        </div>
        <div className="project-pill">
          <span className="dot" />
          {project.name}
        </div>
        <div className="top-actions">
          <input ref={importInput} className="hidden-file-input" type="file" accept=".json,.asv-project,.apk,application/json,application/vnd.android.package-archive" onChange={importProject} />
          <button className="visual-button" onClick={() => importInput.current?.click()}>Import</button>
          <button className="visual-button" onClick={exportProject}>Export</button>
          <button className="visual-button" onClick={() => setWelcome(true)}>
            ＋ Project
          </button>
          <button className="visual-button account-button" onClick={() => setLoginOpen(true)}>
            {displayAvatar && <img src={displayAvatar} alt="" referrerPolicy="no-referrer" />}
            {displayName ? `Hi, ${displayName}` : "Sign in"}
          </button>
          <button className="visual-button" onClick={() => setNotebook(true)}>
            <Icon name="Notebook" /> New notebook
          </button>
          <button className="visual-button" onClick={hostLocalProject}>
            ◉ Host local
          </button>
          <button className="visual-button" onClick={stopLocalProject}>
            Stop host
          </button>
          {updateHint?.updateAvailable && (
            <button className="visual-button update-hint" onClick={() => setSettingsOpen(true)}>
              Update {updateHint.latest}
            </button>
          )}
          <button className="run-button" onClick={run}>
            ▶ Run
          </button>
          <button
            className="avatar"
            onClick={() => setSettingsOpen(true)}
            title="Open settings"
          >
            <Icon name="Settings" />
          </button>
        </div>
      </header>
      <section className="workspace">
        <aside className="activity-bar">
          {nav.map((label) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={active === label ? "active" : ""}
              title={label}
            >
              <Icon name={label} />
            </button>
          ))}
          <button
            className="settings"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <Icon name="Settings" />
          </button>
        </aside>
        <aside className="side-panel">
          <div className="panel-heading">{active.toUpperCase()}</div>
          <Sidebar
            active={active}
            project={project}
            mainFile={mainFile}
            files={projectFiles}
            activeFile={file}
            openFile={setFile}
            onNewFile={addFile}
            onDeleteFile={deleteFile}
            about={about}
            hiring={hiring}
            adminMode={adminMode}
            onNotify={writeTerminal}
            onSettings={() => setSettingsOpen(true)}
          />
          <div className="side-bottom">
            <span>◉ Local-first</span>
            <span>◉ Autosaved</span>
          </div>
        </aside>
        <section className="editor-area">
          {active === "Admin" ? (
            <AdminPanel
              about={about}
              setAbout={setAbout}
              hiring={hiring}
              setHiring={setHiring}
            />
          ) : (
            <>
              <div className="editor-tabs">
                {projectFiles.map((name) => (
                  <button
                    key={name}
                    className={file === name ? "file-tab" : ""}
                    onClick={() => setFile(name)}
                  >
                    {name === "README.md" ? "▣" : "⌘"} {name}
                  </button>
                ))}
              </div>
              <div className="crumbs">
                AsV_IDE / projects / {project.name} /{" "}
                <b>{isReadme ? "README.md" : file}</b>
              </div>
              {isReadme ? (
                <Readme
                  project={project}
                  mainFile={mainFile}
                  openCode={() => setFile(mainFile)}
                />
              ) : (
                <Editor
                  code={selectedCode}
                  language={project.language}
                  setCode={updateFile}
                />
              )}
            </>
          )}
        </section>
        <aside className="inspector">
          <div className="inspector-head">
            <span>DEVICE PULSE</span>
            <span className="pulse">WAITING</span>
          </div>
          <div className="device-card">
            <div className="chip-art">
              ESP
              <br />
              <b>32</b>
            </div>
            <h3>No device attached</h3>
            <p>Connect USB or Bluetooth when ready.</p>
            <button
              onClick={() =>
                setTerminal(
                  "Use Connect USB in the native app to choose a board.",
                )
              }
            >
              Connect device
            </button>
          </div>
          <button className="ai-card" onClick={() => setSettingsOpen(true)}>
            <span>✦</span>
            <div>
              <b>AsV Intelligence</b>
              <small>Configure AI providers</small>
            </div>
            <i>→</i>
          </button>
        </aside>
      </section>
      <section className="community-banner">◈ {hiring}</section>
      <section className="terminal" ref={terminalRef} aria-live="polite">
        <div className="terminal-bar">
          <div>
            <b>TERMINAL</b>
            <span>OUTPUT</span>
            <span>
              PROBLEMS <i>0</i>
            </span>
          </div>
          <button onClick={() => setTerminal("Console cleared.")}>Clear</button>
        </div>
        <div className="terminal-body">
          <p>
            <b>›</b> {terminal}
          </p>
        </div>
      </section>
      <footer>
        <div>
          <span>↻</span> Saved locally
        </div>
        <div>{project.language} · UTF-8 · AsV_IDE</div>
      </footer>
      {newFileOpen && (
        <NewFileModal
          name={newFileName}
          setName={setNewFileName}
          onClose={() => setNewFileOpen(false)}
          onCreate={saveNewFile}
        />
      )}
      {settingsOpen && (
        <Settings
          theme={theme}
          setTheme={setTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {loginOpen && (
        <Login
          onClose={() => setLoginOpen(false)}
          onDiscord={() => {
            setLoginStatus("Opening Discord’s secure sign-in…");
            window.location.assign(`${API_ORIGIN}/auth/discord/start`);
          }}
          onGoogle={() => {
            setLoginStatus("Opening Google’s secure sign-in…");
            window.location.assign(`${API_ORIGIN}/auth/google/start`);
          }}
          status={loginStatus}
        />
      )}
    </main>
  );
}

function Welcome({
  theme,
  setTheme,
  onCreate,
  onNotebook,
  displayName,
}: {
  theme: string;
  setTheme: (theme: string) => void;
  onCreate: (name: string, language: string) => void;
  onNotebook: () => void;
  displayName: string;
}) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("Arduino C++");
  const [languageName, setLanguageName] = useState("English");
  const copy = welcomeText[languageName];
  const title = displayName
    ? `${copy.title.replace(".", "")}, ${displayName}.`
    : copy.title;
  return (
    <main className={`welcome-screen public-welcome theme-${theme}`}>
      <div className="welcome-glow" />
      <nav className="public-nav">
        <strong>AsV_IDE</strong>
        <span>LOCAL MAKER STUDIO</span>
        <a
          href="https://github.com/mistfans24-maker/AsV_IDE"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub ↗
        </a>
      </nav>
      <section className="public-hero">
        <div className="public-copy">
          <span className="eyebrow">{copy.label}</span>
          <h1>{title}</h1>
          <p>{copy.description}</p>
          <div className="language-picker">
            <span>LANGUAGE</span>
            {Object.keys(welcomeText).map((item) => (
              <button
                key={item}
                onClick={() => setLanguageName(item)}
                className={languageName === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="theme-picker">
            <span>BACKGROUND</span>
            {themes.map((item) => (
              <button
                key={item}
                onClick={() => setTheme(item)}
                className={theme === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="new-project welcome-create">
            <h2>Create a new project</h2>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Project name"
            />
            <div className="language-grid">
              {Object.keys(templates).map((item) => (
                <button
                  key={item}
                  onClick={() => setLanguage(item)}
                  className={language === item ? "selected" : ""}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              className="primary"
              onClick={() => onCreate(name, language)}
            >
              Start building →
            </button>
            <button
              className="primary"
              style={{
                marginTop: 9,
                background: "transparent",
                color: "var(--aqua)",
                border: "1px solid var(--teal)",
              }}
              onClick={onNotebook}
            >
              <Icon name="Notebook" /> Start a blank notebook
            </button>
          </div>
        </div>
        <aside className="public-device">
          <div className="device-orbit">
            <i />
            <b>
              ESP
              <br />
              32
            </b>
          </div>
          <span>DEVICE-READY WORKSPACE</span>
          <h2>From first blink to real build.</h2>
          <p>
            Create code, learn hardware, and keep every experiment on your own
            computer.
          </p>
          <div className="signal-row">
            <b>● Local-first</b>
            <b>● Multi-language</b>
            <b>● Plugin-ready</b>
          </div>
        </aside>
      </section>
      <section className="public-features">
        <article>
          <span>01</span>
          <h2>Project Compass</h2>
          <p>
            Every project opens with a human README: what to build next, what to
            connect, and where to experiment.
          </p>
        </article>
        <article>
          <span>02</span>
          <h2>Code + Canvas</h2>
          <p>
            Move from syntax-coloured code to visual notebook thinking without
            leaving your workspace.
          </p>
        </article>
        <article>
          <span>03</span>
          <h2>Learning Mode</h2>
          <p>
            Start small, run locally, then grow into ESP32, web, Python, Lua,
            Ruby, or JavaScript projects.
          </p>
        </article>
      </section>
      <footer className="welcome-footer">
        BUILT FOR CURIOUS MAKERS · LOCAL-FIRST · OPEN TO CONTRIBUTORS
      </footer>
    </main>
  );
}

function Sidebar({
  active,
  project,
  mainFile,
  files,
  activeFile,
  openFile,
  onNewFile,
  onDeleteFile,
  about,
  hiring,
  adminMode,
  onNotify,
  onSettings,
}: {
  active: string;
  project: Project;
  mainFile: string;
  files: string[];
  activeFile: string;
  openFile: (name: string) => void;
  onNewFile: () => void;
  onDeleteFile: (name: string) => void;
  about: string;
  hiring: string;
  adminMode: boolean;
  onNotify: (message: string) => void;
  onSettings: () => void;
}) {
  const [query, setQuery] = useState("");
  const matches = files.filter(
    (name) =>
      name.toLowerCase().includes(query.toLowerCase()) ||
      (name === mainFile &&
        project.code.toLowerCase().includes(query.toLowerCase())),
  );
  if (active === "Explorer")
    return (
      <>
        <div className="tree-title">
          ▾ {project.name.toUpperCase()}{" "}
          <button onClick={onNewFile} title="New file">
            ＋
          </button>
        </div>
        <div className="explorer-actions">
          <button onClick={onNewFile}>＋ New file</button>
          <button onClick={() => openFile("README.md")}>Project guide</button>
        </div>
        {files.map((name) => (
          <div className="tree-row" key={name}>
            <button
              className={`tree-file ${activeFile === name ? "selected" : ""}`}
              onClick={() => openFile(name)}
            >
              {name === "README.md" ? "▣" : "⌘"} &nbsp; {name}
            </button>
            {name !== "README.md" && name !== mainFile && (
              <button
                className="file-delete"
                onClick={() => onDeleteFile(name)}
                title={`Delete ${name}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <div className="tree-title closed">› LIBRARIES</div>
        <div className="tree-title closed">› EXAMPLES</div>
      </>
    );
  if (active === "Search")
    return (
      <div className="sidebar-message">
        <b>Search this project</b>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find files or code"
        />
        {query ? (
          <>
            {matches.length ? (
              matches.map((name) => (
                <button key={name} onClick={() => openFile(name)}>
                  Open {name}
                </button>
              ))
            ) : (
              <small>No matches in this project.</small>
            )}
          </>
        ) : (
          <small>Search file names and the main code file.</small>
        )}
      </div>
    );
  if (active === "Source Control")
    return (
      <div className="sidebar-message">
        <b>Source Control</b>
        <small>
          Workspace changes are autosaved locally. Push changes from your Git
          workflow when you are ready to share them.
        </small>
        <button onClick={() => {
          navigator.clipboard?.writeText("git status");
          onNotify("Copied `git status` to your clipboard. Run it in Terminal inside your project folder.");
        }}>
          Copy git status command
        </button>
      </div>
    );
  if (active === "Extensions")
    return (
      <div className="sidebar-message">
        <b>Extensions</b>
        <button onClick={() => openFile("README.md")}>
          ✦ Explore project tools
        </button>
        <button onClick={() => openFile(mainFile)}>◉ Open main code</button>
        <button onClick={onSettings}>Configure AI providers</button>
        <small>
          AI integrations stay optional until you configure a provider.
        </small>
      </div>
    );
  if (active === "About Us")
    return (
      <div className="sidebar-message about-panel">
        <b>About AsV_IDE</b>
        <small>{about}</small>
        <strong>Lead developer & founder</strong>
        <small>
          AsV — maker, builder, and the person turning an idea into a
          local-first IDE.
        </small>
        <div className="discord-note">{hiring}</div>
      </div>
    );
  if (active === "Admin" && adminMode)
    return (
      <div className="sidebar-message">
        <b>Admin mode active</b>
        <small>
          You can edit the About and hiring panels from the Admin workspace.
        </small>
      </div>
    );
  return (
    <div className="sidebar-message">
      <b>Device Center</b>
      <small>
        Device flashing needs a board transport; it is not bundled into this
        early local build yet.
      </small>
      <button onClick={() => onNotify("Device support is planned for the native build. For now, use Arduino IDE, esptool, or a configured local toolchain to flash a board.")}>Device support info</button>
    </div>
  );
}
function Readme({
  project,
  mainFile,
  openCode,
}: {
  project: Project;
  mainFile: string;
  openCode: () => void;
}) {
  return (
    <article className="readme">
      <span className="eyebrow">WELCOME TO YOUR PROJECT</span>
      <h1>Welcome to {project.name}.</h1>
      <p>
        This local {project.language} project is ready to become anything you
        want: a web app, desktop utility, firmware build, data experiment, or
        creative tool.
      </p>
      <h2>Start making</h2>
      <ol>
        <li>
          Open <b>{mainFile}</b> and write your first feature.
        </li>
        <li>
          Use <b>Run</b> for installed supported local runtimes. Other languages
          remain editable until their local toolchain is connected.
        </li>
        <li>
          Keep notes here, add files in Explorer, and save everything locally.
        </li>
      </ol>
      <button className="primary readme-action" onClick={openCode}>
        Open {mainFile} →
      </button>
    </article>
  );
}
function NewFileModal({
  name,
  setName,
  onClose,
  onCreate,
}: {
  name: string;
  setName: (value: string) => void;
  onClose: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="modal-back">
      <section className="modal new-file-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <span className="eyebrow">EXPLORER</span>
        <h2>Create a new file</h2>
        <p>
          Add notes, source files, or folders such as <code>src/main.py</code>.
          It will save locally with this project.
        </p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onCreate();
          }}
          placeholder="notes.md"
        />
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onCreate}>
            Create file
          </button>
        </div>
      </section>
    </div>
  );
}
function formatCode(code: string, language: string) {
  if (language !== "Python")
    return code
      .split("\n")
      .map((line) => line.replace(/[ \t]+$/g, ""))
      .join("\n");
  return code
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+$/g, "")
        .replace(/\s+:/g, ":")
        .replace(/\s*==\s*/g, " == ")
        .replace(/\b(if|elif|while|for|def|class)\s+/g, "$1 "),
    )
    .join("\n");
}
function Editor({
  code,
  language,
  setCode,
}: {
  code: string;
  language: string;
  setCode: (code: string) => void;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const setCursor = (area: HTMLTextAreaElement, position: number) =>
    window.requestAnimationFrame(() => {
      area.selectionStart = position;
      area.selectionEnd = position;
    });
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const area = event.currentTarget;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      window.dispatchEvent(new Event("asv-save"));
      return;
    }
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const before = code.slice(0, start);
    const after = code.slice(end);
    if (event.key === "Enter") {
      event.preventDefault();
      const line = before.slice(before.lastIndexOf("\n") + 1);
      const leading = line.match(/^\s*/)?.[0] || "";
      const indent = leading + (line.trimEnd().endsWith(":") ? "  " : "");
      const next = `${before}\n${indent}${after}`;
      setCode(next);
      setCursor(area, start + indent.length + 1);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      const next = `${before}  ${after}`;
      setCode(next);
      setCursor(area, start + 2);
      return;
    }
    const pair: Record<string, string> = {
      "(": ")",
      "[": "]",
      "{": "}",
      '"': '"',
      "'": "'",
    };
    if (pair[event.key] && start === end) {
      event.preventDefault();
      const next = `${before}${event.key}${pair[event.key]}${after}`;
      setCode(next);
      setCursor(area, start + 1);
    }
  };
  return (
    <>
      <div className="editor-wrap">
        <ol
          className="line-numbers"
          style={{ transform: `translateY(-${scrollTop}px)` }}
        >
          {Array.from(
            { length: Math.max(16, code.split("\n").length) },
            (_, index) => (
              <li key={index}>{index + 1}</li>
            ),
          )}
        </ol>
        <textarea
          aria-label="Code editor"
          spellCheck="false"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={onKeyDown}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        />
      </div>
      <div className="editor-status">
        <span>Smart indent on</span>
        <button onClick={() => setCode(formatCode(code, language))}>
          Format code
        </button>
        <span>Tab = 2 spaces</span>
      </div>
    </>
  );
}
function Login({
  onClose,
  onDiscord,
  onGoogle,
  status,
}: {
  onClose: () => void;
  onDiscord: () => void;
  onGoogle: () => void;
  status: string;
}) {
  return (
    <div className="modal-back">
      <section className="modal login-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="login-heading">
          <div className="login-mark" aria-hidden="true"><b>A</b><i>V</i></div>
          <div><span className="eyebrow">ASV ACCOUNT</span><h2>Your workspace, recognised.</h2></div>
        </div>
        <p>Sign in to show your name and avatar across AsV_IDE. Projects, code, and API keys stay on this computer.</p>
        <div className="login-providers">
          <section className="discord-provider">
            <ProviderLogo provider="discord" /><b>Discord</b>
            <small>Fastest option. Uses your Discord display name and avatar.</small>
            <button className="primary" onClick={onDiscord}>
              Continue with Discord
            </button>
          </section>
          <section>
            <ProviderLogo provider="google" /><b>Google</b>
            <small>Use your Google profile. Google may open a secure browser page.</small>
            <button className="primary" onClick={onGoogle}>
              Continue with Google
            </button>
          </section>
          <section>
            <ProviderLogo provider="github" /><b>GitHub</b>
            <small>Repository sync will appear here when its OAuth app is configured.</small>
            <button disabled aria-disabled="true">GitHub coming soon</button>
          </section>
        </div>
        {status && <p className="login-status" role="status">{status}</p>}
        <div className="login-trust">
          <span aria-hidden="true">◇</span>
          <div>
            <b>Private by design</b>
            <small>
              AsV_IDE never collects your provider password. Sign-in is handled
              by Google or Discord and your session is protected by the API.
            </small>
          </div>
        </div>
      </section>
    </div>
  );
}
function ProviderLogo({ provider }: { provider: "discord" | "google" | "github" }) {
  const labels = { discord: "Discord", google: "Google", github: "GitHub" };
  return <span className={`provider-logo ${provider}`} aria-label={labels[provider]} title={labels[provider]}>{provider === "discord" ? "⌁" : provider === "google" ? "G" : "◖◗"}</span>;
}
function AdminPanel({
  about,
  setAbout,
  hiring,
  setHiring,
}: {
  about: string;
  setAbout: (value: string) => void;
  hiring: string;
  setHiring: (value: string) => void;
}) {
  return (
    <article className="admin-panel">
      <span className="eyebrow">ADMIN WORKSPACE</span>
      <h1>Welcome Admin.</h1>
      <p>
        Edit the live community panels below. Your changes save locally and
        appear immediately in the sidebar and banner.
      </p>
      <label>
        About AsV_IDE
        <textarea
          value={about}
          onChange={(event) => setAbout(event.target.value)}
        />
      </label>
      <label>
        Discord / hiring banner
        <textarea
          value={hiring}
          onChange={(event) => setHiring(event.target.value)}
        />
      </label>
      <div className="admin-status">● Changes saved locally</div>
    </article>
  );
}
function Settings({
  theme,
  setTheme,
  onClose,
}: {
  theme: string;
  setTheme: (theme: string) => void;
  onClose: () => void;
}) {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [updateStatus, setUpdateStatus] = useState("Checking the stable release channel…");
  const [mediaStatus, setMediaStatus] = useState(
    "Control Apple Music without connecting a streaming account.",
  );
  useEffect(() => {
    const receive = (event: Event) =>
      setMediaStatus((event as CustomEvent<string>).detail);
    window.addEventListener("asv-media-output", receive);
    return () => window.removeEventListener("asv-media-output", receive);
  }, []);
  const checkForUpdates = async () => {
    setUpdateStatus("Checking the stable release channel…");
    try {
      const response = await fetch(`${API_ORIGIN}/v1/updates?current=${APP_VERSION}`);
      if (!response.ok) throw new Error("Update service unavailable");
      const result = (await response.json()) as UpdateInfo;
      setUpdate(result);
      setUpdateStatus(result.updateAvailable ? `Version ${result.latest} is ready.` : `You are up to date on ${APP_VERSION}.`);
    } catch {
      setUpdateStatus("Could not check for updates. Your workspace is still usable offline.");
    }
  };
  useEffect(() => { void checkForUpdates(); }, []);
  const controlMedia = (action: "previous" | "playPause" | "next") => {
    const bridge = (
      window as Window & { asvMedia?: { control: (value: string) => void } }
    ).asvMedia;
    if (!bridge) {
      setMediaStatus("Open the macOS AsV_IDE app to control Apple Music.");
      return;
    }
    setMediaStatus("Sending media command…");
    bridge.control(action);
  };
  return (
    <div className="modal-back">
      <section className="modal settings-modal">
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <span className="eyebrow">WORKSPACE SETTINGS</span>
        <h2>Make AsV_IDE yours.</h2>
        <p>
          Changes save locally and apply across the editor, welcome screen, and
          notebook.
        </p>
        <div className="settings-summary" aria-label="Workspace status">
          <span>● Local-first</span><span>● Autosave on</span><span>v{APP_VERSION}</span>
        </div>
        <h3>Theme</h3>
        <div className="visual-grid">
          {themes.map((item) => (
            <button
              key={item}
              onClick={() => setTheme(item)}
              className={`visual-swatch ${item} ${theme === item ? "selected" : ""}`}
            >
              <i />
              <b>{item}</b>
            </button>
          ))}
        </div>
        <h3>Updates</h3>
        <div className="update-card">
          <div>
            <b>{update?.updateAvailable ? `Update available: ${update.latest}` : "Stable release channel"}</b>
            <small>{updateStatus}</small>
          </div>
          <div className="update-actions">
            <button onClick={() => void checkForUpdates()}>Check now</button>
            {update?.updateAvailable && update.downloadUrl && (
              <button className="primary" onClick={() => window.open(update.downloadUrl, "_blank", "noopener,noreferrer")}>Download update</button>
            )}
          </div>
          <small className="update-note">Updates download from the official release page. Automatic in-place installation will be enabled once the macOS app is signed and notarized.</small>
        </div>
        <h3>Mac media controls</h3>
        <div className="spotify-connect media-controls-panel">
          <b>Music while you build.</b>
          <small>{mediaStatus}</small>
          <div className="music-controls">
            <button
              onClick={() => controlMedia("previous")}
              aria-label="Previous track"
            >
              ↶ Previous
            </button>
            <button
              className="primary"
              onClick={() => controlMedia("playPause")}
            >
              ▶ Play / Pause
            </button>
            <button
              onClick={() => controlMedia("next")}
              aria-label="Next track"
            >
              Next ↷
            </button>
          </div>
        </div>
        <AIKeySettings />
      </section>
    </div>
  );
}
function AIKeySettings() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [status, setStatus] = useState(
    "Keys are saved only in macOS Keychain.",
  );
  const save = (provider: "openai" | "gemini", key: string) => {
    if (!key.trim()) {
      setStatus(
        `Paste a ${provider === "openai" ? "OpenAI" : "Gemini"} key first.`,
      );
      return;
    }
    const vault = (
      window as Window & {
        asvVault?: { save: (provider: string, key: string) => void };
      }
    ).asvVault;
    if (!vault) {
      setStatus(
        "Open the macOS AsV_IDE app to save keys securely in Keychain.",
      );
      return;
    }
    vault.save(provider, key.trim());
    if (provider === "openai") setOpenaiKey("");
    else setGeminiKey("");
    setStatus(
      `${provider === "openai" ? "OpenAI" : "Gemini"} key saved to macOS Keychain.`,
    );
  };
  return (
    <>
      <h3>AI provider keys</h3>
      <div className="ai-key-panel">
        <p>
          Paste keys here only in the macOS app. They are not synced, logged, or
          stored in this project.
        </p>
        <label>
          OpenAI API key
          <input
            aria-label="OpenAI API key"
            type="password"
            value={openaiKey}
            onChange={(event) => setOpenaiKey(event.target.value)}
            placeholder="sk-…"
            autoComplete="off"
          />
        </label>
        <button onClick={() => save("openai", openaiKey)}>
          Save OpenAI key
        </button>
        <label>
          Gemini API key
          <input
            aria-label="Gemini API key"
            type="password"
            value={geminiKey}
            onChange={(event) => setGeminiKey(event.target.value)}
            placeholder="AIza…"
            autoComplete="off"
          />
        </label>
        <button onClick={() => save("gemini", geminiKey)}>
          Save Gemini key
        </button>
        <small>{status}</small>
      </div>
    </>
  );
}
type NotebookCell = { id: string; type: "code" | "text"; source: string; output?: string };
const newNotebookCell = (type: NotebookCell["type"]): NotebookCell => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type,
  source: type === "code" ? "print('Hello, AsV!')" : "# Notes\nWrite your explanation here.",
});
function Notebook({ theme, onBack }: { theme: string; onBack: () => void }) {
  const [title, setTitle] = useState("Untitled notebook");
  const [language, setLanguage] = useState("Python");
  const [cells, setCells] = useState<NotebookCell[]>([newNotebookCell("text"), newNotebookCell("code")]);
  const [ready, setReady] = useState(false);
  const runningCell = useRef<string | null>(null);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("asv-ide-notebook") || "null",
      );
      if (saved?.title) setTitle(saved.title);
      if (saved?.language) setLanguage(saved.language);
      if (Array.isArray(saved?.cells) && saved.cells.length) setCells(saved.cells);
      else if (saved?.code) setCells([{ ...newNotebookCell("code"), source: saved.code }]);
    } catch {
      /* keep a fresh notebook */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      localStorage.setItem(
        "asv-ide-notebook",
        JSON.stringify({ cells, title, language }),
      );
  }, [ready, cells, title, language]);
  useEffect(() => {
    const receive = (event: Event) => {
      const id = runningCell.current;
      if (!id) return;
      const output = (event as CustomEvent<string>).detail;
      setCells((current) => current.map((cell) => cell.id === id ? { ...cell, output } : cell));
      runningCell.current = null;
    };
    window.addEventListener("asv-execute-output", receive);
    return () => window.removeEventListener("asv-execute-output", receive);
  }, []);
  const updateCell = (id: string, source: string) =>
    setCells((current) => current.map((cell) => cell.id === id ? { ...cell, source } : cell));
  const runCell = (cell: NotebookCell) => {
    const runner = (
      window as Window & {
        asvExecutor?: { run: (value: string, source: string) => void };
      }
    ).asvExecutor;
    if (!runner) {
      setCells((current) => current.map((item) => item.id === cell.id ? { ...item, output: "Open the macOS AsV_IDE app to run this notebook cell locally." } : item));
      return;
    }
    runningCell.current = cell.id;
    setCells((current) => current.map((item) => item.id === cell.id ? { ...item, output: `Running ${language} locally…` } : item));
    runner.run(language, cell.source);
  };
  const codeCellKeyDown = (cell: NotebookCell, event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" && event.key !== "Tab") return;
    const area = event.currentTarget;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const before = cell.source.slice(0, start);
    const after = cell.source.slice(end);
    event.preventDefault();
    if (event.key === "Tab") {
      updateCell(cell.id, `${before}  ${after}`);
      window.requestAnimationFrame(() => { area.selectionStart = start + 2; area.selectionEnd = start + 2; });
      return;
    }
    const line = before.slice(before.lastIndexOf("\n") + 1);
    const indent = (line.match(/^\s*/)?.[0] || "") + (line.trimEnd().endsWith(":") ? "  " : "");
    updateCell(cell.id, `${before}\n${indent}${after}`);
    window.requestAnimationFrame(() => { area.selectionStart = start + indent.length + 1; area.selectionEnd = start + indent.length + 1; });
  };
  return (
    <main className={`notebook theme-${theme}`}>
      <header className="notebook-top">
        <div className="brand">
          <b>
            A<span>V</span>
          </b>
          <strong>AsV_IDE</strong>
          <em>NOTEBOOK</em>
        </div>
        <div className="notebook-actions">
          <span>● Saved locally</span>
          <button className="visual-button" onClick={() => setCells((current) => [...current, newNotebookCell("code")])}>＋ Code</button>
          <button className="visual-button" onClick={() => setCells((current) => [...current, newNotebookCell("text")])}>＋ Text</button>
          <button className="visual-button" onClick={() => setCells((current) => current.map((cell) => ({ ...cell, output: "" })))}>Clear output</button>
          <button className="visual-button" onClick={onBack}>← IDE</button>
        </div>
      </header>
      <section className="notebook-sheet">
        <div className="notebook-title">
              <span>LOCAL NOTEBOOK · AUTOSAVED · COLAB-STYLE CELLS</span>
          <input
            aria-label="Notebook title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="notebook-toolbar"><span>Runtime: local {language}</span><select aria-label="Notebook language" value={language} onChange={(event) => setLanguage(event.target.value)}>{["Python", "JavaScript", "Lua", "Ruby"].map((item) => <option key={item}>{item}</option>)}</select><span>Code executes on this Mac only.</span></div>
        </div>
        {cells.map((cell, index) => <article className={`note-cell ${cell.type === "code" ? "code-cell" : "text-cell"}`} key={cell.id}>
          <div className="cell-head"><span>{cell.type === "code" ? "⌘ CODE" : "T TEXT"} · CELL {index + 1}</span>{cell.type === "code" && <button className="cell-play" onClick={() => runCell(cell)} aria-label={`Run cell ${index + 1}`}>▶ Run</button>}<button className="cell-remove" onClick={() => setCells((current) => current.length === 1 ? current : current.filter((item) => item.id !== cell.id))} aria-label={`Remove cell ${index + 1}`}>×</button></div>
          <textarea aria-label={`${cell.type} cell ${index + 1}`} spellCheck={cell.type !== "code"} value={cell.source} onChange={(event) => updateCell(cell.id, event.target.value)} onKeyDown={cell.type === "code" ? (event) => codeCellKeyDown(cell, event) : undefined} />
          {cell.type === "code" && <pre>{cell.output || "Run this cell to see local output."}</pre>}
          <div className="cell-add-row"><button onClick={() => setCells((current) => { const at = current.findIndex((item) => item.id === cell.id); return [...current.slice(0, at + 1), newNotebookCell("code"), ...current.slice(at + 1)]; })}>＋ Code</button><button onClick={() => setCells((current) => { const at = current.findIndex((item) => item.id === cell.id); return [...current.slice(0, at + 1), newNotebookCell("text"), ...current.slice(at + 1)]; })}>＋ Text</button></div>
        </article>)}
      </section>
    </main>
  );
}
