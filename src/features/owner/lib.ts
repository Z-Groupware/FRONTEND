/*
 * 대시보드 두 박스의 고정 높이(px). `page.tsx`와 `loading.tsx`가 같은 골격을 그려야 해서
 * 여기 한 곳에 둔다.
 * ⚠️ 두 박스의 성격이 다르다:
 *   - 팀장 현황: 인원이 가변 → 고정 높이 + 넘치면 내부 스크롤.
 *   - 회의: 최대 `MEETING_MAX_ITEMS`건이 하드 캡 → 높이를 그 수에 딱 맞춰 잡아 **스크롤이 안 생긴다.**
 */

/** 회의 위젯 최대 노출 수. 서버가 이만큼 자르고(server.ts), 박스도 이 수에 맞춰 높이를 잡는다. */
export const MEETING_MAX_ITEMS = 5;

/** 회의 한 줄 높이(px). 박스 높이가 이 값 × 최대 수에서 나오므로 둘이 어긋나지 않게 한 곳에 둔다. */
export const MEETING_ITEM_HEIGHT = 72;

/** 두 박스 공통 헤더 높이(px) — `px-4 py-3` + 아래 보더 1px. */
const BOX_HEADER_HEIGHT = 45;

export const LEADER_BOX_HEIGHT = 420;
export const MEETING_BOX_HEIGHT = BOX_HEADER_HEIGHT + MEETING_MAX_ITEMS * MEETING_ITEM_HEIGHT;

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 마감 경과와 같은 파생값 — 상태 필드에 저장하지 않고 항상 계산한다(CLAUDE.md §도메인 상수).
 * ⚠️ `dueDate`는 `"2026-08-05"` 같은 **날짜 전용** 값이다. `new Date("2026-08-05")`는 UTC 자정으로
 *    해석돼 음수 오프셋 타임존에서 하루 어긋난다 — `T00:00:00`을 붙여 **로컬 자정**으로 파싱한다.
 */
export function getDaysUntilDue(dateIso: string): number {
  const due = new Date(`${dateIso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

/** 카피 규칙: 날짜 `8월 5일(화)` 포맷 고정(CLAUDE.md §디자인 토큰) */
export function formatMeetingDate(dateIso: string): string {
  const date = new Date(dateIso);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getMonth() + 1}월 ${date.getDate()}일(${WEEKDAY_LABEL[date.getDay()]}) ${hour}:${minute}`;
}
