"use client";

import { Check, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { loadDraft, markDraftCommitted, saveDraftInvites } from "../draft";
import {
  departmentsWithLeader,
  duplicatedLeaderIds,
  fitsRoleAndPosition,
  type InviteRules,
} from "../invites";
import type { DepartmentNode, Invite, Position } from "../types";
import { NO_ROLE_ID, NO_ROLE_LABEL } from "../types";
import { useCommittedRedirect } from "../use-committed-redirect";
import { useDraftSync } from "../use-draft-sync";
import { useInviteList } from "../use-invite-list";
import { useInviteOptions } from "../use-invite-options";
import { InviteColumnHead } from "./invite-column-head";
import { InviteCommitDialog } from "./invite-commit-dialog";
import { InviteIntro } from "./invite-intro";
import { InviteRow, type InviteRowHandlers } from "./invite-row";
import { InviteSendBar } from "./invite-send-bar";
import { LeaveGuard } from "./leave-guard";
import type { SelectOption } from "./option-select";

interface InviteSetupProps {
  departments: DepartmentNode[];
  positions: Position[];
}

/**
 * 온보딩 3단계 — 사원 초대.
 *
 * 부서·직급은 1·2단계에서 정한 것을 그대로 쓴다. 아직 서버 저장이 없어서
 * **임시 보관함(`draft.ts`)** 에 담긴 값을 먼저 보고, 없으면 서버 값을 쓴다.
 * ⚠️ **[완료]를 누르면 끝이다.** 확인 창을 거치면 초대장이 나가고 4단계(결제)로 넘어가며, 되돌아올 수 없다 —
 *    나간 메일은 취소되지 않으니 화면만 고칠 수 있게 두면 그게 거짓말이 된다.
 */
export function InviteSetup({ departments, positions }: InviteSetupProps) {
  const { isReady, departmentOptions, rolesOf, positionOptions, isLeaderPosition } =
    useInviteOptions(departments, positions);

  /*
    역할·직급 짝 규칙이 보는 값 — 2단계(직급 권한)와 1단계(부서 트리)에서 온다.
    ⚠️ 규칙 자체는 `invites.ts`에 있다. 화면은 값만 준다.
  */
  const rules: InviteRules = {
    isLeaderPosition,
    hasRoles: (departmentId: string) => rolesOf(departmentId).length > 0,
  };

  const list = useInviteList(rules);

  /**
   * 그 줄에서 고를 수 있는 직급.
   *
   * **고른 역할에 맞는 직급만 연다**(팀 확정) — 판정은 `fitsRoleAndPosition` 한 곳이 한다.
   *
   * 여기서만 더 보는 것: 그 부서에 **리더가 이미 있으면** 리더 직급을 잠근다(부서마다 한 명).
   *
   * ⚠️ 고를 수 없는 항목은 **아예 빼 버린다.** 흐리게 남겨 두면 왜 못 고르는지 설명할 자리가
   *    필요해지고, 좁은 칸에 설명이 붙으면 이름이 밀린다. 이유는 왼쪽 안내가 말한다.
   * ⚠️ 역할을 고친 줄의 직급은 짝이 어긋나면 **비워진다**(`changeInviteRole`).
   *    여기서 막기만 하면 어느 쪽도 못 고치는 줄이 생긴다.
   */
  const positionsFor = (invite: Invite) => {
    const taken = departmentsWithLeader(list.invites, isLeaderPosition, invite.id);

    return positionOptions.filter((option) => {
      // 지금 고른 값은 늘 남긴다 — 목록에서 빠지면 칸이 무엇으로 정해졌는지 못 보여준다
      if (option.id === invite.positionId) return true;
      if (!fitsRoleAndPosition({ ...invite, positionId: option.id }, rules)) return false;
      return !(isLeaderPosition(option.id) && taken.has(invite.departmentId));
    });
  };

  /**
   * 그 줄에서 고를 수 있는 역할 — 부서 안의 역할들 **앞에 `없음`**을 둔다.
   *
   * ⚠️ `없음`은 빈 값이 아니라 **고른 결과**다(`NO_ROLE_ID`). 빈 값은 "아직 안 골랐다"라서,
   *    둘을 같은 값으로 두면 직급 칸을 언제 열지 알 수 없다.
   * ⚠️ 맨 위에 둔다 — 팀장을 넣을 때 가장 먼저 찾는 항목이다.
   */
  const rolesFor = (invite: Invite): SelectOption[] => {
    const departmentRoles = rolesOf(invite.departmentId);

    /*
      `없음`을 뺄지.
      ⚠️ `없음`으로 갈 수 있는 직급은 **리더뿐**인데, 그 부서에 리더가 이미 있으면
         고르는 순간 직급 목록이 비어 막다른 길이 된다 — 갈 수 없는 길은 보여주지 않는다.
      ⚠️ 단, 역할이 없는 부서는 예외다. 거기선 `없음`이 유일한 선택지이고
         직급도 전부 열린다(`fitsRoleAndPosition`).
    */
    const leaderTaken = departmentsWithLeader(list.invites, isLeaderPosition, invite.id).has(
      invite.departmentId,
    );
    const isDeadEnd = leaderTaken && departmentRoles.length > 0;
    const keepsNone = !isDeadEnd || invite.roleId === NO_ROLE_ID;

    return keepsNone
      ? [{ id: NO_ROLE_ID, name: NO_ROLE_LABEL }, ...departmentRoles]
      : departmentRoles;
  };

  /**
   * 역할 칸을 통째로 잠글지.
   * - **리더 직급**이면 역할은 `없음` 하나뿐이다.
   * - **역할이 없는 부서**면 고를 게 `없음`뿐이라 이미 정해져 있다(`changeInviteDepartment`).
   *
   * ⚠️ 항목을 하나씩 잠그지 않는다. 고를 수 없는 줄이 목록을 채우면 무엇이 남았는지
   *    읽히지 않는다 — 칸 자체를 잠그면 `없음`이 그대로 보인다.
   */
  const isRoleLocked = (invite: Invite) =>
    isLeaderPosition(invite.positionId) || !rules.hasRoles(invite.departmentId);

  const duplicatedLeaders = duplicatedLeaderIds(list.invites, isLeaderPosition);

  useDraftSync({
    value: list.invites,
    load: () => loadDraft().invites,
    save: saveDraftInvites,
    restore: list.reset,
  });

  // 1단계에서 부서를 지웠다면, 그 부서를 가리키던 줄을 기본값으로 되돌린다.
  // 선택지가 확정된 뒤에만 돈다 — 그전에 돌면 보관함에 있던 선택이 지워진다.
  useEffect(() => {
    if (!isReady) return;

    list.remapToOptions(
      new Set(departmentOptions.map((option) => option.id)),
      new Set(positionOptions.map((option) => option.id)),
      (departmentId) => new Set(rolesOf(departmentId).map((option) => option.id)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, departmentOptions, positionOptions]);

  const router = useRouter();
  useCommittedRedirect();

  const [isConfirmOpen, setConfirmOpen] = useState(false);

  /** 주소는 적었는데 부서·직급을 안 골라 발송에서 빠지는 줄 — 확인 창에서 알린다 */
  const skippedCount = list.invites.filter(
    (invite: Invite) =>
      invite.email.trim().length > 0 &&
      (!invite.departmentId || !invite.roleId || !invite.positionId),
  ).length;

  /**
   * [완료] — **확인 창을 거친 뒤에야** 확정된다(2026-08-04 변경).
   *
   * ⚠️ 확인 없이 넘기지 않는다. 이 한 번으로 앞 세 단계가 굳고 초대장이 나가는데,
   *    나간 메일은 취소되지 않고 이 단계로 돌아올 수도 없다.
   * ⚠️ 실제 메일 발송은 서버가 한다 — 지금은 목이라 목록만 확정된다.
   *    BE 연동 후 이 자리에서 `POST /companies/me/onboarding`으로 함께 커밋한다.
   */
  /*
    ⚠️ **`isSent`는 서버가 보냈다고 답한 줄에만 붙여야 한다.** 완료 화면의 초대 수가 이 값을
       세므로, 지금처럼 요청 없이 전부 찍으면 부분 실패 때 실제보다 많은 수를 말한다.
       TODO(BE 연동): 커밋 응답의 성공 목록으로 `markSent(ids)`를 부른다.
  */
  const handleCommit = () => {
    const count = list.sendable.length;
    if (count > 0) {
      list.markSent();
      toast.success(`${count}명에게 초대장을 보냈습니다`);
    }

    // ⚠️ 서버 커밋이 붙으면 **응답 성공 뒤에** 찍는다 — 지금은 목이라 바로 찍는다
    markDraftCommitted();
    setConfirmOpen(false);
    /*
      ⚠️ `push`가 아니라 `replace`다. 넘어간 뒤 뒤로가기를 누르면 3단계가 잠깐 보였다가
         가드에 걸려 다시 튕겨 나온다 — 되돌아갈 수 없는 자리는 히스토리에 남기지 않는다.
    */
    router.replace("/onboarding/payment");
  };

  const handlers: InviteRowHandlers = {
    onChangeName: list.changeName,
    onChangeEmail: list.changeEmail,
    onChangeDepartment: list.changeDepartment,
    onChangeRole: list.changeRole,
    onChangePosition: list.changePosition,
    onToggleAdmin: list.toggleAdmin,
    onRemove: list.remove,
    departments: departmentOptions,
    rolesFor,
    isRoleLocked,
    positionsFor,
  };

  return (
    <div className="flex flex-col gap-[21px]">
      {/* 적어 둔 게 있으면 탭을 닫기 전에 브라우저가 한 번 물어본다 — 저장은 이 탭 안에만 있다 */}
      {/*
        ⚠️ `sendable`은 **주소가 유효한 줄**만 센다. 적다 만 줄도 잃을 것이라
           여기서는 뭐라도 적힌 줄을 기준으로 본다.
        ⚠️ `isSent`는 보지 않는다. [완료] 직후엔 모든 줄이 `isSent`라, 그걸 세면
           **이미 제출을 마친 사람**까지 붙잡아 "저장 안 됐다"는 창을 띄운다.
      */}
      <LeaveGuard hasUnsaved={list.invites.some((invite) => invite.email.trim().length > 0)} />

      {/* 높이를 여기서 한 번만 정한다 — 좌우 두 칸이 같은 높이를 나눠 쓴다(2단계와 동일) */}
      {/*
        ⚠️ 높이를 560px로 못박으면 낮은 화면(노트북 150% 배율 등)에서 아래가 잘린다.
           **세로가 충분할 때만** 고정한다 — 좁으면 내용 높이 그대로 두고 페이지가 스크롤되게 한다.
      */}
      <div className="flex flex-col gap-7 lg:flex-row [@media(min-height:820px)]:lg:h-[560px]">
        <InviteIntro
          invites={list.sendable}
          departments={departmentOptions}
          rolesOf={rolesOf}
          positions={positionOptions}
        />

        {/* 높이 고정 — 줄을 아무리 추가해도 카드 크기는 그대로고 안에서만 스크롤된다 */}
        <section className="border-border bg-card flex h-[460px] flex-1 flex-col overflow-hidden rounded-xl border shadow-sm [@media(min-height:820px)]:lg:h-full">
          {/* 1·2단계 카드 헤더와 **같은 높이·글자**다(h-12 · 13px) — 단계마다 다르면 넘길 때 화면이 들썩인다 */}
          <header className="border-border bg-muted flex h-12 shrink-0 items-center border-b px-4">
            <h2 className="flex items-center gap-2 text-[13px] leading-5">
              <span className="bg-foreground size-2 rounded-full" aria-hidden />
              초대 목록
            </h2>
          </header>

          <InviteColumnHead />

          {/* 스크롤바는 숨긴다(스크롤 자체는 된다) */}
          <div className="flex-1 [scrollbar-width:none] overflow-auto overscroll-contain [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {list.invites.map((invite: Invite, index: number) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                index={index}
                isDuplicated={list.isDuplicated(invite)}
                isDuplicatedLeader={duplicatedLeaders.has(invite.id)}
                hasPlaceholder={index === 0}
                {...handlers}
              />
            ))}
          </div>

          <InviteSendBar sendableCount={list.sendable.length} onAddRow={list.addRow} />
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
            ⚠️ **[다음]이 아니라 [완료]다**(2026-08-04). 조직 구성이 여기서 끝나고
               초대장도 함께 나간다 — 다음 칸으로 넘어가는 것과 무게가 다르다.
               남은 결제는 4단계 진행 표시가 알린다.
            ⚠️ 링크가 아니라 버튼이다. 확인 창을 거쳐야 넘어간다.
            시안의 주 버튼은 액센트(파랑)가 아니라 먹색이다(토큰 충돌 — 팀 확인 필요). */}
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          className={cn(
            buttonVariants(),
            "bg-foreground text-background hover:bg-foreground/90 h-[34px] gap-[5.25px] rounded-md px-[12.25px] text-[13px] leading-none",
          )}
        >
          <Check className="size-3.5" />
          <span className="leading-none">완료</span>
        </button>
      </div>

      <InviteCommitDialog
        isOpen={isConfirmOpen}
        onOpenChange={setConfirmOpen}
        departmentCount={departmentOptions.length}
        positionCount={positionOptions.length}
        inviteCount={list.sendable.length}
        skippedCount={skippedCount}
        onConfirm={handleCommit}
      />
    </div>
  );
}
