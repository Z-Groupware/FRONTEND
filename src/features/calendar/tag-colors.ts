import { CALENDAR_ITEM_TAG, type CalendarItemTag } from "./types";

/**
 * 태그별 색 — **공용 팔레트에서 가져온다**(DESIGN §5).
 *
 * ⚠️ 예전에는 `--calendar-todo`(#166534)·`--calendar-action`(#6d28d9)이라는 이 화면 전용
 *    값이었다. 팔레트 밖 색이라 프로젝트 태그·상태점 옆에 놓이면 같은 무리인지 알 수 없었고,
 *    진한 원색이라 셀을 칠하면 화면이 무거웠다.
 * ⚠️ **sky ↔ fuchsia**다(연하늘 ↔ 연보라핑크). 앞서 emerald+indigo는 둘 다 채도가 높아
 *    무거웠고, teal+purple은 둘 다 차가운 쪽이라 작은 칩에서 서로 비슷해 보였다 —
 *    지금 쌍은 **차가운 색 하나와 따뜻한 색 하나**라 나란히 놔도 헷갈리지 않는다.
 * ⚠️ 빨강 계열은 피한다 — 우리 빨강은 **에러 전용**이라 일정 색으로 쓰면 뜻이 섞인다.
 *    fuchsia는 분홍이되 빨강 쪽으로 넘어가지 않는 자리다.
 * ⚠️ **벌을 섞지 않는다**(§5). 글자가 얹히는 칩은 `bg`+`fg` 한 벌, 글자가 없는 점은 `solid`다.
 *    섞으면 대비가 무너진다.
 */

/** 칩 배경 — 옅다(파스텔). 다크에서는 어두운 쪽으로 뒤집힌다 */
export const CALENDAR_TAG_BG: Record<CalendarItemTag, string> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: "var(--tag-sky-bg)",
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: "var(--tag-fuchsia-bg)",
};

/** 그 칩 **위의 글자** — 같은 벌이라 대비가 보장된다 */
export const CALENDAR_TAG_FG: Record<CalendarItemTag, string> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: "var(--tag-sky-fg)",
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: "var(--tag-fuchsia-fg)",
};

/**
 * 글자가 안 얹히는 점·막대용 원색(600단계).
 * 범례(`calendar-legend.tsx`)와 일정 목록의 점이 쓴다.
 */
export const CALENDAR_TAG_DOT_COLOR: Record<CalendarItemTag, string> = {
  [CALENDAR_ITEM_TAG.PERSONAL_TODO]: "var(--tag-sky-solid)",
  [CALENDAR_ITEM_TAG.PERSONAL_ACTION]: "var(--tag-fuchsia-solid)",
};

/**
 * **진행 상태**의 색 — 태그 색과 **완전히 다른 벌**이다.
 *
 * ⚠️ 색이 총 넷이다: 무엇인지는 sky·fuchsia, 어디까지 됐는지는 **teal·slate**.
 *    한때 상태까지 태그 색으로 그렸는데, 그러면 "Todo"와 "진행중"이 같은 파랑이라
 *    **색이 무엇을 가리키는지 알 수 없었다** — 두 축은 색벌도 갈라야 축이 된다.
 * ⚠️ teal(진행중)·slate(완료)다. emerald는 sky 옆에서 탁했고 amber는 갈색으로 읽혔다.
 *    teal은 sky와 이웃이라 **채도로 갈린다** — 그래서 태그 콩과 상태 콩을 **구분선으로
 *    떼어 놓는 배치**가 전제다(`calendar-event-list-item.tsx`). 둘을 붙여 놓으면 헷갈린다.
 * ⚠️ 끝난 일은 무채색(slate)으로 물러난다 — 남은 일이 먼저 눈에 들어와야 한다.
 * ⚠️ 빨강은 안 쓴다 — 우리 빨강은 **에러 전용**이다(DESIGN §5).
 */
export const CALENDAR_STATUS_DOT_COLOR = {
  IN_PROGRESS: "var(--tag-teal-solid)",
  DONE: "var(--tag-slate-solid)",
} as const;

/** 완료 여부로 상태 색을 고른다 — 부르는 쪽이 삼항을 두 번 쓰지 않게. */
export function calendarStatusDotColor(isCompleted: boolean): string {
  return isCompleted ? CALENDAR_STATUS_DOT_COLOR.DONE : CALENDAR_STATUS_DOT_COLOR.IN_PROGRESS;
}
