"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import {
  DEFAULT_SCALE,
  parseScale,
  recommendScale,
  REFERENCE_WIDTH,
  SCREEN_SCALES,
  suggestScale,
} from "../scale";
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
 * ⚠️ **자동으로 안 바꾼다.** 기준 폭에서 많이 벗어났으면 한 줄로 권하기만 한다 —
 *    브라우저는 화면의 물리적 크기를 안 알려줘서 27인치 모니터와 노트북을 구분할 수 없고,
 *    지금 배율을 일부러 고른 사람에게 강제로 바꾸면 서비스가 고장 난 것으로 보인다.
 * ⚠️ **양쪽으로 권한다.** 화면이 좁으면 크게 보이고(OS 배율이 높다) 넓으면 작게 보인다 —
 *    어느 쪽으로 어긋날지는 기기마다 다르다.
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
  const width = Number(viewport) || 0;
  const hint = suggestScale({ viewportWidth: width, hasChosen: stored !== null });
  // ⚠️ 권한다면 **몇 %인지까지** 말한다. "줄여 보세요"만으로는 어디까지 줄일지 모른다
  const recommended = recommendScale(width);

  /*
    ⚠️ **DOM을 맞추는 건 효과의 일이다.** 브라우저는 React 밖의 시스템이라, 고른 값이 바뀔 때마다
       여기서 한 번 반영한다 — 이벤트 핸들러에서 직접 쓰면 다른 탭에서 바뀐 값이 안 따라온다.
    ⚠️ 100%면 빈 값으로 돌려놓는다. `zoom: 1`을 남기면 브라우저가 계산을 한 단계 더 한다.
  */
  useEffect(() => {
    const root = document.documentElement;
    const ratio = scale / DEFAULT_SCALE;

    root.style.zoom = scale === DEFAULT_SCALE ? "" : String(ratio);
    /*
      ⚠️ **`zoom`만 걸면 아래가 빈다.** `100dvh`는 배율을 모르는 값이라, 그 높이를 가진
         상자가 0.75배로 그려지면 화면 아래 25%가 남는다 — 셸이 중간에서 끝나 보인다.
         `h-screen-z`가 이 변수로 나눠 주므로 **둘을 같이 세운다**(부트 스크립트도 같다).
    */
    root.style.setProperty("--app-zoom", String(ratio));
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

      {/*
        ⚠️ **지금 폭을 적어 준다.** 두 기기가 다르게 보일 때, 이 숫자를 맞추면 같아진다 —
           "작아 보인다"는 느낌만으로는 어느 쪽으로 얼마나 옮길지 알 수 없다.
      */}
      {width > 0 && (
        <p className="text-muted-foreground/70 pt-4 text-[12px] leading-4 tabular-nums">
          지금 화면 폭 {width}px · 설계 기준 {REFERENCE_WIDTH}px
        </p>
      )}

      {hint !== "none" && (
        /*
          ⚠️ **권하기만 한다.** 자동으로 바꾸면, 지금 배율을 일부러 고른 사람에게는 서비스가
             고장 난 것으로 보인다.
          ⚠️ 색을 쓰지 않는다 — 잘못된 상태가 아니라 알려 주는 말이다(§디자인 토큰).
        */
        <p className="border-border bg-secondary mt-4 rounded-lg border px-3.5 py-3 text-[12px] leading-[18px] break-keep">
          화면이 기준보다 {hint === "smaller" ? "좁아" : "넓어"} 다른 기기보다{" "}
          <span className="font-medium">{hint === "smaller" ? "크게" : "작게"}</span> 보입니다.{" "}
          <span className="text-foreground font-medium">{recommended}%</span>를 누르면 다른 기기와
          같은 폭이 됩니다.
        </p>
      )}
    </section>
  );
}
