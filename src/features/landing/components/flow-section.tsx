"use client";

import { type LucideIcon } from "lucide-react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { DarkSection } from "./dark-section";
import { AnalyzeMock, CaptureMock } from "./flow-mocks";
import { AssignMock, HandoverMock } from "./flow-mocks-deliver";
import { FLOW_STEPS, type FlowMock, stepIndexFromProgress } from "./flow-steps";
import { smoothScrollTo } from "./smooth-scroll";

/**
 * 회의 한 번이 어떻게 흘러가는지 — 네 단계를 **눌러가며** 본다.
 *
 * 번호·제목만 나열하니 심심했다. 단계를 고르면 그 단계의 화면 축소판이 열린다
 * (온보딩 가이드와 같은 문법 — 누르면 보여준다).
 * ⚠️ 인수인계 단계는 **파랑**이다 — 초록은 "녹음 중"(진행 상태)에만 쓴다. 둘을 같은 색으로 두면
 *    "지금 돌아가는 중"과 "다 끝났다"가 구분되지 않는다.
 * ⚠️ 축소판 내용은 명세에 있는 것만. 자막은 화자 없는 청크, AI 산출물은 액션 할당이다.
 */
/* 아이콘은 lucide만 — 이모지 금지(§디자인 토큰) */

/** 단계별 축소판 — 고른 단계 하나만 그린다 */
function FlowMockView({ mock }: { mock: FlowMock }) {
  if (mock === "capture") return <CaptureMock />;
  if (mock === "analyze") return <AnalyzeMock />;
  if (mock === "assign") return <AssignMock />;
  return <HandoverMock />;
}

export function FlowSection() {
  const [selected, setSelected] = useState(0);
  const active = FLOW_STEPS[selected] ?? FLOW_STEPS[0]!;

  /*
    ⚠️ **스크롤이 단계를 넘긴다**(2026-08-12). 눌러야만 바뀌면, 네 단계가 이어진 하나의 흐름이라는
       게 안 읽힌다 — 내려가는 동안 화면이 고정된 채 단계만 바뀌면 그 이어짐이 몸으로 느껴진다.
    ⚠️ **누르는 것도 그대로 산다.** 카드를 누르면 그 단계의 스크롤 자리로 옮겨 간다 —
       상태만 바꾸면 다음 스크롤 한 칸에 곧바로 되돌아간다(스크롤이 정본이라서).
    ⚠️ **모션을 줄여 달라는 사람에게는 안 건다.** 고정 스크롤은 멀미를 유발하는 대표 연출이라,
       그때는 예전처럼 눌러서 보는 화면이 된다(`isPinned`가 꺼진다).
  */
  const track = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const isPinned = !prefersReduced;

  /*
    ⚠️ **붙은 뒤에 잰다.** 서버가 그린 HTML이 React에 붙기 전(하이드레이션 전)에 ref를 재려 들면
       `Target ref is defined but not hydrated`로 터진다(motion 공식 문서의 그 오류 —
       실제로 화면이 멈췄다, 2026-08-12). 붙은 뒤에야 `target`을 건넨다.
  */
  /*
    ⚠️ 효과 안에서 상태를 세우지 않는다(`react-hooks/set-state-in-effect`) — 렌더가 한 번 더 돈다.
       `useSyncExternalStore`는 서버에서 `false`, 브라우저에서 `true`를 주므로 같은 일을
       한 번에 한다.
  */
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    container.current = document.getElementById("app-scroll");
  }, []);

  /*
    ⚠️ **스크롤 주체를 알려준다.** 이 사이트는 `body`가 아니라 `#app-scroll`이 스크롤한다
       (화면 배율 기능 때문이다 — `globals.css`). 안 알려주면 진행도가 늘 0이라 단계가 안 넘어간다.
  */
  /*
    ⚠️ **참조를 고정한다.** 매 렌더 새 객체(`{ current: el }`)를 넘기면 구독이 매번 새로 붙었다
       떨어져 진행도가 영영 안 온다 — 실제로 단계가 안 넘어갔다(2026-08-12).
  */
  const container = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    container,
    target: isMounted ? track : undefined,
    /* 구간이 화면 위에 닿을 때 0, 바닥을 지날 때 1 */
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (!isPinned) return;
    const index = stepIndexFromProgress(progress, FLOW_STEPS.length);
    setSelected((prev) => (prev === index ? prev : index));
  });

  /** 누른 단계의 스크롤 자리로 옮긴다 — 스크롤과 상태가 다투지 않게 */
  function goToStep(index: number) {
    setSelected(index);
    if (!isPinned || !track.current) return;

    const { offsetTop, offsetHeight } = track.current;
    const span = offsetHeight - window.innerHeight;
    /* 칸의 **가운데**로 간다 — 경계에 서면 다음 스크롤 한 칸에 옆 단계로 넘어간다 */
    const ratio = (index + 0.5) / FLOW_STEPS.length;
    /* ⚠️ `window.scrollTo`는 Lenis가 다음 프레임에 덮어써 안 먹는다 — 그쪽에 부탁한다 */
    smoothScrollTo(offsetTop + span * ratio);
  }

  return (
    /*
      ⚠️ 여기에 배경 Z를 따로 깔지 않는다. 랜딩 전체 배경(`LandingBackdrop`)의 **도는 3D Z**가
         이미 이 자리에 비친다 — 평면 Z를 덧대면 기울기가 다른 Z 둘이 포개져 정체불명의
         흰 조각으로 보인다.
      ⚠️ 색은 배경 한 장에서만 나온다는 규칙이기도 하다(§섹션마다 배경을 따로 칠하지 않는다).
    */
    <div
      ref={track}
      /*
        ⚠️ **키가 화면 넷을 합친 만큼**이다(`400vh`). 그 안에서 화면은 붙박여 있고, 스크롤은
           단계를 넘기는 데 쓰인다 — 한 단계당 화면 하나만큼 내려가면 다음으로 간다.
        ⚠️ 고정을 안 걸 때는(모션 최소화) 예전처럼 **내용 높이 그대로** 둔다. 안 그러면
           아무 일도 없는 빈 화면 셋을 지나야 한다.
      */
      className={cn(isPinned && "relative h-[400vh]")}
    >
      <div className={cn(isPinned && "sticky top-0 flex min-h-screen items-center")}>
        <DarkSection>
          {/* 밝은 섹션과 같은 헤더 문법 — eyebrow + 중앙 제목 */}
          <div className="flex flex-col items-center gap-2.5 text-center">
            <p className="text-landing-accent text-[11px] leading-4 font-semibold tracking-[1.1px] uppercase">
              Flow
            </p>
            <h2 className="text-[32px] leading-[40px] font-semibold tracking-[-0.7px] break-keep lg:text-[36px] lg:leading-[44px]">
              회의부터 인수인계까지, 하나로 이어집니다
            </h2>
          </div>

          <ol className="grid gap-3 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* 내려오면 카드가 차례로 떠오른다 — 스크롤 타임라인(reveal-on-scroll) */}
            {FLOW_STEPS.map((item, index) => (
              <li key={item.step} className="reveal-on-scroll">
                <button
                  type="button"
                  aria-pressed={index === selected}
                  onClick={() => goToStep(index)}
                  className={cn(
                    /* ⚠️ 밝은 무대에서는 흰 카드가 흰 바탕 위에 뜬다 — 선만으로는 층이 안 생기므로
                     **그림자로 들어 올린다.** 어두운 무대는 지금 그대로 둔다(§landing-light 변형) */
                    "focus-visible:ring-ring h-full w-full rounded-xl border p-6 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:outline-hidden",
                    "landing-light:shadow-[0_1px_2px_rgba(37,99,235,0.05),0_12px_30px_-14px_rgba(37,99,235,0.18)] landing-light:hover:shadow-[0_2px_5px_rgba(37,99,235,0.07),0_20px_42px_-16px_rgba(37,99,235,0.26)]",
                    /*
                  ⚠️ 고른 카드의 보라 글로우는 **검정 위에서만 통한다.** 흰 바탕에서는
                     번진 자국처럼 보인다 — 밝은 쪽은 글로우를 끄고 **더 깊은 그림자와
                     액센트 테두리**로 고른 것을 알린다.
                */
                    index === selected
                      ? "glow-ring-rgb bg-landing-dark-surface landing-light:bg-gradient-to-b landing-light:from-white landing-light:to-[#fbfbfa] landing-light:border-landing-accent/35 landing-light:shadow-[0_2px_6px_rgba(28,25,23,0.06),0_20px_44px_-18px_rgba(37,99,235,0.35)] -translate-y-1 border-transparent shadow-[0_0_40px_-8px_rgba(124,58,237,0.45)]"
                      : "border-landing-dark-border bg-landing-dark-surface landing-light:bg-gradient-to-b landing-light:from-white landing-light:to-[#fbfbfa] hover:-translate-y-0.5",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p
                      className={cn(
                        "text-[11px] leading-4 font-semibold tabular-nums",
                        index === selected ? "text-landing-accent" : "text-landing-dark-muted",
                      )}
                    >
                      {item.step}
                    </p>
                    <StepIcon icon={item.icon} isSelected={index === selected} />
                  </div>
                  <p className="pt-2 text-[16px] leading-6 font-semibold">{item.title}</p>
                  <p className="text-landing-dark-muted pt-1.5 text-[13px] leading-5 break-keep">
                    {item.body}
                  </p>
                </button>
              </li>
            ))}
          </ol>

          {/*
        고른 단계의 화면 축소판 — 단계가 바뀌면 아래에서 다시 떠오른다.
        ⚠️ 폭은 **위 카드 줄과 같다.** 카드 넉 장이 화면을 가로지르는데 아래 패널만 좁으면
           아래가 빈 것처럼 보인다 — 대신 축소판이 헐거워지지 않게 안을 두 칸으로 채웠다
           (`flow-mock-aside.tsx`).
        ⚠️ 높이를 **가장 큰 단계에 맞춰 고정**한다(`h-[352px]`, `min-h`가 아니다).
           누를 때마다 패널이 커졌다 작아졌다 하면 그 출렁임이 내용보다 먼저 보인다.
           내용이 짧은 단계는 각 축소판이 `mt-auto`로 아래를 채운다.
      */}
          <div
            key={active.step}
            className={cn(
              "border-landing-dark-border bg-landing-dark-surface landing-light:bg-gradient-to-b landing-light:from-white landing-light:to-[#fbfbfa] animate-in fade-in-0 slide-in-from-bottom-2 mt-6 flex h-[352px] flex-col rounded-xl border p-5 backdrop-blur duration-300",
              "landing-light:shadow-[0_1px_2px_rgba(37,99,235,0.05),0_12px_30px_-14px_rgba(37,99,235,0.18)]",
            )}
          >
            {/* ⚠️ 목업 문장("API 문서 최신화" 등)은 **가짜다.** 스크린 리더가 실제 정보처럼
            읽으면 안 된다 — 화면 전체를 한 번에 숨긴다(§정직성·a11y) */}
            {/* ⚠️ 이 래퍼도 `flex flex-col flex-1`이어야 한다 — 안 그러면 축소판의 `mt-auto`가
            죽어 내용이 카드 위쪽에 몰리고 아래가 텅 빈다 */}
            <div aria-hidden className="flex flex-1 flex-col">
              <FlowMockView mock={active.mock} />
            </div>
          </div>
        </DarkSection>
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon, isSelected }: { icon: LucideIcon; isSelected: boolean }) {
  return (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-lg border transition-colors",
        isSelected
          ? "border-landing-accent/60 bg-landing-accent/15 text-landing-accent"
          : "border-landing-dark-border text-landing-dark-muted",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

/** 축소판 머리 — 네 단계가 같은 문법을 쓴다(왼쪽 상태 · 오른쪽 수치) */
