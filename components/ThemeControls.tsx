"use client";

import { useEffect, useState } from "react";

const ACCENTS = [
  { label: "앰버",   h: 55,  preview: "oklch(0.72 0.15 55)" },
  { label: "오렌지", h: 35,  preview: "oklch(0.72 0.15 35)" },
  { label: "블루",   h: 250, preview: "oklch(0.72 0.15 250)" },
  { label: "그린",   h: 145, preview: "oklch(0.72 0.15 145)" },
  { label: "퍼플",   h: 290, preview: "oklch(0.72 0.15 290)" },
  { label: "핑크",   h: 350, preview: "oklch(0.72 0.15 350)" },
];

export function ThemeControls() {
  const [dark, setDark] = useState(false);
  const [accentH, setAccentH] = useState(55);
  const [panelOpen, setPanelOpen] = useState(false);

  // Init from localStorage
  useEffect(() => {
    const savedDark = localStorage.getItem("st-dark") === "1";
    const savedH = parseInt(localStorage.getItem("st-accent-h") ?? "55", 10);
    setDark(savedDark);
    setAccentH(savedH);
    applyTheme(savedDark, savedH);
  }, []);

  function applyTheme(isDark: boolean, h: number) {
    const root = document.documentElement;
    root.style.setProperty("--st-accent-h", String(h));
    if (isDark) {
      root.style.setProperty("--st-ink",     "oklch(0.93 0.006 80)");
      root.style.setProperty("--st-ink-2",   "oklch(0.72 0.008 80)");
      root.style.setProperty("--st-ink-3",   "oklch(0.55 0.008 80)");
      root.style.setProperty("--st-ink-4",   "oklch(0.42 0.005 80)");
      root.style.setProperty("--st-line",    "oklch(0.28 0.006 80)");
      root.style.setProperty("--st-line-2",  "oklch(0.24 0.006 80)");
      root.style.setProperty("--st-paper",   "oklch(0.16 0.006 80)");
      root.style.setProperty("--st-paper-2", "oklch(0.13 0.006 80)");
      root.style.setProperty("--st-paper-3", "oklch(0.20 0.006 80)");
    } else {
      root.style.setProperty("--st-ink",     "oklch(0.22 0.01 70)");
      root.style.setProperty("--st-ink-2",   "oklch(0.42 0.01 70)");
      root.style.setProperty("--st-ink-3",   "oklch(0.58 0.01 70)");
      root.style.setProperty("--st-ink-4",   "oklch(0.72 0.005 70)");
      root.style.setProperty("--st-line",    "oklch(0.90 0.006 80)");
      root.style.setProperty("--st-line-2",  "oklch(0.94 0.006 80)");
      root.style.setProperty("--st-paper",   "oklch(0.99 0.005 85)");
      root.style.setProperty("--st-paper-2", "oklch(0.97 0.008 85)");
      root.style.setProperty("--st-paper-3", "oklch(0.94 0.01 85)");
    }
  }

  function toggleDark() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("st-dark", next ? "1" : "0");
    applyTheme(next, accentH);
  }

  function changeAccent(h: number) {
    setAccentH(h);
    localStorage.setItem("st-accent-h", String(h));
    applyTheme(dark, h);
    setPanelOpen(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative" }}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        title={dark ? "라이트 모드" : "다크 모드"}
        style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid var(--st-line)",
          background: "var(--st-paper-2)", cursor: "pointer", fontSize: 15,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--st-ink-2)",
        }}
      >
        {dark ? "☀️" : "🌙"}
      </button>

      {/* Accent color button */}
      <button
        onClick={() => setPanelOpen(o => !o)}
        title="색상 변경"
        style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid var(--st-line)",
          background: `oklch(0.72 0.15 ${accentH})`,
          cursor: "pointer",
        }}
      />

      {/* Accent panel */}
      {panelOpen && (
        <>
          <div onClick={() => setPanelOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--st-paper)", border: "1px solid var(--st-line)",
            borderRadius: 12, padding: "12px 14px", zIndex: 100,
            boxShadow: "0 8px 28px -4px oklch(0.2 0 0 / 0.2)",
            minWidth: 180,
          }}>
            <div style={{ font: "600 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", marginBottom: 10 }}>ACCENT COLOR</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ACCENTS.map(a => (
                <button
                  key={a.h}
                  onClick={() => changeAccent(a.h)}
                  title={a.label}
                  style={{
                    width: 28, height: 28, borderRadius: "50%", border: `2px solid ${accentH === a.h ? "var(--st-ink)" : "transparent"}`,
                    background: a.preview, cursor: "pointer",
                    outline: accentH === a.h ? `3px solid ${a.preview}` : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
