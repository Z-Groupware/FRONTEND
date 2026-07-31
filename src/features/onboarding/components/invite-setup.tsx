"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadDraft, saveDraftInvites } from "../draft";
import { departmentsWithLeader, duplicatedLeaderIds } from "../invites";
import type { DepartmentNode, Invite, Position } from "../types";
import { useDraftSync } from "../use-draft-sync";
import { useInviteList } from "../use-invite-list";
import { useInviteOptions } from "../use-invite-options";
import { InviteIntro } from "./invite-intro";
import { InviteRow, type InviteRowHandlers } from "./invite-row";
import { InviteSendBar } from "./invite-send-bar";

interface InviteSetupProps {
  departments: DepartmentNode[];
  positions: Position[];
}

/**
 * 온보딩 3단계 — 사원 초대.
 *
 * 부서·직급은 1·2단계에서 정한 것을 그대로 쓴다. 아직 서버 저장이 없어서
 * **임시 보관함(`draft.ts`)** 에 담긴 값을 먼저 보고, 없으면 서버 값을 쓴다.
 * ⚠️ 발송은 미구현이다 — BE 연동 후 [완료]에서 한 번에 커밋한다.
 */
export function InviteSetup({ departments, positions }: InviteSetupProps) {
  const {
    departmentOptions,
    rolesOf,
    positionOptions,
    isLeaderPosition,
    defaultPositionId,
    defaultDepartmentId,
  } = useInviteOptions(departments, positions);

  const list = useInviteList(defaultDepartmentId, defaultPositionId);

  /** 그 줄에서 고를 수 있는 직급 — 부서에 이미 리더가 있으면 리더 직급을 잠근다 */
  const positionsFor = (invite: Invite) => {
    const taken = departmentsWithLeader(list.invites, isLeaderPosition, invite.id);
    if (!taken.has(invite.departmentId)) return positionOptions;

    return positionOptions.map((option) =>
      isLeaderPosition(option.id) ? { ...option, disabled: true, hint: "이미 있음" } : option,
    );
  };

  const duplicatedLeaders = duplicatedLeaderIds(list.invites, isLeaderPosition);

  useDraftSync({
    value: list.invites,
    load: () => loadDraft().invites,
    save: saveDraftInvites,
    restore: list.reset,
  });

  // 1단계에서 부서를 지웠다면, 그 부서를 가리키던 줄을 기본값으로 되돌린다
  useEffect(() => {
    list.remapToOptions(
      new Set(departmentOptions.map((option) => option.id)),
      new Set(positionOptions.map((option) => option.id)),
      (departmentId) => new Set(rolesOf(departmentId).map((option) => option.id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentOptions, positionOptions]);

  /**
   * ⚠️ 실제 메일 발송은 서버가 한다 — 지금은 목이라 목록만 확정된다.
   *    BE 연동 후 [완료]에서 `POST /onboarding/complete`로 함께 커밋한다.
   */
  const handleSend = () => {
    const count = list.sendable.length;
    list.markSent();
    // 한 줄로 짧게 — 유효기간 같은 상세는 왼쪽 안내에 이미 적혀 있다
    toast.success(`${count}명에게 초대장을 보냈어요`);
  };

  const handlers: InviteRowHandlers = {
    onChangeEmail: list.changeEmail,
    onChangeDepartment: list.changeDepartment,
    onChangeRole: list.changeRole,
    onChangePosition: list.changePosition,
    onRemove: list.remove,
    departments: departmentOptions,
    rolesOf,
    positionsFor,
  };

  return (
    <div className="flex flex-col gap-[21px]">
      {/* 높이를 여기서 한 번만 정한다 — 좌우 두 칸이 같은 높이를 나눠 쓴다(2단계와 동일) */}
      <div className="flex flex-col gap-7 lg:h-[560px] lg:flex-row">
        <InviteIntro
          invites={[...list.sent, ...list.sendable]}
          departments={departmentOptions}
          rolesOf={rolesOf}
          positions={positionOptions}
        />

        {/* 높이 고정 — 줄을 아무리 추가해도 카드 크기는 그대로고 안에서만 스크롤된다 */}
        <section className="border-border bg-card flex h-[440px] flex-1 flex-col overflow-hidden rounded-xl border shadow-sm lg:h-full">
          <header className="border-border bg-muted flex h-12 shrink-0 items-center border-b px-4">
            <h2 className="flex items-center gap-2 text-[13px] leading-5">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              초대 목록
            </h2>
          </header>

          {/* 행(InviteRow)과 같은 padding·gap·칸 너비를 써야 열이 맞는다 */}
          <div className="text-muted-foreground/60 border-border bg-card flex h-7 shrink-0 items-center gap-2 border-b px-4 text-[11px] leading-4">
            <span className="w-5 shrink-0" aria-hidden />
            <span className="flex-1 pl-2">이메일</span>
            <span className="w-[104px] shrink-0 text-center">부서</span>
            <span className="w-[104px] shrink-0 text-center">역할</span>
            <span className="w-[76px] shrink-0 text-center">직급</span>
            <span className="size-6 shrink-0" aria-hidden />
          </div>

          {/* 스크롤바는 숨긴다(스크롤 자체는 된다) */}
          <div className="flex-1 [scrollbar-width:none] overflow-auto overscroll-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {list.invites.map((invite: Invite, index: number) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                index={index}
                isDuplicated={list.isDuplicated(invite)}
                isDuplicatedLeader={duplicatedLeaders.has(invite.id)}
                {...handlers}
              />
            ))}
          </div>

          <InviteSendBar
            sendableCount={list.sendable.length}
            onAddRow={list.addRow}
            onSend={handleSend}
          />
        </section>
      </div>

      <div className="border-border flex items-center justify-end gap-2 border-t pt-[17.5px]">
        <Link
          href="/onboarding/2"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-[34px] gap-1 text-[13px] leading-none",
          )}
        >
          <ChevronLeft className="size-3.5" />
          <span className="leading-none">이전</span>
        </Link>
        {/* ⚠️ 저장은 미구현 — BE 연동 후 Server Action으로 붙인다.
            시안의 주 버튼은 액센트(파랑)가 아니라 먹색이다(토큰 충돌 — 팀 확인 필요). */}
        <Link
          href="/onboarding/done"
          className={cn(
            buttonVariants(),
            "bg-foreground text-background hover:bg-foreground/90 h-[34px] gap-[5.25px] rounded-md px-[12.25px] text-[13px] leading-none",
          )}
        >
          <span className="leading-none">완료</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
