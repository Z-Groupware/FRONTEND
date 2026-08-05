import "./globals.css";

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SCALE_BOOT_SCRIPT } from "@/features/appearance/scale";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LANDING_THEME_KEY = "z:landing-theme";

/*
  ⚠️ **첫 페인트 전에** 저장해 둔 랜딩 밝기를 `<html>`에 붙인다.
     서버는 방문자의 선택을 모르므로 늘 어두운 기본값으로 그려 보낸다. 하이드레이션까지
     기다리면 밝게 쓰던 사람은 새로고침마다 검은 화면이 번쩍였다가 흰 화면으로 바뀐다.
  ⚠️ **`<head>`에 둔다.** 컴포넌트 트리 안의 `<script>`는 클라이언트 렌더에서 실행되지 않아
     React가 경고를 낸다 — SSR로는 돌지만 콘솔이 지저분해진다.
  ⚠️ 스킨 클래스는 `<html>`이 들지만 **토큰은 `#landing-stage`에만** 선언한다(globals.css).
     토큰까지 html에 두면 로그인 뒤 앱 화면도 따라 어두워진다.
  ⚠️ 스크립트가 막히거나(CSP) 저장소를 못 읽어도 화면은 산다 — 기본값(어두움)으로 남을 뿐이다.
*/
const LANDING_THEME_BOOT = `try{var d=localStorage.getItem("${LANDING_THEME_KEY}")!=="light";document.documentElement.classList.add(d?"landing-night":"landing-day")}catch(e){document.documentElement.classList.add("landing-night")}`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANDING_THEME_BOOT }} />
        {/*
          ⚠️ 화면 배율도 **첫 페인트 전에** 건다. 하이드레이션까지 기다리면 새로고침마다
             100%로 한 번 그려졌다가 확대되면서 화면이 통째로 튄다 — 랜딩 밝기와 같은 이유다.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCALE_BOOT_SCRIPT }} />
      </head>
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
