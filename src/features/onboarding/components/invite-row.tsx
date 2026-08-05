"use client";

import { CircleAlert, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { isValidEmail } from "../invites";
import type { Invite } from "../types";
import { NO_ROLE_LABEL } from "../types";
import { InviteAdminToggle } from "./invite-admin-toggle";
import { INVITE_COLUMN, INVITE_SELECT_WIDTH } from "./invite-columns";
import { OptionSelect, type SelectOption } from "./option-select";

/** 아직 안 고른 선택 칸에 띄우는 글자 — 세 칸이 같은 말을 한다 */
const PICK_PLACEHOLDER = "선택";

export interface InviteRowHandlers {
  onChangeName: (id: string, name: string) => void;
  onChangeEmail: (id: string, email: string) => void;
  onChangeDepartment: (id: string, departmentId: string) => void;
  onChangeRole: (id: string, roleId: string) => void;
  onChangePosition: (id: string, positionId: string) => void;
  onToggleAdmin: (id: string) => void;
  onRemove: (id: string) => void;
  departments: SelectOption[];
  /** 그 줄에서 고를 수 있는 역할 — 부서 안의 역할들 앞에 `없음`이 붙는다 */
  rolesFor: (invite: Invite) => SelectOption[];
  /** 역할 칸을 잠글지 — 리더 직급이면 역할은 `없음` 하나뿐이다 */
  isRoleLocked: (invite: Invite) => boolean;
  /** 줄마다 다르다 — 그 부서에 이미 리더가 있으면 리더 직급을 잠근다 */
  positionsFor: (invite: Invite) => SelectOption[];
}

interface InviteRowProps extends InviteRowHandlers {
  invite: Invite;
  /** 목록에서 몇 번째인지(0부터). 화면에는 1부터 보여준다. */
  index: number;
  /** 위에 같은 주소가 또 있는지 */
  isDuplicated: boolean;
  /** 같은 부서에 리더가 이미 있는지 */
  isDuplicatedLeader: boolean;
  /**
   * 이름·주소 칸에 안내 글자를 띄울지.
   *
   * ⚠️ **첫 줄에만** 켠다. 줄마다 켜 두면 행을 몇 개 추가한 순간 목록이 회색 글자로 뒤덮여
   *    정작 적어 넣은 줄이 안 보인다. 맨 윗줄이 보기 노릇을 하면 그걸로 충분하다.
   */
  hasPlaceholder: boolean;
}

export function InviteRow({
  invite,
  index,
  isDuplicated,
  isDuplicatedLeader,
  hasPlaceholder,
  ...handlers
}: InviteRowProps) {
  const { onChangeName, onChangeEmail, onChangeDepartment, onChangeRole, onChangePosition } =
    handlers;
  const { onRemove } = handlers;
  const { onToggleAdmin } = handlers;

  // 부서를 골라야 그 안의 역할이 정해진다
  const roleOptions = handlers.rolesFor(invite);

  const email = invite.email.trim();
  /*
    아직 아무것도 안 적은 줄.
    ⚠️ **테두리는 채운 줄과 똑같이 그린다**(팀 결정). 한때 연하게 눕혔더니 줄 전체가
       비활성으로 읽혔다 — 안 채운 것과 못 쓰는 것은 다르다.
       구분은 **안내 글자**(`선택`)의 세기로만 한다.
  */
  const isBlank = !email;
  /*
    ⚠️ **줄 단위 "발송 완료" 잠금은 없다**(2026-08-04). [완료]가 발송과 단계 이동을 함께 해서,
       보낸 줄이 이 화면에 남아 있는 순간이 없다 — 발송된 목록으로 돌아오면 결제로 돌려보낸다.
       잠긴 줄을 그릴 일이 없는데 잠금 UI를 두면, 읽는 사람이 없는 상태를 상상하게 된다.
  */
  // 입력 중에는 잔소리하지 않는다 — 뭔가 적혔는데 형식이 어긋날 때만 표시한다
  const hasFormatError = email.length > 0 && !isValidEmail(email);
  /*
    ⚠️ 문구는 **한 줄에 들어가게 짧게** 쓴다. 길면 옆 칸(부서·역할)을 밀거나 접혀서
       행 높이가 들쭉날쭉해진다 — 무엇이 잘못됐는지만 알리고, 자세한 규칙은 왼쪽 안내가 맡는다.
  */
  /*
    ⚠️ **부서·직급을 안 골랐다고 줄에 빨간 글씨를 띄우지 않는다.** 그건 "틀렸다"가 아니라
       "아직 안 끝났다"라서, 다 적기도 전에 줄마다 경고가 붙으면 목록이 경고밭이 된다.
       빠지는 줄이 있으면 [완료] 확인 창이 몇 줄인지 알려 준다(`InviteCommitDialog`).
    ⚠️ 반면 주소 형식 오류는 **지금 치고 있는 칸**에 대한 말이라 그 자리에 남는다 —
       토스트로 옮기면 어느 줄인지 못 짚고 사라진다(CLAUDE.md §토스트).
  */
  const errorText = hasFormatError
    ? "주소 형식이 아닙니다"
    : isDuplicated
      ? "위에 같은 주소가 있습니다"
      : isDuplicatedLeader
        ? "리더가 이미 있습니다"
        : null;
  const errorId = errorText ? `invite-error-${invite.id}` : undefined;

  return (
    /*
      ⚠️ 행 높이는 고정이다 — 줄마다 높이가 달라지면 목록이 들썩인다.
      ⚠️ 에러 문구는 이메일 칸 **오른쪽**에 둔다. 아래에 두면 그만큼 입력칸이 위로 밀려
         옆의 선택 칸들과 한 줄로 안 선다 — 대신 가로가 필요해 셸 폭을 1440으로 키웠다.
      ⚠️ 문구 칸은 **남는 자리를 그대로 쓴다**(`flex-1`). 폭을 고정하면 좁은 화면에서
         오른쪽 칸(직급·Admin)이 잘리고, 넓은 화면에서는 빈 자리가 남는다.
         자리가 모자라면 문구를 줄임표로 자르고 전체는 `title`로 읽게 둔다.
    */
    <div
      className={cn(
        "group border-border hover:bg-secondary/60 relative flex h-[60px] items-center gap-3 border-t px-4 transition-colors",
      )}
    >
      {/* 2단계와 같은 번호 칸. 초대는 순서에 의미가 없어 드래그 손잡이는 두지 않는다 */}
      <span className="text-muted-foreground/40 w-5 shrink-0 text-center text-[12px] leading-none tabular-nums">
        {index + 1}
      </span>

      {/*
        ⚠️ 안내 글자는 **첫 줄에만**, 그것도 연하게(`/45`) 띄운다(`hasPlaceholder`).
        ⚠️ 이름이 **먼저**다. 목록을 훑을 때 사람을 먼저 찾지 주소를 먼저 찾지 않는다 —
           회사 메일이 `dev01@`처럼 이름과 무관한 경우가 흔하다.
      */}
      {/*
        이름은 세 글자가 대부분이다 — 칸이 넓으면 가운데 글자만 뜨고 양옆이 비어,
        옆 선택 칸(글자가 칸을 거의 채운다)과 견줘 이 칸만 헐거워 보인다.
      */}
      <span className={cn(INVITE_COLUMN.NAME, "shrink-0")}>
        <label htmlFor={`invite-name-${invite.id}`} className="sr-only">
          받는 사람 이름
        </label>
        <Input
          id={`invite-name-${invite.id}`}
          autoComplete="off"
          value={invite.name}
          placeholder={hasPlaceholder ? "이름" : undefined}
          onChange={(event) => onChangeName(invite.id, event.target.value)}
          className={cn(
            /*
              ⚠️ 옆의 선택 칸과 **같은 모양**을 쓴다(테두리 · 둥근 모서리 · 같은 높이).
                 전에는 테두리 없이 글자만 떠 있어서, 알약처럼 생긴 선택 칸들과 따로 놀았다.
            */
            "border-input h-8 w-full min-w-0 rounded-lg bg-transparent px-2.5 text-[14px] shadow-none",
            // ⚠️ 이름만 가운데 정렬이다 — 칸이 좁아(68px) 글자가 왼쪽에 붙으면
            //    머리글 `이름`과 세로축이 어긋나 열이 밀려 보인다. 주소는 길어서 왼쪽 정렬을 유지한다.
            "placeholder:text-muted-foreground/45 text-center",
          )}
        />
      </span>

      {/*
        이메일.
        ⚠️ `flex-1`로 두면 넓은 화면에서 이 칸만 끝없이 늘어나 오른쪽 선택 칸들과 사이가 벌어진다.
           **폭을 정해 두고** 남는 자리는 아래 문구 칸이 먹게 한다.
      */}
      <span
        className={cn(
          INVITE_COLUMN.EMAIL,
          "ml-1 shrink-0",
          errorText && INVITE_COLUMN.EMAIL_WITH_MESSAGE,
        )}
      >
        <label htmlFor={`invite-email-${invite.id}`} className="sr-only">
          초대할 메일 주소
        </label>
        <Input
          id={`invite-email-${invite.id}`}
          type="email"
          inputMode="email"
          // ⚠️ 예시에 **사람 이름을 쓰지 않는다**(`hong.gildong@`) — 실제 사원 주소로 읽힌다.
          //    짧은 예시(`name@`)는 들어올 주소보다 훨씬 짧아 칸이 남아 보이므로 길이는 이만큼 둔다.
          placeholder={hasPlaceholder ? "example@z-groupware.site" : undefined}
          autoComplete="off"
          value={invite.email}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => onChangeEmail(invite.id, event.target.value)}
          className={cn(
            "border-input placeholder:text-muted-foreground/45 h-8 w-full min-w-0 rounded-lg bg-transparent px-2.5 text-[14px] shadow-none",
            errorText && "border-destructive/60",
          )}
        />
      </span>

      {/* 문구 자리 — 남는 폭을 그대로 쓴다. 비어 있어도 자리를 지킨다 */}
      <span className={cn(INVITE_COLUMN.MESSAGE, "flex min-w-0 items-center")}>
        {errorText && (
          /*
            ⚠️ 자리가 모자라면 **잘린다**(`truncate`). 안 자르면 오른쪽 부서 칸 위로 글자가 겹쳐
               두 열이 뒤엉킨다 — 실제로 `부서·직급을 골라 주세요`가 부서 칸을 파고들었다.
               전체 문구는 `title`로 읽는다.
          */
          <span
            id={errorId}
            className="text-destructive flex min-w-0 items-center gap-1 text-[12px] leading-4"
            title={errorText}
          >
            <CircleAlert className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{errorText}</span>
          </span>
        )}
      </span>

      {/* ⚠️ 감싼 칸도 셀렉트와 **같은 폭**이어야 한다 — 다르면 열 머리와 세로축이 어긋난다 */}
      <span className={cn(INVITE_COLUMN.SELECT, "shrink-0")}>
        <OptionSelect
          value={invite.departmentId}
          onChange={(departmentId) => onChangeDepartment(invite.id, departmentId)}
          options={handlers.departments}
          label={`${email || "새 초대"} 부서`}
          emptyText="부서 없음"
          placeholder={PICK_PLACEHOLDER}
          width={INVITE_SELECT_WIDTH}
          isMuted={isBlank}
          // 값이 열 헤더(부서) 바로 아래 가운데로 오게 한다 — 2단계 직급명과 같은 정렬
          className="justify-center gap-1"
        />
      </span>

      <span className={cn(INVITE_COLUMN.SELECT, "shrink-0")}>
        <OptionSelect
          value={invite.roleId}
          onChange={(roleId) => onChangeRole(invite.id, roleId)}
          options={roleOptions}
          label={`${email || "새 초대"} 역할`}
          emptyText={NO_ROLE_LABEL}
          width={INVITE_SELECT_WIDTH}
          // 부서를 아직 안 고른 줄은 역할을 못 고른다 — 역할이 부서에 딸려 있다.
          // 리더 직급인 줄도 잠긴다 — 부서 전체를 맡는 자리라 역할은 `없음` 하나뿐이다.
          // 이유는 칸이 아니라 왼쪽 안내가 말한다("역할은 부서를 고른 뒤 정할 수 있습니다").
          disabled={!invite.departmentId || handlers.isRoleLocked(invite)}
          placeholder={PICK_PLACEHOLDER}
          isMuted={isBlank}
          className="justify-center gap-1"
        />
      </span>

      <span className={cn(INVITE_COLUMN.SELECT, "shrink-0")}>
        <OptionSelect
          value={invite.positionId}
          onChange={(positionId) => onChangePosition(invite.id, positionId)}
          options={handlers.positionsFor(invite)}
          label={`${email || "새 초대"} 직급`}
          emptyText="직급 없음"
          placeholder={PICK_PLACEHOLDER}
          width={INVITE_SELECT_WIDTH}
          // ⚠️ **부서 → 역할 → 직급 순서로 열린다.** 앞 칸을 비워둔 채 뒤 칸부터 고르면
          //    리더 직급처럼 앞 칸에 매인 규칙을 설명할 자리가 없다.
          // ⚠️ 단, 역할 칸이 잠긴 줄에서는 **직급을 연다.** 둘 다 잠기면 그 줄은 빠져나갈 길이
          //    없어진다 — 리더 직급을 다른 직급으로 바꿔야 역할이 다시 열리기 때문이다.
          disabled={!invite.roleId && !handlers.isRoleLocked(invite)}
          isMuted={isBlank}
          className="justify-center gap-1"
        />
      </span>

      {/*
        ⚠️ Admin은 **직급 옆 별도 칸**이다. 직급 드롭다운에 넣으면 "Leader 대신 Admin"으로 읽히는데,
           실제로는 Leader **이면서** Admin이다.
      */}
      <span className={cn(INVITE_COLUMN.ADMIN, "flex shrink-0 justify-center")}>
        <InviteAdminToggle
          isOn={invite.isAdmin}
          label={email || "새 초대"}
          onToggle={() => onToggleAdmin(invite.id)}
        />
      </span>

      <button
        type="button"
        aria-label={`${email || "빈 줄"} 초대 목록에서 빼기`}
        onClick={() => onRemove(invite.id)}
        className={cn(
          INVITE_COLUMN.REMOVE,
          "text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring flex shrink-0 items-center justify-center rounded opacity-0 transition-[color,background-color,opacity] group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-hidden",
        )}
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
