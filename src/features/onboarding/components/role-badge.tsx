import { ROLE_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import type { AssignableRole } from "../types";

/**
 * 권한별 배지 색 — 값은 `globals.css`의 토큰이라 다크모드가 따라온다.
 * 배지와 권한 선택(`RoleSelect`)이 같은 색을 써야 표에서 눈이 이어진다.
 */
export const ROLE_TONE: Record<AssignableRole, string> = {
  OWNER: "bg-role-owner-surface text-role-owner",
  LEADER: "bg-role-leader-surface text-role-leader",
  MEMBER: "bg-role-member-surface text-role-member",
};

/** 겸직 배지 — 역할 배지 **옆에** 하나 더 붙는다. 역할을 대체하지 않는다. */
export const ADMIN_TONE = "bg-role-admin-surface text-role-admin";

interface RoleBadgeProps {
  role: AssignableRole;
  className?: string;
}

/** 권한 배지. 역할 워딩은 한글로 번역하지 않는다(CLAUDE.md 카피 규칙). */
export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] leading-none",
        ROLE_TONE[role],
        className,
      )}
    >
      {ROLE_LABEL[role]}
    </span>
  );
}
