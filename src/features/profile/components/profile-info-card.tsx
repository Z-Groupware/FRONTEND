import { PROFILE_INFO_CARD_TITLE, PROFILE_INFO_ROW_LABEL } from "@/constants/profile";

import type { MyProfile } from "../types";

interface InfoRow {
  label: string;
  value: string;
}

interface ProfileInfoCardProps {
  profile: MyProfile;
}

/** 기본 정보 표시용 필드 — 편집 기능은 명세가 없어 만들지 않는다(§명세에 없는 화면·기능은 안 만든다). */
function toRows(profile: MyProfile): InfoRow[] {
  return [
    { label: PROFILE_INFO_ROW_LABEL.NAME, value: profile.name },
    { label: PROFILE_INFO_ROW_LABEL.EMAIL, value: profile.email },
    { label: PROFILE_INFO_ROW_LABEL.TEAM, value: profile.teamName },
    { label: PROFILE_INFO_ROW_LABEL.POSITION, value: profile.position },
    { label: PROFILE_INFO_ROW_LABEL.JOINED_AT, value: profile.joinedAt },
  ];
}

/** 마이페이지 "기본 정보" 카드 — 읽기 전용. */
export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const rows = toRows(profile);

  return (
    <div className="border-border rounded-[10px] border">
      <div className="border-border border-b px-4 py-3">
        <p className="text-sm font-medium">{PROFILE_INFO_CARD_TITLE}</p>
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
