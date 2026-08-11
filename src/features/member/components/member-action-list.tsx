import { ListChecks } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
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
        <p className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums">
          전체 {actions.length}건
        </p>
      </div>

      {actions.length === 0 ? (
        <EmptyState bordered icon={ListChecks} title="맡고 있는 액션이 없습니다." />
      ) : (
        <>
          {/*
            표 머리 — 다른 목록과 같은 띠다(§DESIGN 2: 카드 안의 선은 표가 시작하는 자리 하나뿐).
            ⚠️ 머리와 값이 열마다 같은 축을 쓴다 — 이름은 왼쪽, 상태·마감은 가운데.
          */}
          <div className="border-border text-muted-foreground bg-secondary/50 flex items-center gap-4 border-y px-7 py-3 text-[12px] leading-4">
            <span className="min-w-0 flex-1">액션</span>
            <span className="w-[72px] shrink-0 text-center">상태</span>
            <span className="w-24 shrink-0 text-center">마감</span>
          </div>

          <ul>
            {actions.map((action) => (
              <li
                key={action.id}
                className="border-border flex items-center gap-4 px-7 py-3.5 not-first:border-t"
              >
                {/*
                ⚠️ **이름이 먼저다.** 상태를 맨 왼쪽에 두니 훑을 때 `진행중·할 일`이 먼저 읽히고
                   정작 무슨 액션인지가 뒤로 밀렸다 — 왼쪽은 무엇인지, 오른쪽은 어떤 상태인지로
                   축을 가른다(§DESIGN 3, 회의 상세 산출물 표와 같은 해부).
              */}
                <span className="min-w-0 flex-1 truncate text-[13px] leading-5">
                  {action.title}
                </span>
                {/*
                ⚠️ **지연은 계산해서 붙인다.** 저장 상태는 셋뿐이고(할 일·진행중·완료) 지연은
                   마감일에서 나오는 파생값이다(§도메인 상수). 승인 직전에 "이 사람이 뭘
                   들고 있나"를 보는 자리라, 마감이 지난 걸 진행 중처럼 보이면 안 된다.
                ⚠️ 색으로 알리는 건 **지연(빨강)뿐**이다 — 나머지 상태는 테두리만 쓴다.
              */}
                <span className="w-[72px] shrink-0">
                  <span
                    className={cn(
                      "mx-auto flex h-6 w-[52px] items-center justify-center rounded-md border text-[11px] leading-4",
                      isDelayed(action)
                        ? "border-destructive/40 text-destructive font-medium"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {isDelayed(action) ? ACTION_DELAYED_LABEL : ACTION_STATUS_LABEL[action.status]}
                  </span>
                </span>
                <time
                  dateTime={action.dueDate}
                  className="text-muted-foreground w-24 shrink-0 text-center text-[12px] leading-4 whitespace-nowrap tabular-nums"
                >
                  {formatMonthDayWeekday(action.dueDate)}
                </time>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
