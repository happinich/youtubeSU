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
    super(`이 영상(${videoId})은 스크립트를 제공하지 않습니다.`);
    this.name = "NoTranscriptError";
  }
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  // YouTube InnerTube API — 브라우저와 동일한 방식으로 player 응답 요청
  const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "X-YouTube-Client-Name": "1",
      "X-YouTube-Client-Version": "2.20231219.04.00",
      Origin: "https://www.youtube.com",
      Referer: `https://www.youtube.com/watch?v=${videoId}`,
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20231219.04.00",
          hl: "ko",
          gl: "KR",
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`InnerTube API 오류: ${res.status}`);

  const data = await res.json() as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: CaptionTrack[];
      };
    };
  };

  return data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
}

export async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  const tracks = await fetchCaptionTracks(videoId);

  if (tracks.length === 0) throw new NoTranscriptError(videoId);

  // 한국어 수동 → 영어 수동 → 한국어 자동생성(asr) → 영어 자동생성 → 첫 번째
  const track =
    tracks.find((t) => t.languageCode === "ko" && !t.kind) ??
    tracks.find((t) => t.languageCode === "en" && !t.kind) ??
    tracks.find((t) => t.languageCode === "ko") ??
    tracks.find((t) => t.languageCode === "en") ??
    tracks[0];

  const captionRes = await fetch(`${track.baseUrl}&fmt=json3`);
  if (!captionRes.ok) throw new Error(`자막 데이터 요청 실패: ${captionRes.status}`);

  const captionData = await captionRes.json() as {
    events?: Array<{
      tStartMs: number;
      dDurationMs?: number;
      segs?: Array<{ utf8: string }>;
    }>;
  };

  const segments: TranscriptItem[] = [];
  for (const event of captionData.events ?? []) {
    if (!event.segs) continue;
    const text = event.segs
      .map((s) => s.utf8)
      .join("")
      .replace(/\n/g, " ")
      .trim();
    if (!text || text === " ") continue;
    segments.push({
      text,
      startSec: event.tStartMs / 1000,
      endSec: (event.tStartMs + (event.dDurationMs ?? 0)) / 1000,
      seq: segments.length,
    });
  }

  if (segments.length === 0) throw new NoTranscriptError(videoId);
  return segments;
}

export interface VideoMetadata {
  title: string;
  thumbnail: string;
  durationSec: number | null;
  authorName: string;
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );
  if (!res.ok) {
    return {
      title: "YouTube Video",
      thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      durationSec: null,
      authorName: "",
    };
  }
  const data = await res.json() as { title?: string; author_name?: string };
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
