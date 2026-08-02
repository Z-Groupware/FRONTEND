"use client";

import { cn } from "@/lib/utils";

import type { Invite } from "../types";
import { useScrollToLatest } from "../use-scroll-to-latest";
import type { SelectOption } from "./option-select";

interface InvitePreviewProps {
  /** 보낸 줄 + 이번에 보낼 줄 */
  invites: Invite[];
  departments: SelectOption[];
  /** 그 부서의 역할 목록 — 이름을 찾으려면 부서를 알아야 한다 */
  rolesOf: (departmentId: string) => SelectOption[];
  positions: SelectOption[];
}

/**
 * 좌측 축약 미리보기 — 오른쪽 목록과 같은 상태를 보고 그린다(1·2단계와 같은 방식).
 * 주소가 유효한 줄만 올라오므로, 여기 뜬 것이 곧 나갈(또는 이미 나간) 초대장이다.
 */
export function InvitePreview({ invites, departments, rolesOf, positions }: InvitePreviewProps) {
  const nameOf = (options: SelectOption[], id: string) =>
    options.find((option) => option.id === id)?.name;

  // 초대가 늘면 새로 생긴 쪽으로 따라 내려간다
  const listRef = useScrollToLatest<HTMLUListElement>(invites.length);

  if (invites.length === 0) {
    return (
      <div className="border-border bg-background/50 flex min-h-20 flex-1 items-center justify-center rounded-lg border p-3">
        <p className="text-muted-foreground/70 text-[11px]">아직 보낼 주소가 없어요</p>
      </div>
    );
  }

  return (
    // 남는 세로 공간을 채운다. 초대가 많아지면 안에서만 스크롤한다(스크롤바 숨김)
    // 스크롤바를 숨겼으므로 키보드로도 훑을 수 있어야 한다 — 포커스를 받고 방향키로 움직인다
    <ul
      ref={listRef}
      tabIndex={0}
      aria-label="초대 목록 미리보기"
      className="focus-visible:ring-ring border-border bg-background/50 flex min-h-20 flex-1 [scrollbar-width:none] flex-col gap-2 overflow-auto overscroll-contain rounded-lg border p-3 [-ms-overflow-style:none] focus-visible:ring-2 focus-visible:outline-hidden [&::-webkit-scrollbar]:hidden"
    >
      {invites.map((invite) => {
        const department = nameOf(departments, invite.departmentId);
        // 역할이 "없음"이면 부서만 보여준다
        const role = nameOf(rolesOf(invite.departmentId), invite.roleId);
        const position = nameOf(positions, invite.positionId);

        return (
          <li
            key={invite.id}
            className="animate-in fade-in slide-in-from-bottom-1 flex h-[18px] items-center gap-1.5 duration-200"
          >
            {/* 진한 점 = 이미 나감 · 옅은 점 = 아직 안 나감 */}
            <span
              className={cn(
                "size-[5px] shrink-0 rounded-full",
                invite.isSent ? "bg-foreground" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            <span
              className={cn(
                "truncate font-mono text-[10px]",
                invite.isSent ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {invite.email.trim()}
            </span>
            {(department || role || position) && (
              <span className="text-muted-foreground/60 ml-auto shrink-0 text-[9px]">
                {[department, role, position].filter(Boolean).join(" · ")}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
