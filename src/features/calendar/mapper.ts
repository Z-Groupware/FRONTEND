import { CALENDAR_ITEM_TAG, type PersonalCalendarEvent } from "./types";

/**
 * BE 캘린더 항목 — `GET /api/calendar` 응답 한 줄(§Mock 격리막).
 * [확인] BE PL 연동 가이드(2026-08-13, PR #457 머지 완료) — `CalendarItemResponse` 소스·테스트 대조.
 *
 * ⚠️ 판별자는 `type`이다(`tag`가 아니다) — `tag`는 PROJECT 전용 프로젝트 태그 문자열이고
 *    ACTION·TODO에서는 항상 `null`. `id`·`isDone`도 **TODO에서만** 값이 있고 PROJECT·ACTION은
 *    항상 `null`이다.
 * ⚠️ PR #459(endDate 지원) 병합 전에는 TODO의 `endDate`가 항상 `startDate`와 같은 값으로 온다 —
 *    기간(구간) 표시는 그 PR이 머지된 뒤에야 실제로 동작한다.
 */
export interface BeCalendarItem {
  type: "PROJECT" | "ACTION" | "TODO";
  id: number | null;
  title: string;
  tag: string | null;
  startDate: string;
  endDate: string;
  isDone: boolean | null;
}

/**
 * BE 항목 → UI 계약. **PROJECT는 아직 안 그린다** — OWNER용 프로젝트 캘린더 표시(색상 매핑
 * 포함)는 `CalendarItemTag`에 PROJECT 케이스를 새로 정의해야 하는 별도 이슈라, 여기서는 `null`로
 * 걸러 화면이 조용히 잘못 그리지 않게 한다(§정직성).
 */
export function toPersonalCalendarEvent(
  be: BeCalendarItem,
  index: number,
): PersonalCalendarEvent | null {
  if (be.type === "PROJECT") return null;

  const isTodo = be.type === "TODO";
  return {
    // ⚠️ ACTION은 이 피드에서 id를 안 준다(BE 스펙, 항상 null) — 완료 토글도 없는 읽기 전용
    //    표시라 렌더링 키로만 쓰이는 합성 id로 충분하다.
    id: isTodo && be.id !== null ? String(be.id) : `action-${index}`,
    title: be.title,
    start: new Date(`${be.startDate}T00:00:00`),
    end: new Date(`${be.endDate}T00:00:00`),
    tag: isTodo ? CALENDAR_ITEM_TAG.PERSONAL_TODO : CALENDAR_ITEM_TAG.PERSONAL_ACTION,
    isCompleted: be.isDone ?? false,
  };
}
