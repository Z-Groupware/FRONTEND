import { CALENDAR_TAG_DOT_COLOR } from "../tag-colors";
import { CALENDAR_ITEM_TAG } from "../types";

/**
 * ⚠️ 라벨은 일부러 `CALENDAR_ITEM_TAG_LABEL`("개인 Todo")과 다르다 — 범례는 "Todo"로 짧게 쓰기로
 *    확정했다(2026-08-05). 색만 `tag-colors.ts`로 공유하고 라벨 문구는 여기서 따로 관리한다.
 */
const LEGEND_ITEMS = [
  { key: CALENDAR_ITEM_TAG.PERSONAL_TODO, label: "Todo" },
  { key: CALENDAR_ITEM_TAG.PERSONAL_ACTION, label: "개인 액션" },
] as const;

/** 캘린더 상단 툴바 오른쪽 끝에 붙는 색상 범례. */
export function CalendarLegend() {
  return (
    <ul className="flex items-center gap-4">
      {LEGEND_ITEMS.map((item) => (
        <li key={item.key} className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="size-2 rounded-full"
            style={{ backgroundColor: CALENDAR_TAG_DOT_COLOR[item.key] }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
