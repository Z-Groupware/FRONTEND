import { PROFILE_INFO_CARD_TITLE, PROFILE_INFO_ROW_LABEL } from "@/constants/profile";
import { formatYearMonthDay } from "@/lib/date";

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
    /*
      ⚠️ **날짜는 우리 표기로 그린다**(§카피). 서버가 준 `2021-03-02`를 그대로 뿌리고 있어
         사원 관리(`2021년 3월 2일`)와 같은 값이 화면마다 다르게 보였다.
      ⚠️ 요일은 안 붙인다 — 지나간 입사일이 무슨 요일이었는지는 쓸 데가 없다
         (`member-profile-card`와 같은 판단).
    */
    { label: PROFILE_INFO_ROW_LABEL.JOINED_AT, value: formatYearMonthDay(profile.joinedAt) },
  ];
}

/** 마이페이지 "기본 정보" 카드 — 읽기 전용. */
export function ProfileInfoCard({ profile }: ProfileInfoCardProps) {
  const rows = toRows(profile);

  return (
    <div className="border-border bg-card rounded-2xl border">
      <div className="border-border border-b px-4 py-3">
        <p className="text-[13px] leading-5 font-medium">{PROFILE_INFO_CARD_TITLE}</p>
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
          <p className="text-muted-foreground w-16 shrink-0 text-[12px] leading-4">{row.label}</p>
          <p className="text-[13px] leading-5">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
