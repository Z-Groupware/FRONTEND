"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { MEMBER_STATUS, MEMBER_STATUS_LABEL } from "@/constants/domain";
import type { TeamDashboardMember } from "@/features/team/types";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";

interface MemberStatusRowProps {
  member: TeamDashboardMember;
}

/**
 * "팀원 현황" 테이블의 한 행. `<TableBody>` 안에서만 쓴다(루트가 `<tr>`).
 * 아바타 색은 하드코딩하지 않고 팀 공용 `useProfileAvatar`로 만든다 — 키는 **id 하나**라
 * 이름이 바뀌어도, 다른 화면에서 봐도 같은 색이다.
 */
export function MemberStatusRow({ member }: MemberStatusRowProps) {
  const avatar = useProfileAvatar(member.id, 28);
  const isOnVacation = member.status === MEMBER_STATUS.VACATION;

  return (
    <TableRow className="h-14">
      <TableCell className="pl-4">
        <div className="flex items-center gap-2">
          {avatar}
          <span className="truncate">{member.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-center">{member.position}</TableCell>
      <TableCell className="text-muted-foreground text-center">{member.role}</TableCell>
      <TableCell className="text-muted-foreground text-center font-mono tabular-nums">
        {member.assignedActionCount}건
      </TableCell>
      <TableCell className="pr-4 text-center">
        <Badge
          variant={isOnVacation ? "outline" : "secondary"}
          className={isOnVacation ? "border-warning text-warning" : undefined}
        >
          {MEMBER_STATUS_LABEL[member.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
