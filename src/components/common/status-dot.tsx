import { cn } from "@/lib/utils";

/**
 * 상태점 — **할일·진행중·완료·지연을 색으로 구분하는 유일한 자리.**
 *
 * ⚠️ 색은 §디자인 토큰이 정한 값이다(할일=회색 · 진행중=초록 · 완료=보라 · 지연=빨강).
 *    여기 말고 다른 데서 이 색을 쓰면 같은 색이 두 가지 뜻을 갖게 된다.
 * ⚠️ **글자를 같이 적는다.** 점만 두면 색을 못 보는 사람에게 상태가 통째로 사라진다 —
 *    라벨은 부르는 쪽이 `*_STATUS_LABEL`에서 꺼내 넘긴다(§도메인 상수: 라벨 하드코딩 금지).
 * ⚠️ `지연`은 **상태가 아니라 파생값**이다(마감 경과). 상태 필드에 넣지 말고 계산해서
 *    `tone="delayed"`로 넘긴다.
 */

/**
 * 점 색을 고르는 기준. 액션·프로젝트가 같은 셋을 쓰므로 값으로 받는다.
 * ⚠️ 두 도메인의 타입을 여기서 하나로 합치지 않는다 — 한쪽 정책이 바뀔 때 끌려간다.
 */
export type StatusTone = "TODO" | "IN_PROGRESS" | "DONE" | "DELAYED";

const TONE_CLASS: Record<StatusTone, string> = {
  TODO: "bg-status-todo",
  IN_PROGRESS: "bg-status-progress",
  DONE: "bg-status-done",
  DELAYED: "bg-destructive",
};

interface StatusDotProps {
  tone: StatusTone;
  /** 화면에 나가는 한글 라벨 — `PROJECT_STATUS_LABEL[...]`처럼 라벨맵에서 꺼내 넘긴다 */
  label: string;
  className?: string;
}

export function StatusDot({ tone, label, className }: StatusDotProps) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASS[tone])} aria-hidden />
      {/* 한글 글자가 점보다 떠 보인다 — 1px 내려 맞춘다 */}
      <span className="translate-y-px">{label}</span>
    </span>
  );
}
