"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ZDoneMark } from "@/components/common/z-done-mark";
import { buttonVariants } from "@/components/ui/button";
import { ROLE } from "@/constants/role";
import { roleHome } from "@/features/shell/home";
import { cn } from "@/lib/utils";

import { loadDraft } from "../draft";
import { isValidEmail } from "../invites";
import { type DepartmentNode, type Invite, ONBOARDING_STEP, type Position } from "../types";
import { DoneConfetti } from "./done-confetti";
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
     * ⚠️ `isSent`로 거르지 않는다 — 주소를 적어둔 줄은 3단계 [완료]에서 전부 나가서
     *    두 값이 같다. 굳이 걸러 두면 나중에 한쪽만 바뀌었을 때 수가 어긋난다.
     */
    inviteCount: invites.filter((invite) => isValidEmail(invite.email)).length,
  };
}

interface OnboardingDoneProps {
  /**
   * 방금 결제한 내용 — `12명 · 월간 ₩130,680`.
   * ⚠️ 브라우저 보관함이 아니라 **서버에서** 온다. 결제 결과를 화면이 기억해 두면
   *    새로고침 한 번에 사라지고, 무엇보다 금액은 서버가 말해야 하는 값이다.
   */
  paymentSummary: string;
}

/**
 * 온보딩 완료 화면.
 *
 * ⚠️ **서버 저장이 아직 없다.** 여기 숫자는 브라우저 보관함(`draft.ts`)에서 읽는다 —
 *    커밋 API가 붙으면 그 응답으로 바꾸고 보관함은 지운다(`clearDraft`).
 */
export function OnboardingDone({ paymentSummary }: OnboardingDoneProps) {
  const [counts, setCounts] = useState<DoneCounts | null>(null);

  useEffect(() => {
    const draft = loadDraft();
    // sessionStorage는 첫 렌더 뒤에야 읽을 수 있다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCounts(countOf(draft.departments ?? [], draft.positions ?? [], draft.invites ?? []));
  }, []);

  return (
    <OnboardingShell step={ONBOARDING_STEP.PAYMENT} isDone>
      <div className="mx-auto flex w-full max-w-[420px] flex-col items-center gap-6">
        <DoneConfetti />
        <ZDoneMark />

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-xl leading-[26px] font-semibold tracking-[-0.4px]">준비됐습니다</h1>
          {/*
            ⚠️ 결제까지 끝난 자리다(2026-08-04) — "이제 고르세요"로 끝내면 아직 할 일이
               남은 것처럼 읽힌다. 다음에 무슨 일이 일어나는지를 적는다.
          */}
          <p className="text-muted-foreground text-[13px] leading-[21px] text-balance break-keep">
            부서·직급 체계와 초대 목록을 정하고 결제까지 마쳤습니다. 초대한 분들께 계정 안내 메일이
            나갑니다.
          </p>
        </div>

        {counts ? (
          <DoneSummary {...counts} paymentSummary={paymentSummary} />
        ) : (
          // 보관함을 읽기 전 — 높이를 미리 잡아 화면이 들썩이지 않게 한다
          <div className="border-border bg-card h-[189px] w-full animate-pulse rounded-lg border" />
        )}

        {/*
          갈 곳은 하나다 — 결제는 앞 단계에서 끝났다.
          ⚠️ 문구는 **버튼이 실제로 여는 화면 이름**을 적는다. "워크스페이스"는 이 서비스에
             그런 이름의 화면이 없어서, 누르기 전에 어디로 가는지 알 수 없다.
        */}
        {/*
          ⚠️ 온보딩은 **대표 초기설정**이라 여기 서 있는 사람은 언제나 OWNER다
             (CLAUDE.md §라우트 그룹). 그래도 경로를 적지 않고 `roleHome`을 거친다 —
             역할별 첫 화면이 바뀔 때 고칠 자리를 한 곳으로 모은다.
        */}
        <Link
          href={roleHome(ROLE.OWNER)}
          className={cn(
            buttonVariants(),
            "bg-foreground text-background hover:bg-foreground/90 h-[38px] w-full gap-1.5 rounded-md text-[13px] leading-none",
          )}
        >
          <span className="leading-none">대시보드로 가기</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </OnboardingShell>
  );
}
