import { ROLE_BADGE_CLASS, ROLE_LABEL } from "@/constants/role";
import { cn } from "@/lib/utils";

import type { MyProfile } from "../types";

interface ProfileHeaderProps {
  profile: MyProfile;
}

/** 마이페이지 맨 위 — 아바타·이름·이메일·역할 배지·소속. 편집 불가(읽기 전용, §명세 없음). */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="border-border flex items-center gap-3.5 border-b pb-5">
      <div className="bg-foreground text-background flex size-14 shrink-0 items-center justify-center rounded-full text-[22px] font-medium">
        {profile.name.charAt(0)}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-[17px] leading-[26px] font-semibold">{profile.name}</p>
        <p className="text-muted-foreground text-xs">{profile.email}</p>

        <div className="flex items-center gap-1.5 pt-0.5">
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] leading-none",
              ROLE_BADGE_CLASS[profile.role],
            )}
          >
            {ROLE_LABEL[profile.role]}
          </span>
          <span className="text-muted-foreground/70 text-[11px]">
            {profile.companyName} · {profile.teamName} · {profile.position}
          </span>
        </div>
      </div>
    </div>
  );
}
