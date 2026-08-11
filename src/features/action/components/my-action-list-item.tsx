import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { MyActionListItem } from "../types";

/** 상태 배지 색 — `member/components/action-timeline`의 BAR_CLASS와 같은 결(할일·완료=무채색, 진행중=초록, 지연=빨강). */
const STATUS_TONE: Record<"TODO" | "IN_PROGRESS" | "DONE" | "DELAYED", string> = {
  TODO: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-success/12 text-success",
  DONE: "bg-muted text-muted-foreground",
  DELAYED: "bg-destructive/10 text-destructive",
};

interface MyActionListItemRowProps {
  action: MyActionListItem;
  /** 목록의 첫 항목이 아니면 위쪽 구분선을 그린다 */
  showDivider: boolean;
  /**
   * 카드 모서리(rounded-2xl)와 맞물리는 위치인지 — 왼쪽 막대가 카드 곡선과 어긋나면
   * 위아래 끝이 잘린 것처럼 보인다. 막대 자체를 카드와 같은 반지름으로 둥글려서 카드의
   * `overflow-hidden`이 정확히 그 곡선만 잘라내게 한다.
   */
  isFirst: boolean;
  isLast: boolean;
}

/** 좌: 태그색 막대 / 제목·프로젝트 태그·팀명 라벨 + 세부 설명 한 줄 / 우: 마감일 + 상태 배지. */
export function MyActionListItemRow({
  action,
  showDivider,
  isFirst,
  isLast,
}: MyActionListItemRowProps) {
  const tagColor = pickPaletteColor(action.projectTag);
  const delayed = isDelayed(action);
  const tone = delayed ? "DELAYED" : action.status;
  const statusLabel = delayed ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status];
  const due = formatMonthDayWeekday(action.dueDate);

  return (
    <li className={cn(showDivider && "border-border border-t")}>
      <Link
        href={`/app/actions/${action.id}`}
        className="hover:bg-muted flex items-stretch transition-colors"
      >
        {/* 프로젝트 색 왼쪽 막대 — 카드 모서리와 만나는 첫·마지막 행만 그만큼 둥글린다 */}
        <span
          className={cn("w-1 shrink-0", isFirst && "rounded-tl-2xl", isLast && "rounded-bl-2xl")}
          style={{ backgroundColor: tagColor.solidColor }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4">
          {/* 좌: 제목 · 프로젝트 태그 · 팀명 라벨 + 세부 설명 한 줄 */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-[15px]">{action.title}</span>
              <span
                className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
                style={{ backgroundColor: tagColor.bgColor, color: tagColor.textColor }}
              >
                {action.projectTag}
              </span>
              <Badge variant="secondary" className="shrink-0">
                {action.team}
              </Badge>
            </div>
            <p className="text-muted-foreground line-clamp-1 text-xs">{action.description}</p>
          </div>

          {/* 우: 마감일 + 상태 배지(맨 오른쪽 끝) */}
          <div className="flex shrink-0 items-center gap-3">
            <span className="text-muted-foreground text-xs tabular-nums">
              {due ? `${due}까지` : "-"}
            </span>
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium",
                STATUS_TONE[tone],
              )}
            >
              {statusLabel}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
