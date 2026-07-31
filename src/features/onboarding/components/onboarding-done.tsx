"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ZLogo } from "@/components/icons/z-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadDraft } from "../draft";
import { countDepartments } from "../tree";
import { type DepartmentNode, type Invite, ONBOARDING_STEP, type Position } from "../types";
import { CheckMark } from "./check-mark";
import { DoneSummary } from "./done-summary";
import { OnboardingShell } from "./onboarding-shell";

/** 보관함에서 읽어낸 결과. 아직 못 읽었으면 `null`이다. */
interface DoneCounts {
  departmentCount: number;
  roleCount: number;
  positionCount: number;
  inviteCount: number;
}

function countOf(
  departments: DepartmentNode[],
  positions: Position[],
  invites: Invite[],
): DoneCounts {
  return {
    departmentCount: departments.length,
    // 역할은 부서 아래 한 겹뿐이다 — 전체에서 부서를 빼면 역할 수다
    roleCount: countDepartments(departments) - departments.length,
    positionCount: positions.length,
    inviteCount: invites.filter((invite) => invite.isSent).length,
  };
}

/**
 * 온보딩 완료 화면.
 *
 * ⚠️ **서버 저장이 아직 없다.** 여기 숫자는 브라우저 보관함(`draft.ts`)에서 읽는다 —
 *    커밋 API가 붙으면 그 응답으로 바꾸고 보관함은 지운다(`clearDraft`).
 */
export function OnboardingDone() {
  const [counts, setCounts] = useState<DoneCounts | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    // sessionStorage는 첫 렌더 뒤에야 읽을 수 있다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCounts(countOf(draft.departments ?? [], draft.positions ?? [], draft.invites ?? []));
  }, []);

  return (
    <OnboardingShell step={ONBOARDING_STEP.INVITE} isDone>
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-6">
        {/*
          빈 원에서 시작해 먹색이 차오르고, 그 위에 **Z 로고**가 얹힌다.
          체크는 작은 배지로 옆에 붙어 살랑인다.
          ⚠️ 배지는 초록이 아니라 카드색 바탕에 먹색이다 — 색으로 알리는 건 에러뿐(CLAUDE.md §디자인 토큰).
        */}
        <span className="relative" aria-hidden>
          <span className="border-border relative flex size-[68px] items-center justify-center rounded-full border">
            <span className="bg-foreground animate-fill-in absolute inset-0 rounded-full" />
            <ZLogo className="text-background animate-mark-in relative size-7" />
          </span>

          {/*
            배지는 **테두리 있는 원**이다. 검은 원 위에 걸쳐 있어서, 테두리가 없으면
            흰 바탕만 남아 원이 파먹힌 것처럼 보인다.
          */}
          <span className="animate-mark-in absolute -top-0.5 -right-0.5">
            <span className="bg-card border-foreground animate-float flex size-5 items-center justify-center rounded-full border">
              <CheckMark size={11} strokeWidth={3} />
            </span>
          </span>
        </span>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">준비됐어요</h1>
          <p className="text-muted-foreground text-[13px] leading-[21px] text-balance break-keep">
            부서·직급 체계와 초대 목록을 정했어요. 이대로 회의를 시작할 수 있습니다.
          </p>
        </div>

        {counts ? (
          <DoneSummary {...counts} />
        ) : (
          // 보관함을 읽기 전 — 높이를 미리 잡아 화면이 들썩이지 않게 한다
          <div className="border-border bg-card h-[141px] w-full animate-pulse rounded-lg border" />
        )}

        <div className="flex w-full flex-col items-center gap-2.5">
          <Link
            href="/pricing"
            className={cn(
              buttonVariants(),
              "bg-foreground text-background hover:bg-foreground/90 h-[38px] w-full gap-1.5 rounded-md text-[13px] leading-none",
            )}
          >
            <span className="leading-none">플랜 선택하기</span>
            <ChevronRight className="size-3.5" />
          </Link>

          {/* 결제를 강요하지 않는다 — 그냥 시작해도 되는 길을 같이 보여준다 */}
          <Link
            href="/owner"
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded px-2 py-1 text-xs leading-[18px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            건너뛰기 — 기본 Free 플랜으로 시작
          </Link>
        </div>

        {/* ⚠️ 두 화면 다 아직 없다. 눌리게는 두되 뭐가 없는지 숨기지 않는다(§정직성) */}
        <p className="text-muted-foreground/60 text-center text-[11px] leading-4 break-keep">
          요금제·대시보드 화면은 다음 작업이에요 — 지금 누르면 빈 화면입니다.
        </p>
      </div>
    </OnboardingShell>
  );
}
