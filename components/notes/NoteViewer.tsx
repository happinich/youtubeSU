"use client";

import { useEffect, useRef, useCallback } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SummaryPanel } from "./SummaryPanel";
import { TranscriptPanel } from "./TranscriptPanel";
import { ChatPanel } from "./ChatPanel";
import { useNoteStore } from "@/store/noteStore";
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
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: { onReady?: (e: { target: YTPlayer }) => void };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  seekTo: (sec: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
}

export function NoteViewer({ noteId, videoId, summary, segments }: NoteViewerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setPlayerCurrentTime, setSummary, setSegments } = useNoteStore();

  useEffect(() => {
    setSummary(summary);
    setSegments(segments);
  }, [summary, segments, setSummary, setSegments]);

  const seekTo = useCallback((sec: number) => {
    playerRef.current?.seekTo(sec, true);
  }, []);

  useEffect(() => {
    const loadPlayer = () => {
      playerRef.current = new window.YT.Player("yt-player", {
        videoId,
        playerVars: { autoplay: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            intervalRef.current = setInterval(() => {
              if (playerRef.current) {
                setPlayerCurrentTime(playerRef.current.getCurrentTime());
              }
            }, 500);
          },
        },
      });
    };

    if (window.YT?.Player) {
      loadPlayer();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = loadPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [videoId, setPlayerCurrentTime]);

  return (
    <div className="h-[calc(100vh-140px)] border rounded-xl overflow-hidden bg-background">
      <PanelGroup direction="horizontal" className="h-full">

        {/* Left: Player + Transcript */}
        <Panel defaultSize={24} minSize={16} maxSize={40}>
          <div className="flex flex-col h-full bg-muted/20">
            <div className="relative w-full aspect-video bg-black shrink-0">
              <div id="yt-player" className="absolute inset-0 w-full h-full" />
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="px-3 py-2 border-b">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">스크립트</p>
              </div>
              <TranscriptPanel segments={segments} onSeek={seekTo} />
            </div>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />

        {/* Center: Summary document */}
        <Panel defaultSize={52} minSize={30}>
          <ScrollArea className="h-full">
            <div className="px-8 py-8">
              <SummaryPanel summary={summary} onSeek={seekTo} />
            </div>
          </ScrollArea>
        </Panel>

        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/40 transition-colors cursor-col-resize" />

        {/* Right: Chat */}
        <Panel defaultSize={24} minSize={16} maxSize={40}>
          <div className="flex flex-col h-full border-l">
            <div className="px-4 py-3 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">LILY</p>
            </div>
            <div className="flex-1 overflow-hidden p-3">
              <ChatPanel noteId={noteId} />
            </div>
          </div>
        </Panel>

      </PanelGroup>
    </div>
  );
}
