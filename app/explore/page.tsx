import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ThemeControls } from "@/components/ThemeControls";

function formatDur(sec: number | null) {
  if (!sec) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function ExplorePage() {
  const notes = await prisma.note.findMany({
    where: { isPublic: true, status: "DONE" },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: {
      id: true, sourceTitle: true, sourceThumbnail: true,
      durationSec: true, summary: true, createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--st-paper-2)", fontFamily: "var(--font-inter, Inter), var(--font-noto, sans-serif)" }}>
      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "13px 56px", background: "var(--st-paper)", borderBottom: "1px solid var(--st-line)", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/" style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", textDecoration: "none", color: "var(--st-ink)" }}>
          SummaryTube<span style={{ color: "var(--st-accent)" }}>.</span>
        </Link>
        <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 500, color: "var(--st-ink-2)", textDecoration: "none", padding: "6px 10px", borderRadius: 8 }}>대시보드</Link>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--st-ink)", padding: "6px 10px", borderRadius: 8, background: "var(--st-paper-2)" }}>탐색</span>
        <div style={{ marginLeft: "auto" }}><ThemeControls /></div>
      </div>

      {/* Hero */}
      <div style={{ padding: "48px 56px 36px", borderBottom: "1px solid var(--st-line)", background: "var(--st-paper)" }}>
        <div style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>커뮤니티 노트</div>
        <h1 style={{ font: "800 40px/1.1 var(--font-inter, Inter)", letterSpacing: "-0.03em", margin: "0 0 12px", color: "var(--st-ink)" }}>
          모두의 요약 탐색
        </h1>
        <p style={{ margin: 0, fontSize: 16, color: "var(--st-ink-2)", lineHeight: 1.55 }}>
          다른 사용자들이 공개한 YouTube 영상 요약을 둘러보세요.
        </p>
      </div>

      {/* Grid */}
      <div style={{ padding: "32px 56px 80px", maxWidth: 1200, margin: "0 auto" }}>
        {notes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--st-ink-3)" }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>🔍</div>
            <div style={{ font: "600 16px var(--font-inter, Inter)", color: "var(--st-ink-2)", marginBottom: 8 }}>아직 공개된 노트가 없어요</div>
            <div style={{ fontSize: 14 }}>노트를 작성하고 공개해보세요!</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {notes.map(n => {
              const summary = n.summary as Record<string, unknown> | null;
              const tldr = summary?.tldr as string | undefined;
              const tags = (summary?.tags as string[] | undefined) ?? [];
              return (
                <Link key={n.id} href={`/notes/${n.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ background: "var(--st-paper)", border: "1px solid var(--st-line)", borderRadius: 14, overflow: "hidden", transition: "border-color .15s, transform .15s", display: "flex", flexDirection: "column" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--st-ink-4)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--st-line)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
                  >
                    {/* Thumbnail */}
                    <div style={{ aspectRatio: "16/9", background: "linear-gradient(135deg, oklch(0.32 0.08 260), oklch(0.22 0.06 280))", position: "relative", overflow: "hidden" }}>
                      {n.sourceThumbnail && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.sourceThumbnail} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                      {n.durationSec && (
                        <span style={{ position: "absolute", bottom: 8, right: 8, font: "500 11px var(--font-mono, monospace)", background: "oklch(0.15 0 0 / 0.85)", color: "white", padding: "3px 7px", borderRadius: 4 }}>
                          {formatDur(n.durationSec)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px 18px", flex: 1 }}>
                      <h3 style={{ margin: "0 0 8px", font: "700 15px/1.35 var(--font-inter, Inter)", color: "var(--st-ink)", letterSpacing: "-0.01em", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.sourceTitle ?? "제목 없음"}
                      </h3>
                      {tldr && (
                        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--st-ink-2)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {tldr}
                        </p>
                      )}
                      {tags.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                          {tags.slice(0, 3).map((t, i) => (
                            <span key={i} style={{ font: "500 10px var(--font-mono, monospace)", padding: "2px 8px", borderRadius: 999, background: "var(--st-accent-soft)", color: "var(--st-accent-2)", border: "1px solid transparent" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Author */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
                        {n.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={n.user.image} alt="" style={{ width: 20, height: 20, borderRadius: "50%" }} />
                        ) : (
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--st-accent)" }} />
                        )}
                        <span style={{ font: "500 12px var(--font-inter, Inter)", color: "var(--st-ink-3)" }}>{n.user?.name ?? "익명"}</span>
                        <span style={{ font: "500 11px var(--font-mono, monospace)", color: "var(--st-ink-4)", marginLeft: "auto" }}>
                          {new Date(n.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
