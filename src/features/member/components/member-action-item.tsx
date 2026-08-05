import Link from "next/link";

import {
  ACTION_STATUS,
  ACTION_STATUS_LABEL,
  type ActionStatus,
  isDelayed,
} from "@/constants/domain";
import { formatDday } from "@/features/member/lib";
import type { MemberAction } from "@/features/member/types";
import { cn } from "@/lib/utils";

/**
 * 상태 색 — 지연=빨강(마감 경과)·진행중=초록·할일=회색(CLAUDE.md §디자인 토큰).
 * 완료는 D-7 박스에 안 오므로 다루지 않는다.
 */
const STATUS_TONE: Record<ActionStatus, string> = {
  [ACTION_STATUS.TODO]: "bg-muted text-muted-foreground",
  [ACTION_STATUS.IN_PROGRESS]: "bg-success/12 text-success",
  [ACTION_STATUS.DONE]: "bg-muted text-muted-foreground",
};

interface MemberActionItemProps {
  action: MemberAction;
  /** 목록의 첫 항목이 아니면 위쪽 구분선을 그린다 */
  showDivider: boolean;
}

/**
 * 내 액션 한 줄 — 회의 아이템과 같은 결.
 * 좌: 프로젝트 색 막대 · 액션명 · 프로젝트 태그 / 우: 마감일(D-day) · 상태 라벨.
 * ⚠️ 팀명·담당자는 두지 않는다(내 대시보드에선 항상 나·내 팀이라 중복).
 */
export function MemberActionItem({ action, showDivider }: MemberActionItemProps) {
  const delayed = isDelayed(action);
  const statusLabel = delayed ? "지연" : ACTION_STATUS_LABEL[action.status];
  const statusTone = delayed ? "bg-destructive/10 text-destructive" : STATUS_TONE[action.status];

  return (
    <li className={cn("h-14", showDivider && "border-border border-t")}>
      <Link
        href={`/app/actions/${action.id}`}
        className="hover:bg-muted flex h-full items-center transition-colors"
      >
        {/* 프로젝트 색 왼쪽 막대 — 행 위아래 끝에 딱 붙는 얇은 세로선 */}
        <span
          className="h-full w-1 shrink-0"
          style={{ backgroundColor: action.color }}
          aria-hidden
        />

        <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
          {/* 좌: 액션명 + 프로젝트 태그 */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="truncate text-sm">{action.title}</span>
            <span
              className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold"
              style={{ backgroundColor: `${action.color}1a`, color: action.color }}
            >
              {action.projectTag}
            </span>
          </div>

          {/* 우: 마감일(D-day) + 상태 라벨 */}
          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cn(
                "font-mono text-xs tabular-nums",
                delayed ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {formatDday(action.dueDate)}
            </span>
            <span
              className={cn(
                "inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-medium",
                statusTone,
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
