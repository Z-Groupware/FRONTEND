"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DEFAULT_SCALE, parseScale, SCREEN_SCALES, shouldSuggestScale } from "../scale";
import {
  readScale,
  readViewport,
  subscribeScale,
  subscribeViewport,
  writeScale,
} from "../scale-store";

/**
 * 화면 배율 카드.
 *
 * ⚠️ **자동으로 안 바꾼다.** 넓은 화면을 배율 없이 쓰는 것으로 보이면 한 줄로 권하기만 한다 —
 *    27인치 모니터도 `dpr = 1`이라 노트북과 구분할 수 없어서, 임의로 확대하면 모니터 쓰는
 *    사람 화면이 우스꽝스러워진다(`scale.ts`).
 * ⚠️ 값은 **이 기기에만** 남는다. 계정을 따라다니면 노트북과 모니터가 같은 배율이 된다.
 * ⚠️ `zoom`은 `<html>`에 건다. 본문에만 걸면 사이드바·상단바가 따로 놀고, `100dvh`를 쓰는
 *    화면들이 어긋난다.
 */
export function ScreenScaleCard() {
  /*
    ⚠️ 서버는 저장된 배율을 모른다. 첫 렌더는 기본값으로 그리고 **구독이 지금 값을 알려 줄 때**
       맞춘다 — 효과 본문에서 저장소를 읽으면 렌더가 한 번 더 돈다.
    ⚠️ **화면은 안 튄다.** 실제 확대는 첫 페인트 전에 루트 부트 스크립트가 이미 끝냈고,
       여기서 정하는 건 "어느 칸이 눌려 있나"뿐이다.
  */
  const [stored, setStored] = useState<string | null>(null);
  const [viewport, setViewport] = useState("");

  useEffect(() => subscribeScale(() => setStored(readScale())), []);
  useEffect(() => subscribeViewport(() => setViewport(readViewport())), []);

  const scale = parseScale(stored);
  const [pixelRatio = 0, width = 0] = viewport.split("|").map(Number);
  const isSuggested =
    viewport !== "" &&
    shouldSuggestScale({
      devicePixelRatio: pixelRatio,
      viewportWidth: width,
      hasChosen: stored !== null,
    });

  /*
    ⚠️ **DOM을 맞추는 건 효과의 일이다.** 브라우저는 React 밖의 시스템이라, 고른 값이 바뀔 때마다
       여기서 한 번 반영한다 — 이벤트 핸들러에서 직접 쓰면 다른 탭에서 바뀐 값이 안 따라온다.
    ⚠️ 100%면 빈 값으로 돌려놓는다. `zoom: 1`을 남기면 브라우저가 계산을 한 단계 더 한다.
  */
  useEffect(() => {
    document.documentElement.style.zoom = scale === DEFAULT_SCALE ? "" : String(scale / 100);
  }, [scale]);

  return (
    <section className="border-border bg-card rounded-2xl border p-7">
      <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
        {/* 다른 카드 머리와 같은 표식 — 화면이 달라도 같은 서비스로 읽힌다 */}
        <span className="bg-foreground size-2 rounded-full" aria-hidden />
        화면 배율
      </h2>

      <p className="text-muted-foreground pt-2 text-[13px] leading-[21px] break-keep">
        글자와 여백이 한 번에 커지고 작아집니다.{" "}
        <span className="text-foreground font-medium">이 기기에만</span> 저장되고 다른 기기에는
        영향을 주지 않습니다.
      </p>

      {/*
        ⚠️ 라디오 그룹이다. 네 값 중 **하나만** 고르는 자리라 버튼 넷을 나열하면
           스크린 리더에서 서로 무관한 버튼으로 읽힌다(§a11y).
      */}
      <div role="radiogroup" aria-label="화면 배율" className="flex flex-wrap gap-2 pt-5">
        {SCREEN_SCALES.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={value === scale}
            onClick={() => writeScale(value)}
            className={cn(
              "focus-visible:ring-ring h-9 min-w-[76px] rounded-lg border px-3 text-[13px] leading-none tabular-nums transition-colors focus-visible:ring-2 focus-visible:outline-hidden",
              value === scale
                ? "border-foreground bg-foreground text-background"
                : "border-border hover:bg-secondary",
            )}
          >
            {value}%
          </button>
        ))}
      </div>

      {isSuggested && (
        /*
          ⚠️ **권하기만 한다.** 여기서 자동으로 바꾸면, 배율 100%를 일부러 골라 한 화면에
             많이 띄우는 사람에게는 서비스가 고장 난 것으로 보인다.
          ⚠️ 색을 쓰지 않는다 — 잘못된 상태가 아니라 알려 주는 말이다(§디자인 토큰).
        */
        <p className="border-border bg-secondary mt-5 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep">
          화면은 넓은데 배율이 켜져 있지 않습니다. 글자가 작아 보이면{" "}
          <span className="font-medium">200%</span>를 눌러 보세요.
        </p>
      )}
    </section>
  );
}
