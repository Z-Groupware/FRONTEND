import { ACTION_DELAYED_LABEL, ACTION_STATUS_LABEL, isDelayed } from "@/constants/domain";
import { formatMonthDayWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { ManagedMemberAction } from "../manage-types";

/**
 * 담당 액션 — **읽기만 한다.**
 *
 * ⚠️ 여기서 상태를 바꾸지 않는다. 상태 변경은 보드의 일이고(§보드: 상태 변경 전용 화면),
 *    이 화면은 "이 사람이 뭘 들고 있나"를 보는 자리다.
 * ⚠️ 상태 배지에 **배경을 칠하지 않는다** — 색으로 알리는 건 지연(빨강)뿐이다(§디자인 토큰).
 *    상태마다 배경을 칠하면 화면이 신호등이 된다.
 */
export function MemberActionList({ actions }: { actions: ManagedMemberAction[] }) {
  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">담당 액션</h2>
        <p className="text-foreground/75 shrink-0 text-[12px] leading-4 tabular-nums">
          {actions.length}건
        </p>
      </div>

      {actions.length === 0 ? (
        <p className="text-muted-foreground border-border border-t px-6 py-8 text-center text-[13px] leading-5">
          맡고 있는 액션이 없습니다
        </p>
      ) : (
        <ul className="border-border border-t">
          {actions.map((action) => (
            <li
              key={action.id}
              className="border-border flex items-center gap-3 border-b px-7 py-3 last:border-b-0"
            >
              {/*
                ⚠️ **지연은 계산해서 붙인다.** 저장 상태는 셋뿐이고(할 일·진행중·완료) 지연은
                   마감일에서 나오는 파생값이다(§도메인 상수). 승인 직전에 "이 사람이 뭘
                   들고 있나"를 보는 자리라, 마감이 지난 걸 진행 중처럼 보이면 안 된다.
                ⚠️ 색으로 알리는 건 **지연(빨강)뿐**이다 — 나머지 상태는 테두리만 쓴다.
              */}
              <span
                className={cn(
                  "w-[52px] shrink-0 rounded border px-1.5 py-0.5 text-center text-[11px] leading-4",
                  isDelayed(action)
                    ? "border-destructive/40 text-destructive"
                    : "border-border text-muted-foreground",
                )}
              >
                {isDelayed(action) ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status]}
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] leading-5">{action.title}</span>
              <time
                dateTime={action.dueDate}
                className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums"
              >
                {formatMonthDayWeekday(action.dueDate)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
