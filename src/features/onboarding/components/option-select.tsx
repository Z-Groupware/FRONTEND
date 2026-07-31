"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  id: string;
  name: string;
  /** 고를 수 없는 항목 — 왜 못 고르는지는 `hint`로 알린다 */
  disabled?: boolean;
  /** 항목 옆에 붙일 짧은 설명 */
  hint?: string;
}

interface OptionSelectProps {
  value: string;
  onChange: (id: string) => void;
  options: SelectOption[];
  /** 스크린리더용 이름 — 어느 줄의 무엇을 고르는지 알려준다 */
  label: string;
  /** 고를 게 없을 때 보여줄 문구 */
  emptyText: string;
  /** 칸 너비(px). 펼친 목록도 같은 폭을 써서 트리거와 어긋나지 않는다. */
  width: number;
  /** 아직 고를 수 없는 상태. 왜 못 고르는지는 `disabledText`로 알린다. */
  disabled?: boolean;
  /** 잠겨 있을 때 칸에 보여줄 문구 */
  disabledText?: string;
  /** 빈 값("없음")도 고를 수 있게 한다 */
  allowNone?: boolean;
  /** "없음" 항목에 쓸 문구 */
  noneText?: string;
  className?: string;
}

/**
 * 이름 목록에서 하나를 고르는 칸. 부서·직급이 같은 모양을 쓴다.
 * 폭을 고정해 어떤 이름이 와도 열이 흔들리지 않는다(길면 잘린다).
 */
export function OptionSelect({
  value,
  onChange,
  options,
  label,
  emptyText,
  width,
  disabled = false,
  disabledText,
  allowNone = false,
  noneText = "없음",
  className,
}: OptionSelectProps) {
  /** base-ui Select는 빈 문자열을 "고른 게 없음"으로 봐서 값이 안 잡힌다 — 별도 키를 쓴다 */
  const NONE = "__none__";
  const nameOf = (id: string) => options.find((option) => option.id === id)?.name;

  if (disabled) {
    return (
      <span
        style={{ width }}
        aria-label={`${label} — ${disabledText ?? "아직 고를 수 없어요"}`}
        className={cn(
          "text-muted-foreground/50 border-border/60 flex h-7 items-center justify-center rounded-md border border-dashed px-2 text-xs",
          className,
        )}
      >
        {disabledText ?? emptyText}
      </span>
    );
  }

  // 고를 게 아무것도 없고 "없음"조차 못 쓰면 칸을 잠근다
  if (options.length === 0 && !allowNone) {
    return (
      <span
        style={{ width }}
        className={cn(
          "text-muted-foreground/60 border-border flex h-7 items-center justify-center rounded-md border border-dashed px-2 text-xs",
          className,
        )}
      >
        {emptyText}
      </span>
    );
  }

  return (
    // 선택 해제(null)는 쓰지 않는다 — 부서·직급은 항상 하나가 골라져 있다
    <Select
      value={allowNone && value === "" ? NONE : value}
      onValueChange={(next) => {
        if (!next) return;
        onChange(next === NONE ? "" : (next as string));
      }}
    >
      <SelectTrigger
        aria-label={label}
        style={{ width }}
        // data-[size=default]:h-8 이 기본으로 걸려 있어 h-7만으로는 안 먹는다 —
        // 옆 입력칸(28px)과 높이를 맞춰야 한 줄로 보인다
        className={cn(
          "h-7 justify-between px-2 text-xs leading-none data-[size=default]:h-7",
          className,
        )}
      >
        <SelectValue>
          {(id) => (id === NONE ? noneText : (nameOf(id as string) ?? emptyText))}
        </SelectValue>
      </SelectTrigger>

      {/*
        alignItemWithTrigger={false} — 고른 항목이 트리거 위로 겹쳐 올라오지 않게 한다.
        기본 min-w-36이 트리거보다 넓다 — 칸 폭에 맞춘다(2단계 권한 선택과 같은 형태).
      */}
      <SelectContent
        side="bottom"
        align="start"
        sideOffset={4}
        alignItemWithTrigger={false}
        // 트리거 폭을 최소로만 쓴다 — 좁은 칸(76px)에서 설명이 체크 표시와 겹치던 문제
        style={{ minWidth: width }}
        className="w-auto min-w-0"
      >
        {allowNone && (
          <SelectItem value={NONE} className="text-muted-foreground text-xs">
            {noneText}
          </SelectItem>
        )}
        {options.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
            disabled={option.disabled && option.id !== value}
            className="text-xs"
          >
            {option.name}
            {option.disabled && option.id !== value && option.hint && (
              <span className="text-muted-foreground/60 text-[10px] whitespace-nowrap">
                {option.hint}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
