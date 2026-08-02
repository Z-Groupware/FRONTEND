"use client";

import { createContext, type ReactNode, useContext, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { LandingBackdrop } from "./landing-backdrop";
import { LandingFooter } from "./landing-footer";
import { LandingHeader } from "./landing-header";

const STORAGE_KEY = "z:landing-theme";

/**
 * 랜딩 껍데기 — 무대·상단바·푸터를 한자리에서 그린다.
 *
 * ⚠️ 랜딩의 밝기는 **앱 다크모드와 별개다.** 앱은 시스템 설정을 따르지만(`.dark`),
 *    랜딩은 방문자가 직접 고르고 그 선택만 기억한다. 두 곳이 같은 스위치를 쓰면
 *    "사내 도구는 밝게, 소개 페이지는 어둡게" 같은 조합이 불가능해진다.
 * ⚠️ 기본값은 **어두움**이다 — 3D Z가 도는 검정 무대가 이 페이지의 첫인상이다.
 * ⚠️ 저장값은 `useSyncExternalStore`로 읽는다. 서버는 방문자의 선택을 모르므로 서버 스냅숏은
 *    항상 "어두움"이고, 클라이언트에서 저장값으로 이어 붙는다 — 효과 안에서 setState를 부르는
 *    방식(하이드레이션 직후 한 번 더 렌더)보다 이 편이 정석이다.
 */

/** 모듈 수준 저장소 — 스냅숏 하나를 셸과 배경이 함께 읽는다 */
let currentIsDark: boolean | null = null;
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function getSnapshot() {
  /*
    ⚠️ `localStorage` 접근은 던질 수 있다 — 사파리 프라이빗 모드나 저장소를 막은 브라우저에서
       그렇다. 여기서 터지면 **랜딩 전체가 렌더 중 죽는다.** 읽기 실패는 기본값(어두움)으로 넘긴다.
  */
  if (currentIsDark === null) {
    try {
      currentIsDark = window.localStorage.getItem(STORAGE_KEY) !== "light";
    } catch {
      currentIsDark = true;
    }
  }
  return currentIsDark;
}

/** 서버는 방문자의 선택을 알 수 없다 — 기본값(어두움)으로 그린다 */
function getServerSnapshot() {
  return true;
}

function setIsDark(next: boolean) {
  currentIsDark = next;
  /* 저장에 실패해도 화면은 바뀌어야 한다 — 기억만 못 할 뿐이다 */
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
  } catch {
    /* 저장소를 막은 브라우저 — 이번 방문에만 적용된다 */
  }
  listeners.forEach((listener) => listener());
}

const LandingThemeContext = createContext<{ isDark: boolean; toggle: () => void }>({
  isDark: true,
  toggle: () => {},
});

export function useLandingTheme() {
  return useContext(LandingThemeContext);
}

export function LandingShell({ children }: { children: ReactNode }) {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => setIsDark(!isDark);

  return (
    <LandingThemeContext value={{ isDark, toggle }}>
      <div
        className={cn(
          // 상단바가 `fixed`라 문서 흐름에서 빠진다 — 그 높이(56px)를 여기서 메운다
          "text-foreground relative flex min-h-dvh flex-col pt-14",
          // 어두울 때만 토큰을 뒤집는다 — 밝을 때는 기본 토큰이 그대로 산다
          isDark ? "landing-night bg-landing-stage" : "landing-day bg-landing-stage",
        )}
      >
        <LandingBackdrop />
        {/*
          읽은 만큼 차오르는 막대 — 랜딩과 문서가 **같은 껍데기**를 쓰므로 여기 한 곳에 둔다.
          긴 화면에서 남은 양이 보이지 않으면 사람은 중간에 닫는다.
        */}
        <span
          aria-hidden
          className="read-progress fixed top-14 right-0 left-0 z-40 h-[2px] origin-left bg-[linear-gradient(90deg,#3b82f6,#7c3aed,#8b5cf6,#60a5fa)]"
        />
        {/* 화면 전체에 옅은 필름 그레인 — 질감 */}
        <span className="film-grain" aria-hidden />
        <LandingHeader />

        {/* 콘텐츠는 고정 배경(z-0) 위로 — 이 층이 없으면 배경이 글을 덮는다 */}
        <main className="relative z-10 flex-1">{children}</main>

        <LandingFooter />
      </div>
    </LandingThemeContext>
  );
}
