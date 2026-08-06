import type { MyProfile } from "../types";

interface InfoRow {
  label: string;
  value: string;
}

/** 기본 정보 표시용 필드 — 편집 기능은 명세가 없어 만들지 않는다(§명세에 없는 화면·기능은 안 만든다). */
function toRows(profile: MyProfile): InfoRow[] {
  return [
    { label: "이름", value: profile.name },
    { label: "이메일", value: profile.email },
    { label: "부서", value: profile.teamName },
    { label: "직급", value: profile.position },
    { label: "입사일", value: profile.joinedAt },
  ];
}

/** 마이페이지 "기본 정보" 카드 — 읽기 전용. */
export function ProfileInfoCard({ profile }: { profile: MyProfile }) {
  const rows = toRows(profile);

  return (
    <div className="border-border rounded-[10px] border">
      <div className="border-border border-b px-4 py-3">
        <p className="text-sm font-medium">기본 정보</p>
      </div>

      {rows.map((row, index) => (
        <div
          key={row.label}
          className={
            index === 0
              ? "flex items-center gap-3.5 px-4 py-3"
              : "border-border flex items-center gap-3.5 border-t px-4 py-3"
          }
        >
          <p className="text-muted-foreground w-16 shrink-0 text-xs">{row.label}</p>
          <p className="text-sm">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
