import { ProjectTag } from "@/components/common/project-tag";
import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { LeaderHandoverAction } from "../types";

/**
 * 담긴 액션 전체 — 읽기만 한다(WORKFLOW.md §7). 담당자 변경은 [귀속]이 한 번에 한다.
 *
 * ⚠️ **표 머리를 둔다**(2026-08-11). 머리 없이 값만 늘어놓으니 `앱 개발 착수`가 상위 팀 액션인지
 *    액션 이름인지 알 수 없었다 — 열이 다섯인데 이름표가 하나도 없었다.
 * ⚠️ 머리와 값은 **열마다 같은 축**을 쓴다. 폭만 맞추고 정렬을 안 정하면 글자 길이에 따라
 *    축이 흔들려 오와 열이 어긋난다(§DESIGN 3).
 */
export function LeaderHandoverActionList({ actions }: { actions: LeaderHandoverAction[] }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-center justify-between gap-3 px-7 pt-6 pb-5">
        <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">담긴 액션</h2>
        <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
          전체 {actions.length}건
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-7 py-14 text-center text-[13px] leading-5">
          담긴 액션이 없습니다.
        </p>
      ) : (
        <>
          {/* 표 머리 — 띠 하나로 값이 시작하는 자리를 알린다(§DESIGN 2: 카드 안의 선은 여기뿐) */}
          <div className="border-border text-muted-foreground bg-secondary/50 flex items-center gap-3 border-y px-7 py-3 text-[12px] leading-4">
            <span className="w-[76px] shrink-0">프로젝트</span>
            <span className="hidden w-[140px] shrink-0 sm:inline">상위 팀 액션</span>
            <span className="min-w-0 flex-1">액션</span>
            <span className="w-[52px] shrink-0 text-center">상태</span>
            <span className="w-20 shrink-0 text-right">마감</span>
          </div>

          <ul>
            {actions.map((action) => {
              const delayed = isDelayed(action);
              return (
                <li
                  key={action.id}
                  className="border-border flex items-center gap-3 px-7 py-3.5 not-first:border-t"
                >
                  {/*
                    ⚠️ **공용 칩을 쓴다**(`components/common/project-tag`). 여기만 손으로 그린
                       `font-mono` 칩이라 같은 프로젝트가 화면마다 다른 모양으로 떴다.
                    ⚠️ 칩 자리를 고정한다 — 태그 길이가 달라도 옆 열이 밀리지 않는다.
                  */}
                  <span className="flex w-[76px] shrink-0 items-center">
                    <ProjectTag tag={action.projectTag} />
                  </span>
                  <span className="text-muted-foreground hidden w-[140px] shrink-0 truncate text-[12px] leading-4 sm:inline">
                    {action.parentTeamActionName}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                    {action.title}
                  </span>
                  {/* ⚠️ 지연만 빨강이다 — 색으로 알리는 건 문제뿐(§DESIGN 5) */}
                  <span
                    className={cn(
                      "inline-flex h-6 w-[52px] shrink-0 items-center justify-center rounded-md border text-[11px] leading-4",
                      delayed
                        ? "border-destructive/40 text-destructive font-medium"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {delayed ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status]}
                  </span>
                  <time
                    dateTime={action.dueDate}
                    className="text-muted-foreground w-20 shrink-0 text-right text-[12px] leading-4 whitespace-nowrap tabular-nums"
                  >
                    {formatMonthDayWeekday(action.dueDate)}
                  </time>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
