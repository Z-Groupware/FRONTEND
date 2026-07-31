"use client";

import { Check, CircleAlert, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { isValidEmail } from "../invites";
import type { Invite } from "../types";
import { OptionSelect, type SelectOption } from "./option-select";

export interface InviteRowHandlers {
  onChangeEmail: (id: string, email: string) => void;
  onChangeDepartment: (id: string, departmentId: string) => void;
  onChangeRole: (id: string, roleId: string) => void;
  onChangePosition: (id: string, positionId: string) => void;
  onRemove: (id: string) => void;
  departments: SelectOption[];
  /** 지금 고른 부서의 역할 목록을 준다 — 부서마다 다르다 */
  rolesOf: (departmentId: string) => SelectOption[];
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
}

export function InviteRow({
  invite,
  index,
  isDuplicated,
  isDuplicatedLeader,
  ...handlers
}: InviteRowProps) {
  const { onChangeEmail, onChangeDepartment, onChangeRole, onChangePosition, onRemove } = handlers;

  // 부서를 골라야 그 안의 역할이 정해진다
  const roleOptions = handlers.rolesOf(invite.departmentId);

  const email = invite.email.trim();
  // 이미 초대장이 나간 줄 — 고치거나 다시 보낼 수 없다
  const isSent = invite.isSent;
  // 입력 중에는 잔소리하지 않는다 — 뭔가 적혔는데 형식이 어긋날 때만 표시한다
  const hasFormatError = !isSent && email.length > 0 && !isValidEmail(email);
  const errorText = hasFormatError
    ? "메일 주소 형식이 아니에요"
    : !isSent && isDuplicated
      ? "같은 주소가 위에 또 있어요"
      : !isSent && isDuplicatedLeader
        ? "이 부서에는 이미 리더가 있어요"
        : null;
  const errorId = errorText ? `invite-error-${invite.id}` : undefined;

  return (
    // 행 높이는 고정이다 — 에러가 떠도 칸이 커지지 않게 문구를 입력칸 오른쪽에 둔다
    <div
      className={cn(
        "group border-border flex h-[46px] items-center gap-2 border-t px-4 transition-colors",
        isSent ? "bg-secondary/40" : "hover:bg-secondary/60",
      )}
    >
      {/* 2단계와 같은 번호 칸. 초대는 순서에 의미가 없어 드래그 손잡이는 두지 않는다 */}
      {/* 번호는 발송 여부와 관계없이 그대로 둔다 — 상태는 오른쪽 "발송 완료"가 알린다 */}
      <span className="text-muted-foreground/40 w-5 shrink-0 text-center text-[11px] leading-none tabular-nums">
        {index + 1}
      </span>

      <span className="flex flex-1 items-center gap-2">
        <label htmlFor={`invite-email-${invite.id}`} className="sr-only">
          초대할 메일 주소
        </label>
        <Input
          id={`invite-email-${invite.id}`}
          type="email"
          inputMode="email"
          autoComplete="off"
          value={invite.email}
          placeholder="name@company.com"
          readOnly={isSent}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={errorId}
          onChange={(event) => onChangeEmail(invite.id, event.target.value)}
          className={cn(
            // 폭 고정 — 메일 주소 길이에 맞춘 크기다. 남는 자리는 비워 둔다
            "h-7 w-[196px] shrink-0 border-transparent bg-transparent px-2 text-[13px] shadow-none",
            errorText && "border-destructive/60",
            isSent && "text-muted-foreground pointer-events-none",
          )}
        />
        {/*
          문구 자리는 **항상 비워둔다** — 에러가 떠도 입력칸 폭이 변하지 않게.
          자리를 안 잡아두면 글자가 들어오는 순간 입력칸이 줄어든다.
        */}
        {/* md 미만에서는 자리가 없어 눈에서만 감춘다 — 스크린리더는 계속 읽어야 한다 */}
        <span className="sr-only md:not-sr-only md:block md:w-[208px] md:shrink-0">
          {errorText && (
            <span
              id={errorId}
              className="text-destructive flex items-center gap-1 text-[11px] leading-4 whitespace-nowrap"
            >
              <CircleAlert className="size-3.5 shrink-0" aria-hidden />
              {errorText}
            </span>
          )}
          {isSent && (
            <span className="text-muted-foreground/60 flex items-center gap-1 text-[11px] leading-4">
              <Check className="size-3.5 shrink-0" aria-hidden />
              발송 완료
            </span>
          )}
        </span>
      </span>

      <span className={cn("w-[104px] shrink-0", isSent && "opacity-60")}>
        <OptionSelect
          disabled={isSent}
          value={invite.departmentId}
          onChange={(departmentId) => onChangeDepartment(invite.id, departmentId)}
          options={handlers.departments}
          label={`${email || "새 초대"} 부서`}
          emptyText="부서 없음"
          width={104}
          // 값이 열 헤더(부서) 바로 아래 가운데로 오게 한다 — 2단계 직급명과 같은 정렬
          className="justify-center gap-1"
        />
      </span>

      <span className={cn("w-[104px] shrink-0", isSent && "opacity-60")}>
        <OptionSelect
          value={invite.roleId}
          onChange={(roleId) => onChangeRole(invite.id, roleId)}
          options={roleOptions}
          label={`${email || "새 초대"} 역할`}
          emptyText="없음"
          width={104}
          // 이미 나간 줄은 잠근다. 부서를 아직 안 고른 줄도 마찬가지다.
          // 발송된 줄은 `disabledText`를 주지 않는다 — 보낸 역할을 그대로 보여줘야 한다.
          disabled={isSent || !invite.departmentId}
          disabledText={isSent ? undefined : "부서 먼저"}
          allowNone
          noneText="없음"
          className="justify-center gap-1"
        />
      </span>

      <span className={cn("w-[76px] shrink-0", isSent && "opacity-60")}>
        <OptionSelect
          disabled={isSent}
          value={invite.positionId}
          onChange={(positionId) => onChangePosition(invite.id, positionId)}
          options={handlers.positionsFor(invite)}
          label={`${email || "새 초대"} 직급`}
          emptyText="직급 없음"
          width={76}
          className="justify-center gap-1"
        />
      </span>

      {isSent ? (
        // 이미 나간 초대장은 뺄 수 없다 — 호버해도 X가 뜨지 않게 자리만 남긴다
        <span className="size-6 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          aria-label={`${email || "빈 줄"} 초대 목록에서 빼기`}
          onClick={() => onRemove(invite.id)}
          className="text-muted-foreground hover:text-foreground hover:bg-foreground/10 focus-visible:ring-ring flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-[color,background-color,opacity] group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
