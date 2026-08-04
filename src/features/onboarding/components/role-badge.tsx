import { ROLE_LABEL } from "@/constants/domain";
import { cn } from "@/lib/utils";

import type { AssignableRole } from "../types";

/**
 * 권한별 배지 색 — 값은 `globals.css`의 토큰이라 다크모드가 따라온다.
 * 배지와 권한 선택(`RoleSelect`)이 같은 색을 써야 표에서 눈이 이어진다.
 */
const ROLE_TONE: Record<AssignableRole, string> = {
  OWNER: "bg-role-owner-surface text-role-owner",
  LEADER: "bg-role-leader-surface text-role-leader",
  MEMBER: "bg-role-member-surface text-role-member",
};

/*
  ⚠️ Admin 겸직 배지는 여기 없다. 온보딩에서는 방패 아이콘(`InviteAdminToggle`)으로만 알린다 —
     쓰지 않는 색 상수를 남겨 두면 "배지도 있나" 싶어 찾게 된다.
     색 토큰(`--role-admin`)은 `globals.css`에 그대로 있으니 필요해지면 그때 만든다.
*/

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
