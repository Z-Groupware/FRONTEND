import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 각 화면은 자기 이름만 쓴다 — 탭 제목에 브랜드를 뒤에 붙이지 않는다
  title: {
    default: "Z — 회의 기반 지식관리",
    template: "%s",
  },
  description: "회의를 캡처하면 요약·결정·액션이 담당자에게 전달됩니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: next-themes가 첫 렌더 전에 <html>의 class를 바꾸기 때문에 필요하다.
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground flex min-h-full flex-col">
        <ThemeProvider>
          {children}
          {/* 변경 결과 토스트 — 앱 전체에 하나만 둔다(DECISIONS) */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
