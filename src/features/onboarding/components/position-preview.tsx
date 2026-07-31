import type { AssignableRole, Position } from "../types";
import { SYSTEM_ISSUED_POSITIONS } from "../types";
import { RoleBadge } from "./role-badge";

/**
 * 좌측 축약 미리보기.
 * 위 두 줄(대표·관리자)은 **기업 승인 때 발급되는 계정**이고,
 * 아래는 이 화면에서 매핑한 직급이 그대로 따라온다.
 */
export function PositionPreview({ positions }: { positions: Position[] }) {
  return (
    // 남는 세로 공간을 채운다. 직급이 많아지면 안에서만 스크롤한다(스크롤바 숨김)
    <ul className="border-border bg-background/50 flex min-h-20 flex-1 [scrollbar-width:none] flex-col gap-2 overflow-auto rounded-lg border p-3 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {SYSTEM_ISSUED_POSITIONS.map((issued) => (
        <PreviewRow key={issued.name} name={issued.name} role={issued.role} />
      ))}
      {positions.map((position) => (
        <PreviewRow key={position.id} name={position.name} role={position.role} />
      ))}
      {positions.length === 0 && (
        <li className="text-muted-foreground/70 py-1 text-center text-[10px]">
          아직 직급이 없어요
        </li>
      )}
    </ul>
  );
}

function PreviewRow({ name, role }: { name: string; role: AssignableRole }) {
  return (
    <li className="flex h-[18px] items-center justify-between gap-2">
      <span className="text-muted-foreground truncate text-[10px]">{name}</span>
      <RoleBadge role={role} className="text-[9px]" />
    </li>
  );
}
