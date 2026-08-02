"use client";

import { type LucideIcon } from "lucide-react";
import { useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { cn } from "@/lib/utils";

import { DarkSection } from "./dark-section";
import { AnalyzeMock, CaptureMock } from "./flow-mocks";
import { AssignMock, HandoverMock } from "./flow-mocks-deliver";
import { FLOW_STEPS, type FlowMock } from "./flow-steps";

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

  return (
    <DarkSection
      // 뒤에 명암 든 Z를 옅게 깔아 빈 검정이 되지 않게 한다 — 읽을 내용이 아니라 배경이다
      backdrop={
        <ZLogo className="text-landing-dark-foreground animate-breathe size-[380px] opacity-[0.05] blur-[5px]" />
      }
    >
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
              onClick={() => setSelected(index)}
              className={cn(
                "focus-visible:ring-ring h-full w-full rounded-xl border p-6 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:outline-none",
                index === selected
                  ? "glow-ring-rgb bg-landing-dark-surface -translate-y-1 border-transparent shadow-[0_0_40px_-8px_rgba(124,58,237,0.45)]"
                  : "border-landing-dark-border bg-landing-dark-surface hover:-translate-y-0.5",
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
        ⚠️ 높이를 **가장 큰 단계에 맞춰 고정**한다(`h-[372px]`, `min-h`가 아니다).
           누를 때마다 패널이 커졌다 작아졌다 하면 그 출렁임이 내용보다 먼저 보인다.
           내용이 짧은 단계는 각 축소판이 `mt-auto`로 아래를 채운다.
      */}
      <div
        key={active.step}
        className="border-landing-dark-border bg-landing-dark-surface animate-in fade-in-0 slide-in-from-bottom-2 mx-auto mt-6 flex h-[372px] max-w-[560px] flex-col rounded-xl border p-5 backdrop-blur duration-300"
      >
        <FlowMockView mock={active.mock} />
      </div>
    </DarkSection>
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
