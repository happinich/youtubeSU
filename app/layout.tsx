import type { Metadata } from "next";
import { Inter, Noto_Sans_KR, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansKr = Noto_Sans_KR({ subsets: ["latin"], variable: "--font-noto", weight: ["400","500","600","700"] });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400","500","600"] });

export const metadata: Metadata = {
  title: "SummaryTube — YouTube 영상 AI 요약",
  description: "YouTube URL 하나만 입력하면 AI가 구조화된 요약과 타임스탬프 노트를 만들어 드립니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.variable} ${notoSansKr.variable} ${jetbrainsMono.variable}`}>{children}</body>
    </html>
  );
}
