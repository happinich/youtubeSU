"use client";

import { formatSeconds } from "@/lib/utils";
import type { SummaryJSON } from "@/lib/summarize";

interface SummaryPanelProps {
  summary: SummaryJSON;
  onSeek: (sec: number) => void;
}

function TsBtn({ sec, onSeek }: { sec: number; onSeek: (s: number) => void }) {
  return (
    <button onClick={() => onSeek(sec)}
      style={{ font: "600 12px var(--font-mono, monospace)", color: "var(--st-ink)", background: "var(--st-paper)", border: "1px solid var(--st-line)", padding: "4px 9px", borderRadius: 6, cursor: "pointer", height: "fit-content", transition: "background .15s, border-color .15s", textAlign: "center", whiteSpace: "nowrap" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--st-accent-soft)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--st-accent)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--st-paper)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--st-line)"; }}>
      {formatSeconds(sec)}
    </button>
  );
}

export function SummaryPanel({ summary, onSeek }: SummaryPanelProps) {
  return (
    <div style={{ fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>

      {/* Tags */}
      {summary.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 32 }}>
          {summary.tags.map((tag, i) => (
            <span key={i} style={{ font: "500 11px var(--font-mono, monospace)", padding: "3px 10px", borderRadius: 999, background: "var(--st-paper-2)", color: "var(--st-ink-3)", border: "1px solid var(--st-line-2)" }}>{tag}</span>
          ))}
        </div>
      )}

      {/* Key Points */}
      {summary.key_points?.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ font: "700 18px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
            🔑 핵심 포인트 <span style={{ font: "500 12px var(--font-mono, monospace)", color: "var(--st-ink-3)", fontWeight: 400 }}>{summary.key_points.length}개</span>
          </h2>
          {summary.key_points.map((kp, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 16, marginBottom: 20 }}>
              <TsBtn sec={kp.timestamp_sec} onSeek={onSeek} />
              <div>
                <h3 style={{ margin: "0 0 4px", font: "600 15px var(--font-inter, Inter)", color: "var(--st-ink)", letterSpacing: "-0.01em" }}>{kp.title}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.55 }}>{kp.content}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Sections */}
      {summary.sections?.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ font: "700 18px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 14px" }}>📑 섹션별 요약</h2>
          {summary.sections.map((sec, i) => (
            <div key={i} style={{ border: "1px solid var(--st-line)", borderRadius: 10, padding: "16px 18px", marginBottom: 10, background: "var(--st-paper)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <h3 style={{ margin: 0, font: "600 15px var(--font-inter, Inter)", color: "var(--st-ink)" }}>{sec.title}</h3>
                <button onClick={() => onSeek(sec.start_sec)}
                  style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  {formatSeconds(sec.start_sec)} — {formatSeconds(sec.end_sec)}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.55 }}>{sec.summary}</p>
            </div>
          ))}
        </section>
      )}

      {/* Quotes */}
      {summary.quotes?.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ font: "700 18px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 14px" }}>💬 인상적인 발언</h2>
          {summary.quotes.map((q, i) => (
            <div key={i} style={{ borderLeft: "3px solid var(--st-accent)", padding: "2px 0 2px 14px", marginBottom: 14, font: "500 15px/1.5 var(--font-inter, Inter)", color: "var(--st-ink)", fontStyle: "italic" }}>
              "{q}"
            </div>
          ))}
        </section>
      )}

      {/* Action Items */}
      {summary.action_items?.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ font: "700 18px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)", margin: "0 0 14px" }}>✅ 실행 아이템</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {summary.action_items.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.55 }}>
                <span style={{ width: 18, height: 18, border: "2px solid var(--st-accent)", borderRadius: 4, flexShrink: 0, marginTop: 2, display: "inline-block" }} />
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Background & Opposing */}
      {(summary.background || summary.opposing_views) && (
        <div style={{ display: "grid", gap: 12, marginBottom: 36 }}>
          {summary.background && (
            <div style={{ borderRadius: 10, background: "var(--st-paper-2)", padding: "16px 18px" }}>
              <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>배경 지식</div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.55 }}>{summary.background}</p>
            </div>
          )}
          {summary.opposing_views && (
            <div style={{ borderRadius: 10, background: "var(--st-paper-2)", padding: "16px 18px" }}>
              <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>반대 관점 / 한계</div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--st-ink-2)", lineHeight: 1.55 }}>{summary.opposing_views}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
