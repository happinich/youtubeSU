import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface KeyPoint {
  title: string;
  content: string;
  timestamp_sec: number;
}

export interface Section {
  title: string;
  summary: string;
  start_sec: number;
  end_sec: number;
}

export interface SummaryJSON {
  tldr: string;
  key_points: KeyPoint[];
  sections: Section[];
  quotes: string[];
  action_items: string[];
  tags: string[];
  background: string;
  opposing_views: string;
}

const SYSTEM_PROMPT = `당신은 YouTube 영상 분석 전문가입니다.
주어진 자막을 바탕으로 한국어로 구조화된 노트를 작성하세요.
응답은 반드시 유효한 JSON 형식으로만 출력하세요. 다른 텍스트는 포함하지 마세요.

다음 JSON 스키마를 정확히 따르세요:
{
  "tldr": "한 줄 요약 (2-3문장)",
  "key_points": [
    { "title": "핵심 포인트 제목", "content": "내용 설명", "timestamp_sec": 120 }
  ],
  "sections": [
    { "title": "섹션 제목", "summary": "섹션 요약", "start_sec": 0, "end_sec": 300 }
  ],
  "quotes": ["인상적인 발언 1", "인상적인 발언 2"],
  "action_items": ["실행 가능한 아이템"],
  "tags": ["태그1", "태그2"],
  "background": "이 영상을 이해하기 위한 배경 지식",
  "opposing_views": "반대 관점이나 한계점"
}`;

const MAX_TRANSCRIPT_CHARS = 60000;

export async function summarize(
  transcript: string,
  title: string,
  durationSec: number | null
): Promise<SummaryJSON> {
  const truncated =
    transcript.length > MAX_TRANSCRIPT_CHARS
      ? transcript.slice(0, MAX_TRANSCRIPT_CHARS) + "\n[자막이 너무 길어 일부만 포함됨]"
      : transcript;

  const duration = durationSec ? `${Math.floor(durationSec / 60)}분 ${durationSec % 60}초` : "알 수 없음";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `영상 제목: ${title}\n영상 길이: ${duration}\n\n자막 내용:\n${truncated}`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("요약 결과에서 JSON을 찾을 수 없습니다.");

  return JSON.parse(jsonMatch[0]) as SummaryJSON;
}
