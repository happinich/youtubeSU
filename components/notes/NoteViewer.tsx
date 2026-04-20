"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { SummaryPanel } from "./SummaryPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { ChatOrb } from "./ChatOrb";
import { MindMapView } from "./MindMapView";
import { useNoteStore } from "@/store/noteStore";
import { formatSeconds } from "@/lib/utils";
import type { SummaryJSON } from "@/lib/summarize";

interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  seq: number;
}

interface NoteViewerProps {
  noteId: string;
  videoId: string;
  summary: SummaryJSON;
  segments: TranscriptSegment[];
  sourceTitle?: string | null;
  durationSec?: number | null;
}

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement | string, opts: {
        videoId: string;
        playerVars?: Record<string, unknown>;
        events?: { onReady?: (e: { target: YTPlayer }) => void };
      }) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
interface YTPlayer {
  seekTo: (sec: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
}

export function NoteViewer({ noteId, videoId, summary, segments, sourceTitle, durationSec }: NoteViewerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setPlayerCurrentTime, playerCurrentTime, setSummary, setSegments } = useNoteStore();
  const [activeTab, setActiveTab] = useState<"summary" | "transcript" | "mindmap">("summary");

  useEffect(() => { setSummary(summary); setSegments(segments); }, [summary, segments, setSummary, setSegments]);

  const seekTo = useCallback((sec: number) => { playerRef.current?.seekTo(sec, true); }, []);

  useEffect(() => {
    const loadPlayer = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            intervalRef.current = setInterval(() => {
              if (playerRef.current) setPlayerCurrentTime(playerRef.current.getCurrentTime());
            }, 500);
          },
        },
      });
    };
    if (window.YT?.Player) { loadPlayer(); }
    else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [videoId, setPlayerCurrentTime]);

  // Progress %
  const progress = durationSec && durationSec > 0 ? (playerCurrentTime / durationSec) * 100 : 23;

  // Active TOC item
  const activeToc = summary.sections?.findIndex(s => playerCurrentTime >= s.start_sec && playerCurrentTime < s.end_sec);

  return (
    <div className="nv-layout" style={{ fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>

      {/* Left sidebar */}
      <aside className="nv-sidebar">
        {/* Player */}
        <div style={{ aspectRatio: "16/9", borderRadius: 10, background: "linear-gradient(135deg, oklch(0.32 0.08 260), oklch(0.22 0.06 280))", position: "relative", overflow: "hidden", marginBottom: 10 }}>
          <div id="yt-player" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--st-line)", borderRadius: 2, marginBottom: 12, position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "var(--st-accent)", borderRadius: 2, width: `${Math.min(progress, 100)}%`, transition: "width .3s" }} />
        </div>

        <div style={{ fontSize: 12, color: "var(--st-ink-3)", marginBottom: 4 }}>
          {formatSeconds(playerCurrentTime)} {durationSec ? `/ ${formatSeconds(durationSec)}` : ""}
        </div>
        {sourceTitle && <div style={{ font: "600 13px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "4px 0 12px", lineHeight: 1.35 }}>{sourceTitle}</div>}

        {/* TOC */}
        {summary.sections?.length > 0 && (
          <>
            <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px 0 8px", borderTop: "1px solid var(--st-line)", marginTop: 4 }}>목차</div>
            {summary.sections.map((sec, i) => (
              <div key={i} onClick={() => seekTo(sec.start_sec)}
                style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", borderLeft: `2px solid ${activeToc === i ? "var(--st-accent)" : "transparent"}`, background: activeToc === i ? "var(--st-accent-soft)" : "transparent", marginBottom: 2, transition: "background .15s" }}>
                <span style={{ font: "500 11px var(--font-mono, monospace)", color: activeToc === i ? "var(--st-accent-2)" : "var(--st-ink-3)" }}>{formatSeconds(sec.start_sec)}</span>
                <span style={{ fontSize: 13, color: activeToc === i ? "var(--st-ink)" : "var(--st-ink-2)", fontWeight: activeToc === i ? 500 : 400, lineHeight: 1.3 }}>{sec.title}</span>
              </div>
            ))}
          </>
        )}
      </aside>

      {/* Main content */}
      <main className="nv-main">
        <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          YouTube · {durationSec ? `${Math.floor(durationSec / 60)}분` : ""} · 한국어 요약
        </div>
        {sourceTitle && (
          <h1 style={{ font: "800 38px/1.1 var(--font-inter, Inter)", letterSpacing: "-0.03em", margin: "0 0 24px", color: "var(--st-ink)" }}>
            {sourceTitle}
          </h1>
        )}

        {/* TL;DR */}
        {summary.tldr && (
          <div style={{ background: "var(--st-accent-soft)", borderRadius: 14, padding: "22px 24px", marginBottom: 40, border: "1px solid oklch(0.72 0.15 55 / 0.2)" }}>
            <div style={{ font: "700 11px var(--font-mono, monospace)", color: "var(--st-accent-2)", letterSpacing: "0.1em", marginBottom: 8 }}>TL;DR</div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: "var(--st-ink)", fontWeight: 500 }}>{summary.tldr}</p>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--st-line)", marginBottom: 28, position: "sticky", top: 110, background: "var(--st-paper-2)", zIndex: 5, paddingTop: 4 }}>
          {([
            { key: "summary", label: "요약" },
            { key: "mindmap", label: "마인드맵" },
            { key: "transcript", label: "자막" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 14px", font: "600 13px var(--font-inter, Inter)", color: activeTab === tab.key ? "var(--st-ink)" : "var(--st-ink-3)", borderBottom: activeTab === tab.key ? "2px solid var(--st-ink)" : "2px solid transparent", marginBottom: -1 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "summary" ? (
          <SummaryPanel summary={summary} onSeek={seekTo} />
        ) : activeTab === "mindmap" ? (
          <MindMapView summary={summary} sourceTitle={sourceTitle} onSeek={seekTo} />
        ) : (
          <TranscriptPanel segments={segments} onSeek={seekTo} />
        )}
      </main>

      {/* Floating chat orb */}
      <ChatOrb noteId={noteId} />
    </div>
  );
}
