import { YoutubeTranscript } from "youtube-transcript";

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export interface TranscriptItem {
  text: string;
  startSec: number;
  endSec: number;
  seq: number;
}

export class NoTranscriptError extends Error {
  constructor(videoId: string) {
    super(`이 영상(${videoId})은 자막이 제공되지 않습니다.`);
    this.name = "NoTranscriptError";
  }
}

export async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  // 한국어 → 영어 → 기본값 순으로 시도
  const attempts = [
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "ko" }),
    () => YoutubeTranscript.fetchTranscript(videoId, { lang: "en" }),
    () => YoutubeTranscript.fetchTranscript(videoId),
  ];

  for (const attempt of attempts) {
    try {
      const raw = await attempt();
      if (raw && raw.length > 0) {
        return raw.map((item, i) => ({
          text: item.text,
          startSec: item.offset / 1000,
          endSec: (item.offset + item.duration) / 1000,
          seq: i,
        }));
      }
    } catch {
      // 다음 시도로
    }
  }

  throw new NoTranscriptError(videoId);
}

export interface VideoMetadata {
  title: string;
  thumbnail: string;
  durationSec: number | null;
  authorName: string;
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const res = await fetch(oembedUrl);
  if (!res.ok) {
    return {
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationSec: null,
      authorName: "",
    };
  }
  const data = await res.json();
  return {
    title: data.title ?? "YouTube Video",
    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    durationSec: null,
    authorName: data.author_name ?? "",
  };
}

export function transcriptToText(segments: TranscriptItem[]): string {
  return segments.map((s) => s.text).join(" ");
}
