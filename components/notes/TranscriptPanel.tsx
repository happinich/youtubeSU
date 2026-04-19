"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { formatSeconds } from "@/lib/utils";
import { useNoteStore } from "@/store/noteStore";

interface Segment {
  id: string;
  startSec: number;
  endSec: number;
  text: string;
  seq: number;
}

export function TranscriptPanel({ segments, onSeek }: { segments: Segment[]; onSeek: (sec: number) => void }) {
  const currentTime = useNoteStore((s) => s.playerCurrentTime);
  const activeRef = useRef<HTMLDivElement>(null);

  const activeIndex = segments.findIndex((s) => currentTime >= s.startSec && currentTime < s.endSec);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeIndex]);

  if (segments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">자막을 불러올 수 없습니다.</p>;
  }

  return (
    <ScrollArea className="h-[500px] pr-2">
      <div className="space-y-1 pb-6">
        {segments.map((seg, i) => {
          const isActive = i === activeIndex;
          return (
            <div
              key={seg.id}
              ref={isActive ? activeRef : undefined}
              className={`flex gap-2 rounded-md px-2 py-1 transition-colors cursor-pointer hover:bg-muted/70 ${
                isActive ? "bg-primary/10 border-l-2 border-primary" : ""
              }`}
              onClick={() => onSeek(seg.startSec)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-auto px-1.5 py-0.5 text-xs font-mono text-muted-foreground w-14"
              >
                {formatSeconds(seg.startSec)}
              </Button>
              <p className={`text-sm leading-relaxed ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {seg.text}
              </p>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
