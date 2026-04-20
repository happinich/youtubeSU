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
  constructor(videoId: string, detail?: string) {
    super(`영상(${videoId}) 스크립트 추출 실패${detail ? `: ${detail}` : ""}`);
    this.name = "NoTranscriptError";
  }
}

interface CaptionTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string;
}

interface PlayerResponse {
  captions?: {
    playerCaptionsTracklistRenderer?: {
      captionTracks?: CaptionTrack[];
    };
  };
  playabilityStatus?: { status?: string; reason?: string };
}

const CLIENTS = [
  {
    name: "ANDROID",
    clientName: "ANDROID",
    clientVersion: "19.09.37",
    userAgent: "com.google.android.youtube/19.09.37 (Linux; U; Android 14) gzip",
    extra: { androidSdkVersion: 34 },
  },
  {
    name: "IOS",
    clientName: "IOS",
    clientVersion: "19.09.3",
    userAgent:
      "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X; en_US)",
    extra: { deviceModel: "iPhone14,3" },
  },
  {
    name: "WEB",
    clientName: "WEB",
    clientVersion: "2.20231219.04.00",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    extra: {},
  },
];

async function fetchPlayerResponse(
  videoId: string,
  client: (typeof CLIENTS)[number]
): Promise<PlayerResponse> {
  const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": client.userAgent,
      "X-YouTube-Client-Name": client.clientName === "WEB" ? "1" : client.clientName === "ANDROID" ? "3" : "5",
      "X-YouTube-Client-Version": client.clientVersion,
    },
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: client.clientName,
          clientVersion: client.clientVersion,
          hl: "ko",
          gl: "KR",
          ...client.extra,
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`${client.name} player API: HTTP ${res.status}`);
  return res.json();
}

async function fetchCaptionTracks(videoId: string): Promise<{ tracks: CaptionTrack[]; lastError?: string }> {
  let lastError: string | undefined;

  for (const client of CLIENTS) {
    try {
      const data = await fetchPlayerResponse(videoId, client);

      // 재생 불가 상태 체크
      if (data.playabilityStatus?.status && data.playabilityStatus.status !== "OK") {
        lastError = `[${client.name}] ${data.playabilityStatus.status}: ${data.playabilityStatus.reason ?? ""}`;
        continue;
      }

      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (tracks.length > 0) return { tracks };

      lastError = `[${client.name}] 자막 트랙 없음`;
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return { tracks: [], lastError };
}

export async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  const { tracks, lastError } = await fetchCaptionTracks(videoId);

  if (tracks.length === 0) throw new NoTranscriptError(videoId, lastError);

  const track =
    tracks.find((t) => t.languageCode === "ko" && !t.kind) ??
    tracks.find((t) => t.languageCode === "en" && !t.kind) ??
    tracks.find((t) => t.languageCode === "ko") ??
    tracks.find((t) => t.languageCode === "en") ??
    tracks[0];

  const captionRes = await fetch(`${track.baseUrl}&fmt=json3`);
  if (!captionRes.ok) {
    throw new NoTranscriptError(videoId, `자막 다운로드 실패 HTTP ${captionRes.status}`);
  }

  const captionData = (await captionRes.json()) as {
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
    if (!text) continue;
    segments.push({
      text,
      startSec: event.tStartMs / 1000,
      endSec: (event.tStartMs + (event.dDurationMs ?? 0)) / 1000,
      seq: segments.length,
    });
  }

  if (segments.length === 0) throw new NoTranscriptError(videoId, "자막 파싱 결과가 비어있음");
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
  const data = (await res.json()) as { title?: string; author_name?: string };
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
