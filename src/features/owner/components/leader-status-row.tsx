"use client";

import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { MEMBER_STATUS, MEMBER_STATUS_LABEL } from "@/constants/domain";
import type { OwnerDashboardLeaderRow } from "@/features/owner/types";
import { useProfileAvatar } from "@/hooks/use-profile-avatar";

interface LeaderStatusRowProps {
  leader: OwnerDashboardLeaderRow;
}

/**
 * "팀장 현황" 테이블의 한 행. `<TableBody>` 안에서만 쓴다(루트가 `<tr>`).
 * ⚠️ 아바타 색은 하드코딩하지 않고 팀 공용 `useProfileAvatar`로 만든다 — 키는 **id 하나**다 —
 *    BE에 프로필 이미지 필드가 없어 FE가 일관 색을 생성한다(같은 사람은 늘 같은 색).
 */
export function LeaderStatusRow({ leader }: LeaderStatusRowProps) {
  const avatar = useProfileAvatar(leader.id, 28);
  const isOnVacation = leader.status === MEMBER_STATUS.VACATION;

  return (
    <TableRow className="h-14">
      <TableCell className="pl-4">
        <div className="flex items-center gap-2">
          {avatar}
          <span className="truncate">{leader.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground truncate text-center" title={leader.email}>
        {leader.email}
      </TableCell>
      <TableCell className="text-muted-foreground text-center">{leader.department}</TableCell>
      <TableCell className="text-center">
        <Badge
          variant={isOnVacation ? "outline" : "secondary"}
          className={isOnVacation ? "border-warning text-warning" : undefined}
        >
          {MEMBER_STATUS_LABEL[leader.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground pr-4 text-center font-mono">
        {leader.leavePeriod ?? "-"}
      </TableCell>
    </TableRow>
  );
}
