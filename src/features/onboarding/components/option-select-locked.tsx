"use client";

import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 못 고르는 칸 두 가지 — **아직 못 여는 칸**과 **고를 게 없는 칸**.
 *
 * ⚠️ 고를 수 있는 칸과 **폭·높이·반지름·테두리까지 똑같이** 맞춘다. 모양이 달라지면
 *    "왜 이 칸만 다르지"가 되고, 한 줄에 선 다른 칸들과 세로축이 어긋난다.
 * ⚠️ **왜 못 고르는지 칸 안에 적지 않는다.** `부서 먼저` 같은 문구를 값 자리에 넣으면
 *    그게 고른 값처럼 읽힌다 — 이유는 왼쪽 안내가 맡는다.
 */

interface LockedSelectProps {
  /** 잠겼어도 **고른 값은 그대로 보여준다** — 무엇으로 정해졌는지 알아야 한다 */
  text: string;
  label: string;
  width: number;
  className?: string;
}

/** 앞 칸을 안 골랐거나 규칙에 매여 잠긴 칸 — 꺽쇠까지 그대로 두고 글자만 흐리다 */
export function LockedSelect({ text, label, width, className }: LockedSelectProps) {
  return (
    <span
      style={{ width }}
      aria-disabled
      aria-label={`${label} — ${text}, 고칠 수 없습니다`}
      className={cn(
        // ⚠️ `opacity`로 흐리지 않는다 — 테두리까지 같이 흐려져 옆 칸과 세기가 어긋난다.
        //    잠겼다는 건 **글자 색**만으로 말하고, 테두리는 옆 칸과 똑같이 둔다.
        "text-muted-foreground/60 border-input flex h-8 cursor-not-allowed items-center justify-center gap-1 rounded-lg border pr-1.5 pl-2.5 text-[14px]",
        className,
      )}
    >
      <span className="truncate">{text}</span>
      <ChevronDownIcon className="size-3.5 shrink-0" aria-hidden />
    </span>
  );
}

/** 고를 게 아무것도 없고 `없음`조차 못 쓰는 칸 — 꺽쇠도 두지 않는다(펼칠 게 없다) */
export function EmptySelect({
  text,
  width,
  className,
}: {
  text: string;
  width: number;
  className?: string;
}) {
  return (
    <span
      style={{ width }}
      className={cn(
        "text-muted-foreground border-input flex h-8 items-center justify-center rounded-lg border px-2.5 text-[14px]",
        className,
      )}
    >
      {text}
    </span>
  );
}
