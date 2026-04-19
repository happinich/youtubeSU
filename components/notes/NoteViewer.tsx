"use client";

import { useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
          events?: { onReady?: (e: { target: YTPlayer }) => void; onStateChange?: () => void };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number };
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
          <div id="yt-player" className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      <div>
        <Tabs defaultValue="summary">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1">요약</TabsTrigger>
            <TabsTrigger value="transcript" className="flex-1">자막</TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">채팅</TabsTrigger>
          </TabsList>
          <TabsContent value="summary">
            <ScrollArea className="h-[600px] pr-1">
              <SummaryPanel summary={summary} onSeek={seekTo} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="transcript">
            <TranscriptPanel segments={segments} onSeek={seekTo} />
          </TabsContent>
          <TabsContent value="chat">
            <ChatPanel noteId={noteId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
