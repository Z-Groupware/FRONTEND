"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/lib/utils";

import type { TeamHandoverAction, TeamMemberOption } from "../types";

interface TeamMemberColumnProps {
  teammate: TeamMemberOption;
  assignedActions: TeamHandoverAction[];
}

/** 팀원 한 명의 드롭 칼럼 — 이 사람에게 배정된 액션을 카드로 보여준다. */
export function TeamMemberColumn({ teammate, assignedActions }: TeamMemberColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: teammate.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-border bg-secondary/30 flex h-full min-h-[220px] flex-col gap-3 rounded-2xl border p-4 transition-colors",
        isOver && "bg-secondary/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-foreground truncate text-sm font-semibold">{teammate.name}</span>
          {teammate.roleLabel && (
            <span className="text-muted-foreground shrink-0 text-xs">{teammate.roleLabel}</span>
          )}
        </div>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
          {assignedActions.length}
        </span>
      </div>

      <div className="scrollbar-hidden flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {assignedActions.length === 0 ? (
          <p className="text-muted-foreground flex h-20 items-center justify-center text-xs">
            여기에 드롭
          </p>
        ) : (
          assignedActions.map((action) => (
            <div
              key={action.id}
              className="border-border bg-card flex flex-col gap-1 rounded-xl border p-3"
            >
              <span className="w-fit rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--muted-foreground)]">
                {action.projectTag}
              </span>
              <p className="text-foreground truncate text-sm">{action.title}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
