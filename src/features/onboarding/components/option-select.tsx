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
    /**
     * 잠긴 칸에는 두 가지가 있다.
     * - `disabledText`가 있으면 **아직 고를 수 없는 것**이다(부서를 안 골랐다) → 이유를 보여준다.
     * - 없으면 **이미 정해져 못 바꾸는 것**이다(발송 완료) → ⚠️ 고른 값을 그대로 둔다.
     *   여기서 값을 문구로 갈아치우면 보낸 내용과 화면이 달라 보인다.
     */
    const settled =
      value === "" ? (allowNone ? noneText : emptyText) : (nameOf(value) ?? emptyText);

    return (
      /*
        ⚠️ 고를 수 있는 칸과 **폭·높이·반지름·테두리를 똑같이** 맞춘다
           (`width` · `h-7` · `rounded-lg` · `border-input`). 하나라도 다르면 같은 줄에서
           두 칸이 다른 물건처럼 보인다 — 특히 반지름 차이가 제일 먼저 눈에 걸린다.
        ⚠️ 화살표는 넣지 않는다 — 누를 수 없는 칸에 열리는 표시를 두면 눌러 보게 된다.
           잠겼다는 건 흐린 글자와 그 줄 전체가 말한다.
      */
      <span
        style={{ width }}
        aria-label={`${label} — ${disabledText ?? `${settled}, 고칠 수 없어요`}`}
        className={cn(
          "text-muted-foreground border-input flex h-7 items-center justify-center rounded-lg border px-2 text-[11px]",
          className,
        )}
      >
        {disabledText ?? settled}
      </span>
    );
  }

  // 고를 게 아무것도 없고 "없음"조차 못 쓰면 칸을 잠근다
  if (options.length === 0 && !allowNone) {
    return (
      <span
        style={{ width }}
        className={cn(
          "text-muted-foreground border-input flex h-7 items-center justify-center rounded-lg border px-2 text-[11px]",
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
        // ⚠️ 정렬은 기본(`justify-between`)을 그대로 둔다. 대신 **칸을 내용에 맞게 좁혔다** —
        //    칸이 넓으면 글자와 화살표가 양 끝으로 벌어져 사이가 텅 비고, 칸 자체도 커 보인다.
        //    가운데로 모으는 것보다 이 편이 긴 이름이 들어와도 잘리며 버틴다.
        className={cn("h-7 px-2 text-[11px] leading-none data-[size=default]:h-7", className)}
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
