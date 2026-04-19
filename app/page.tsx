import Link from "next/link";
import { UrlInputBar } from "@/components/dashboard/UrlInputBar";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "next-auth/react";

const features = [
  { icon: "⚡", title: "즉시 요약", desc: "YouTube URL만 입력하면 AI가 구조화된 요약을 생성합니다." },
  { icon: "⏱", title: "타임스탬프 연동", desc: "핵심 포인트를 클릭하면 영상의 해당 구간으로 바로 이동합니다." },
  { icon: "💬", title: "AI 채팅", desc: "영상 내용에 대해 AI에게 무엇이든 물어볼 수 있습니다." },
  { icon: "🇰🇷", title: "한국어 최적화", desc: "한국어 자막 처리 및 한국어 요약을 우선으로 지원합니다." },
];

export default function Home() {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <section className="container py-20 md:py-32 text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              YouTube 영상을{" "}
              <span className="text-primary">AI로 요약</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              URL 하나만 붙여넣으면 구조화된 요약, 타임스탬프 노트, AI 채팅까지 한 번에.
            </p>
            <div className="flex justify-center">
              <UrlInputBar large />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              로그인 없이도 바로 시작할 수 있습니다.{" "}
              <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                로그인
              </Link>
              하면 노트가 저장됩니다.
            </p>
          </section>

          <section className="container pb-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <div key={f.title} className="rounded-xl border p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </main>
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          <p>SummaryTube — YouTube AI 요약 서비스</p>
        </footer>
      </div>
    </SessionProvider>
  );
}
