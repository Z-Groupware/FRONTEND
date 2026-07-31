"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CheckMark } from "@/components/common/check-mark";
import { ZLogo } from "@/components/icons/z-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadDraft } from "../draft";
import { isValidEmail } from "../invites";
import { type DepartmentNode, type Invite, ONBOARDING_STEP, type Position } from "../types";
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
    /**
     * 역할 = 부서의 **직속 자식**만.
     * ⚠️ `전체 - 부서`로 빼지 않는다 — 어쩌다 3계층이 들어오면 손자까지 역할로 세어 숫자가 부풀어 오른다.
     *    타입(`DepartmentNode.children`)은 재귀라 깊이를 막아주지 않는다.
     */
    roleCount: departments.reduce((sum, department) => sum + department.children.length, 0),
    positionCount: positions.length,
    /**
     * 초대 = **주소를 제대로 적어둔 줄** 전부.
     * ⚠️ `isSent`로 거르지 않는다 — [완료]는 발송을 부르지 않아서, 3단계에서 주소만 적고
     *    바로 넘어오면 전부 `isSent=false`다. 그걸 거르면 적어둔 게 있는데도 "없음"이 뜬다.
     *    어차피 실제 발송은 미구현이라 이 줄들은 다 "발송 대기"다.
     */
    inviteCount: invites.filter((invite) => isValidEmail(invite.email)).length,
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
