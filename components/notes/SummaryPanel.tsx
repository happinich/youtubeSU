"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatSeconds } from "@/lib/utils";
import type { SummaryJSON } from "@/lib/summarize";
import { Clock, Lightbulb, FileText, Quote, CheckSquare, Tag } from "lucide-react";

interface SummaryPanelProps {
  summary: SummaryJSON;
  onSeek: (sec: number) => void;
}

export function SummaryPanel({ summary, onSeek }: SummaryPanelProps) {
  return (
    <div className="space-y-6 pb-6">
      {summary.tldr && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-4">
            <p className="text-sm font-medium text-primary mb-1">TL;DR</p>
            <p className="text-sm leading-relaxed">{summary.tldr}</p>
          </CardContent>
        </Card>
      )}

      {summary.key_points?.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 font-semibold text-sm mb-3">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            핵심 포인트
          </h3>
          <div className="space-y-2">
            {summary.key_points.map((kp, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-auto px-2 py-1 text-xs text-primary font-mono"
                  onClick={() => onSeek(kp.timestamp_sec)}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {formatSeconds(kp.timestamp_sec)}
                </Button>
                <div>
                  <p className="text-sm font-medium">{kp.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kp.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.sections?.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 font-semibold text-sm mb-3">
            <FileText className="h-4 w-4 text-blue-500" />
            섹션별 요약
          </h3>
          <div className="space-y-2">
            {summary.sections.map((sec, i) => (
              <div key={i} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-0.5 text-xs text-muted-foreground font-mono"
                    onClick={() => onSeek(sec.start_sec)}
                  >
                    {formatSeconds(sec.start_sec)} ~ {formatSeconds(sec.end_sec)}
                  </Button>
                  <p className="font-medium text-sm">{sec.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{sec.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {summary.quotes?.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 font-semibold text-sm mb-3">
            <Quote className="h-4 w-4 text-purple-500" />
            주요 발언
          </h3>
          <div className="space-y-2">
            {summary.quotes.map((q, i) => (
              <blockquote key={i} className="border-l-2 border-purple-300 pl-3 text-sm italic text-muted-foreground">
                {q}
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {summary.action_items?.length > 0 && (
        <section>
          <h3 className="flex items-center gap-1.5 font-semibold text-sm mb-3">
            <CheckSquare className="h-4 w-4 text-green-500" />
            실행 아이템
          </h3>
          <ul className="space-y-1">
            {summary.action_items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded border border-green-400 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-sm bg-green-400" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {summary.background && (
        <section>
          <h3 className="font-semibold text-sm mb-2">배경 지식</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.background}</p>
        </section>
      )}

      {summary.opposing_views && (
        <section>
          <h3 className="font-semibold text-sm mb-2">반대 관점 / 한계</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{summary.opposing_views}</p>
        </section>
      )}

      {summary.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Tag className="h-4 w-4 text-muted-foreground" />
          {summary.tags.map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
