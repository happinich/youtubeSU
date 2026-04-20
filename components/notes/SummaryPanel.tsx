"use client";

import { Badge } from "@/components/ui/badge";
import { formatSeconds } from "@/lib/utils";
import type { SummaryJSON } from "@/lib/summarize";

interface SummaryPanelProps {
  summary: SummaryJSON;
  onSeek: (sec: number) => void;
}

function TimestampPill({ sec, onSeek }: { sec: number; onSeek: (s: number) => void }) {
  return (
    <button
      onClick={() => onSeek(sec)}
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
    >
      {formatSeconds(sec)}
    </button>
  );
}

export function SummaryPanel({ summary, onSeek }: SummaryPanelProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-10 pb-16 px-2">

      {/* TL;DR */}
      {summary.tldr && (
        <div className="text-base leading-relaxed text-foreground/90 border-l-4 border-primary pl-4 py-1">
          {summary.tldr}
        </div>
      )}

      {/* Tags */}
      {summary.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {summary.tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs rounded-full px-3">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Table of Contents */}
      {summary.sections?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">목차</p>
          <ol className="space-y-1.5">
            {summary.sections.map((sec, i) => (
              <li key={i}>
                <button
                  onClick={() => onSeek(sec.start_sec)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                >
                  {i + 1}. {sec.title}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <hr className="border-border" />

      {/* Key Points */}
      {summary.key_points?.length > 0 && (
        <section className="space-y-4">
          {summary.key_points.map((kp, i) => (
            <div key={i} className="flex gap-4 group">
              <TimestampPill sec={kp.timestamp_sec} onSeek={onSeek} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug mb-1">{kp.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{kp.content}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      <hr className="border-border" />

      {/* Sections */}
      {summary.sections?.length > 0 && (
        <div className="space-y-10">
          {summary.sections.map((sec, i) => (
            <section key={i}>
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-lg font-bold leading-snug">
                  {i + 1}. {sec.title}
                </h2>
                <TimestampPill sec={sec.start_sec} onSeek={onSeek} />
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{sec.summary}</p>
            </section>
          ))}
        </div>
      )}

      {/* Quotes */}
      {summary.quotes?.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">주요 발언</p>
          <div className="space-y-3">
            {summary.quotes.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-muted-foreground/30 pl-4 text-sm italic text-muted-foreground leading-relaxed">
                {q}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Action Items */}
      {summary.action_items?.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">실행 아이템</p>
          <ul className="space-y-2">
            {summary.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-primary/40 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-sm bg-primary/60" />
                </span>
                <span className="text-foreground/80 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Background & Opposing Views */}
      {(summary.background || summary.opposing_views) && (
        <div className="grid grid-cols-1 gap-4">
          {summary.background && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">배경 지식</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{summary.background}</p>
            </div>
          )}
          {summary.opposing_views && (
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">반대 관점 / 한계</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{summary.opposing_views}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
