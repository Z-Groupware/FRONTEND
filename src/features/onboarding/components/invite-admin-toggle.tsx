"use client";

import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 초대 줄의 Admin 겸직 스위치.
 *
 * ⚠️ **역할 드롭다운에 넣지 않는다.** Admin은 Leader·Member를 대체하는 값이 아니라 그 위에
 *    얹히는 권한이라, 같은 목록에 두면 "Leader 대신 Admin"으로 읽힌다.
 * ⚠️ 켜짐/꺼짐을 색이 아니라 **채움과 아이콘**으로 알린다 — 색으로 알리는 건 에러뿐이다(§디자인 토큰).
 * ⚠️ `aria-pressed`로 상태를 읽힌다. 체크박스가 아니라 토글 버튼이라 `checked`가 아니다(§a11y).
 */
interface InviteAdminToggleProps {
  isOn: boolean;
  /** 이미 초대장이 나간 줄은 못 고친다 */
  isLocked: boolean;
  /** 스크린 리더가 어느 줄인지 알 수 있게 — 메일 주소를 넣는다 */
  label: string;
  onToggle: () => void;
}

export function InviteAdminToggle({ isOn, isLocked, label, onToggle }: InviteAdminToggleProps) {
  return (
    <button
      type="button"
      disabled={isLocked}
      aria-pressed={isOn}
      aria-label={`${label} Admin 겸직`}
      onClick={onToggle}
      className={cn(
        "focus-visible:ring-ring flex size-6 items-center justify-center rounded-md border transition-colors focus-visible:ring-2 focus-visible:outline-hidden",
        isOn
          ? "bg-foreground text-background border-foreground"
          : "border-border text-muted-foreground/50 hover:text-foreground hover:border-foreground/40",
        isLocked && "pointer-events-none opacity-60",
      )}
    >
      <ShieldCheck className="size-3.5" aria-hidden />
    </button>
  );
}
