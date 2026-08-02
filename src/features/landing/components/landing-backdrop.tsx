"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import { useLandingTheme } from "./landing-shell";

/**
 * 랜딩 전체의 고정 배경 — 검정 캔버스 위에 3D Z 하나가 계속 돈다.
 *
 * 섹션 배경이 반투명이라 스크롤 내내 이 층이 비친다 — 흰·검 조각 대신 한 몸의 무대.
 * ⚠️ **섹션마다 배경을 따로 칠하지 않는다.** 섹션별 그라데이션을 겹치면 경계가 띠처럼 드러나
 *    페이지가 조각나 보인다. 색은 여기 **한 장**에서만 나온다.
 * ⚠️ `pointer-events-none` — 배경이 스크롤·클릭을 뺏으면 안 된다(회전은 자전만).
 * ⚠️ three는 `ssr:false` 지연 로드, 로드 전에는 광원만 있는 바탕이다(§성능·폴백).
 * ⚠️ 밝은 쪽에서는 광원과 Z를 **훨씬 옅게** 깐다 — 검정 위에서 은은하던 세기가
 *    흰 바탕에서는 글을 덮는 회색 덩어리가 된다.
 */
const ThreeZ = dynamic(() => import("./three-z"), { ssr: false, loading: () => null });

export function LandingBackdrop() {
  const { isDark } = useLandingTheme();

  return (
    /*
      ⚠️ `-z-10` 대신 `z-0`이다. 음수 z는 **문서 배경보다 아래**라 body 배경색이 흰색인 순간
         (테마 토큰이 아직 안 붙은 첫 페인트 등) 이 층이 통째로 가려진다.
         이 위에 오는 콘텐츠는 `relative z-10`을 갖는다.
    */
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 z-0", "bg-landing-stage")}>
      {/* 화면 전체를 덮는 한 장의 그라데이션 — 위는 푸르게, 아래는 보랏빛으로 아주 천천히 넘어간다 */}
      <span
        className={cn(
          "absolute inset-0",
          isDark
            ? "bg-[radial-gradient(120%_80%_at_15%_0%,rgba(37,99,235,0.22)_0%,transparent_55%),radial-gradient(110%_75%_at_85%_100%,rgba(124,58,237,0.2)_0%,transparent_55%)]"
            : "bg-[radial-gradient(120%_80%_at_15%_0%,rgba(37,99,235,0.09)_0%,transparent_55%),radial-gradient(110%_75%_at_85%_100%,rgba(124,58,237,0.08)_0%,transparent_55%)]",
        )}
      />

      {/* 번진 광원 둘 — 검정이 평평해 보이지 않게 */}
      <span
        className={cn(
          "animate-drift absolute -top-24 -left-32 size-[480px] rounded-full bg-[#2563eb] blur-[130px]",
          isDark ? "opacity-20" : "opacity-[0.09]",
        )}
      />
      <span
        className={cn(
          "animate-drift absolute -right-32 -bottom-24 size-[480px] rounded-full bg-[#7c3aed] blur-[130px] [animation-delay:-7s]",
          isDark ? "opacity-20" : "opacity-[0.09]",
        )}
      />

      {/* 정중앙 — 사선만 밝으면 막대처럼 읽히므로 조명을 키워 글자 전체가 보이게 한다 */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center",
          isDark ? "opacity-50" : "opacity-[0.13]",
        )}
      >
        <ThreeZ size={760} tone={isDark ? "dark" : "light"} />
      </div>
    </div>
  );
}
