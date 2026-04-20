"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";

function LandingContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const [url, setUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0); // 0=idle,1,2,3,4=done
  const [procUrl, setProcUrl] = useState("");
  const [noteId, setNoteId] = useState("");

  const steps = [
    "영상 메타데이터 가져오기",
    "자막 추출 (한국어)",
    "AI 요약 생성 중…",
    "타임스탬프 연결",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setProcUrl(url.trim());
    setProcessing(true);
    setStep(1);

    // Animate steps while API processes
    const timer1 = setTimeout(() => setStep(2), 900);
    const timer2 = setTimeout(() => setStep(3), 2000);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setNoteId(id);
        setStep(4);
        clearTimeout(timer1); clearTimeout(timer2);
      } else {
        setProcessing(false); setStep(0);
        clearTimeout(timer1); clearTimeout(timer2);
      }
    } catch {
      setProcessing(false); setStep(0);
      clearTimeout(timer1); clearTimeout(timer2);
    }
  }

  const features = [
    { num: "01", title: "TL;DR 부터 섹션별 정리까지", desc: "한 줄 요약, 핵심 포인트, 섹션 요약 — 읽기 흐름에 맞춰 자동으로 구조화됩니다.", label: "즉시 요약" },
    { num: "02", title: "클릭 한 번으로 그 장면", desc: "모든 핵심 포인트는 원본 영상 구간과 연결. 궁금한 부분만 바로 확인하세요.", label: "타임스탬프" },
    { num: "03", title: "영상에 대해 물어보세요", desc: '"이 부분 설명해줘", "반대 의견은?" — 요약을 넘어 깊이 있는 대화가 가능합니다.', label: "AI 채팅" },
  ];

  return (
    <div style={{ background: "var(--st-paper-2)", minHeight: "100vh", color: "var(--st-ink)", fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>

      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 56px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>
          SummaryTube<span style={{ color: "var(--st-accent)" }}>.</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["기능","요금제","탐색","도움말"].map(l => (
            <a key={l} href="#" style={{ color: "var(--st-ink-2)", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {session ? (
            <Link href="/dashboard" style={{ background: "var(--st-ink)", color: "var(--st-paper)", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: "none", border: "none" }}>
              대시보드 →
            </Link>
          ) : (
            <>
              <button onClick={() => signIn("google")} style={{ fontSize: 13, color: "var(--st-ink-2)", fontWeight: 500, background: "none", border: "none", cursor: "pointer", padding: "8px 14px" }}>로그인</button>
              <button onClick={() => signIn("google")} style={{ background: "var(--st-ink)", color: "var(--st-paper)", padding: "9px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer" }}>
                시작하기 →
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 999, background: "var(--st-accent-soft)", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", fontFamily: "var(--font-mono, monospace)", marginBottom: 20, color: "var(--st-ink)" }}>
          ✦ 한국어 최적화 · 무료 시작
        </div>
        <h1 style={{ fontWeight: 800, fontSize: "clamp(40px, 5.6vw, 72px)", lineHeight: 1.02, letterSpacing: "-0.03em", margin: "0 0 20px", color: "var(--st-ink)" }}>
          긴 영상을,<br />
          <span style={{ background: "linear-gradient(180deg, transparent 62%, var(--st-accent-soft) 62%)", padding: "0 2px" }}>
            3분 만에 읽으세요.
          </span>
        </h1>
        <p style={{ fontSize: 17, color: "var(--st-ink-2)", maxWidth: 580, margin: "0 auto 32px", lineHeight: 1.55 }}>
          YouTube URL 하나로 구조화된 요약·타임스탬프·AI 채팅까지. 강의·뉴스·인터뷰·세미나 — 보지 않고도 핵심을 챙기세요.
        </p>

        {/* URL Bar */}
        <form onSubmit={handleSubmit} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--st-paper)", border: "1.5px solid var(--st-ink)", borderRadius: 14, padding: "6px 6px 6px 18px", maxWidth: 620, margin: "0 auto", boxShadow: "0 8px 30px -12px oklch(0.3 0.03 80 / 0.18)" }}>
          <span style={{ color: "var(--st-ink-3)", fontSize: 14 }}>▶</span>
          <input
            type="text"
            placeholder="YouTube URL을 붙여넣으세요…"
            value={url}
            onChange={e => setUrl(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", font: "500 15px var(--font-inter, Inter)", color: "var(--st-ink)", padding: "10px 8px" }}
          />
          <button type="submit" disabled={!url.trim()} style={{ background: "var(--st-accent)", color: "var(--st-ink)", border: "none", cursor: "pointer", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, opacity: url.trim() ? 1 : 0.5 }}>
            요약하기 →
          </button>
        </form>

        {/* Support chips */}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 18 }}>
          {[["YouTube", false], ["PDF · 곧", true], ["블로그 · 곧", true], ["오디오 · 곧", true]].map(([label, soon]) => (
            <span key={label as string} style={{ font: "500 12px var(--font-mono, monospace)", color: "var(--st-ink-3)", padding: "5px 11px", border: "1px solid var(--st-line)", borderRadius: 999, background: "var(--st-paper)", opacity: soon ? 0.55 : 1 }}>{label as string}</span>
          ))}
        </div>

        {/* Social proof */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 34, color: "var(--st-ink-3)", fontSize: 12 }}>
          <div style={{ display: "flex" }}>
            {["oklch(0.80 0.08 30)","oklch(0.80 0.08 140)","oklch(0.80 0.08 240)","oklch(0.80 0.08 320)"].map((c, i) => (
              <span key={i} style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid var(--st-paper-2)", marginLeft: i === 0 ? 0 : -6, background: c, display: "inline-block" }} />
            ))}
          </div>
          <span><b style={{ color: "var(--st-ink)", fontWeight: 600 }}>12,400+</b> 사용자가 이번 주에 요약했어요</span>
        </div>
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 56px 80px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
        {features.map(f => (
          <div key={f.num} style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 14, padding: 24 }}>
            <div style={{ font: "700 11px var(--font-mono, monospace)", color: "var(--st-accent-2)", letterSpacing: "0.08em" }}>{f.num} · {f.label}</div>
            <h3 style={{ margin: "10px 0 8px", font: "700 18px var(--font-inter, Inter)", letterSpacing: "-0.01em", color: "var(--st-ink)" }}>{f.title}</h3>
            <p style={{ margin: 0, color: "var(--st-ink-2)", fontSize: 13.5, lineHeight: 1.55 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Processing Modal */}
      {processing && (
        <div onClick={e => { if (e.target === e.currentTarget && step < 4) { setProcessing(false); setStep(0); }}} style={{ position: "fixed", inset: 0, background: "oklch(0.15 0.01 80 / 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 16, padding: 32, width: 460, boxShadow: "0 20px 60px -20px oklch(0.2 0.02 80 / 0.4)" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "var(--st-ink)", fontWeight: 700 }}>요약을 만들고 있어요</h3>
            <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", marginBottom: 18, wordBreak: "break-all" }}>{procUrl}</div>
            {steps.map((s, i) => {
              const done = step > i + 1;
              const active = step === i + 1;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", color: done || active ? "var(--st-ink)" : "var(--st-ink-3)", fontSize: 13, fontWeight: active ? 500 : 400 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: done || active ? "var(--st-accent)" : "var(--st-paper-3)", border: `1.5px solid ${done || active ? "var(--st-accent)" : "var(--st-line)"}`, display: "inline-block", flexShrink: 0, animation: active ? "st-dot-pulse 1.2s infinite" : "none" }} />
                  {s}
                </div>
              );
            })}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px dashed var(--st-line)", fontSize: 12, color: "var(--st-ink-3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{step < 4 ? "처리 중…" : "완료!"}</span>
              <button
                disabled={step < 4}
                onClick={() => { setProcessing(false); setStep(0); router.push(`/notes/${noteId}`); }}
                style={{ background: "var(--st-ink)", color: "var(--st-paper)", padding: "7px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: step >= 4 ? "pointer" : "default", opacity: step >= 4 ? 1 : 0.4 }}
              >
                열어보기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <LandingContent />
    </SessionProvider>
  );
}
