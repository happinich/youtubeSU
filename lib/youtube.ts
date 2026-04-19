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

export async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  const raw = await YoutubeTranscript.fetchTranscript(videoId, { lang: "ko" }).catch(() =>
    YoutubeTranscript.fetchTranscript(videoId)
  );
  return raw.map((item, i) => ({
    text: item.text,
    startSec: item.offset / 1000,
    endSec: (item.offset + item.duration) / 1000,
    seq: i,
  }));
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
