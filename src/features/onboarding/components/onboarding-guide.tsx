"use client";

import { Lightbulb, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { ONBOARDING_STEP, ONBOARDING_STEP_LABEL, type OnboardingStep } from "../types";
import { GuideDemo } from "./guide-demo";

/** 단계마다 짚어줄 것 — 화면을 보며 따라 할 수 있는 순서로 적는다. */
const GUIDE_STEPS: Record<OnboardingStep, string[]> = {
  [ONBOARDING_STEP.DEPARTMENT]: [
    "아래 입력칸에 부서 이름을 적고 Enter를 누르세요.",
    "부서 줄에 마우스를 올려 + 를 누르면 그 안에 역할이 생깁니다.",
    "이름은 더블클릭해서 바꾸고, 손잡이를 끌어 순서를 옮깁니다.",
  ],
  [ONBOARDING_STEP.POSITION]: [
    "직급 이름을 적고 Enter를 누르세요.",
    "직급마다 권한을 고릅니다. Leader는 회사에 한 직급만 가질 수 있어요.",
    "위에 있을수록 높은 직급입니다. 손잡이를 끌어 순서를 맞추세요.",
  ],
  [ONBOARDING_STEP.INVITE]: [
    "메일 주소를 적습니다. 형식이 어긋나면 옆에 알려드려요.",
    "부서를 고르면 역할 칸이 열립니다. 팀장처럼 역할이 없으면 ‘없음’을 두세요.",
    "부서마다 리더는 한 명입니다. 이미 있으면 그 직급이 잠깁니다.",
  ],
};

interface OnboardingGuideProps {
  step: OnboardingStep;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 온보딩 도움말 — 챗봇처럼 화면 위에 떠 있는 어두운 패널.
 *
 * ⚠️ **모달이 아니다.** 열어둔 채로 입력할 수 있어야 해서 덮개(overlay)도 포커스 가둠도 두지 않는다.
 *    본문 레이아웃도 건드리지 않는다 — 열고 닫아도 화면이 밀리지 않는다.
 */
export function OnboardingGuide({ step, isOpen, onToggle }: OnboardingGuideProps) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="onboarding-guide"
        aria-label={isOpen ? "도움말 닫기" : "도움말 열기"}
        className="bg-guide-surface text-guide-foreground border-guide-border focus-visible:ring-ring fixed right-6 bottom-20 z-50 flex size-11 items-center justify-center rounded-full border shadow-lg transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden"
      >
        {/*
          ⚠️ **전구**다. 여기는 찾아보는 곳이 아니라 지금 단계에서 알아둘 것을 짚어 주는
             곳이라, 랜딩 도움말(돋보기)과 표식을 일부러 다르게 쓴다.
        */}
        {isOpen ? <X className="size-[18px]" /> : <Lightbulb className="size-[18px]" aria-hidden />}
      </button>

      <aside
        id="onboarding-guide"
        // 닫혀 있을 땐 클릭도 포커스도 받지 않게 한다
        aria-hidden={!isOpen}
        className={cn(
          "bg-guide-surface text-guide-foreground border-guide-border fixed right-6 bottom-[136px] z-50 flex max-h-[min(560px,calc(100dvh-200px))] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl transition-[opacity,transform] duration-200",
          isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <header className="border-guide-border flex shrink-0 items-center gap-2 border-b px-4 py-3">
          <span className="bg-guide-foreground size-2 rounded-full" aria-hidden />
          <h2 className="text-[13px] font-semibold">온보딩 가이드</h2>
          <span className="text-guide-muted ml-auto text-[11px]">
            {step}단계 · {ONBOARDING_STEP_LABEL[step]}
          </span>
        </header>

        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          <GuideDemo step={step} />

          <ol className="flex flex-col gap-2.5">
            {GUIDE_STEPS[step].map((text, index) => (
              <li key={text} className="flex gap-2.5">
                <span className="bg-guide-border text-guide-foreground mt-px flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] leading-none tabular-nums">
                  {index + 1}
                </span>
                <p className="text-guide-muted text-[12px] leading-[19px] break-keep">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="border-guide-border text-guide-muted shrink-0 border-t px-4 py-2.5 text-center text-[11px] leading-[17px] break-keep">
          열어둔 채로 그대로 입력하셔도 됩니다.
        </p>
      </aside>
    </>
  );
}
