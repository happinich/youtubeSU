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
    super(`이 영상(${videoId})은 자막/스크립트를 제공하지 않습니다.`);
    this.name = "NoTranscriptError";
  }
}

const YT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export async function getTranscript(videoId: string): Promise<TranscriptItem[]> {
  // YouTube 영상 페이지에서 자막 트랙 URL 추출
  const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: YT_HEADERS,
  });

  if (!res.ok) throw new Error(`YouTube 페이지 요청 실패: ${res.status}`);

  const html = await res.text();

  // ytInitialPlayerResponse 추출
  const match = html.match(/ytInitialPlayerResponse\s*=\s*(\{[\s\S]+?\})\s*(?:;|<\/script>)/);
  if (!match) throw new Error("ytInitialPlayerResponse를 찾을 수 없습니다.");

  let playerResponse: Record<string, unknown>;
  try {
    playerResponse = JSON.parse(match[1]);
  } catch {
    throw new Error("ytInitialPlayerResponse JSON 파싱 실패");
  }

  const captionTracks = (
    playerResponse?.captions as Record<string, unknown>
  )?.playerCaptionsTracklistRenderer as Record<string, unknown>;

  const tracks = captionTracks?.captionTracks as Array<{
    baseUrl: string;
    languageCode: string;
    kind?: string;
    name?: { simpleText?: string };
  }> | undefined;

  if (!tracks || tracks.length === 0) throw new NoTranscriptError(videoId);

  // 한국어 수동 → 영어 수동 → 한국어 자동생성 → 영어 자동생성 → 첫 번째 순으로 선택
  const preferred = [
    tracks.find((t) => t.languageCode === "ko" && !t.kind),
    tracks.find((t) => t.languageCode === "en" && !t.kind),
    tracks.find((t) => t.languageCode === "ko"),
    tracks.find((t) => t.languageCode === "en"),
    tracks[0],
  ].find(Boolean)!;

  const captionUrl = preferred.baseUrl + "&fmt=json3";
  const captionRes = await fetch(captionUrl, { headers: YT_HEADERS });
  if (!captionRes.ok) throw new Error(`자막 데이터 요청 실패: ${captionRes.status}`);

  const captionData = await captionRes.json() as {
    events?: Array<{ tStartMs: number; dDurationMs?: number; segs?: Array<{ utf8: string }> }>;
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
