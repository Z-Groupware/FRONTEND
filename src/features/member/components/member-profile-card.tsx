import { ProfileAvatar } from "@/components/common/profile-avatar";
import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";
import { MEMBER_STATUS_LABEL } from "@/constants/member";
import { cn } from "@/lib/utils";

import type { ManagedMember } from "../manage-types";

/**
 * 왼쪽 위 — 이 사람이 누구인가.
 *
 * ⚠️ **읽기 전용**이다. 이름·이메일·연락처는 본인이 마이페이지에서 관리할 값이고,
 *    여기서 고치는 건 직급·권한뿐이다(아래 카드) — 한 화면에 두 성격을 섞지 않는다.
 * ⚠️ 값 줄은 마이페이지 기본 정보 카드와 **같은 모양**이다(라벨 왼쪽 고정폭 · 값 오른쪽).
 *    같은 성격의 표를 화면마다 다르게 그리면 같은 서비스로 안 읽힌다.
 * ⚠️ 아바타는 **공용 훅**(`useProfileAvatar`)이 만든다 — 이름 첫 글자를 직접 그리면
 *    같은 사람이 화면마다 다른 색으로 보인다.
 * ⚠️ 팀이 없는 사람(Owner)은 `-`를 안 적는다. 이 줄은 표가 아니라 문장이라 빈칸 표시가
 *    오히려 어색하다 — 목록 표에서만 `-`로 채운다.
 */
export function MemberProfileCard({ member, phone }: { member: ManagedMember; phone: string }) {
  const rows = [
    { label: "이메일", value: member.email },
    { label: "연락처", value: phone },
    // ⚠️ 팀 안의 세부 라벨이다 — 권한(위 배지)과 다른 값이라 줄을 나눈다(WORKFLOW §9)
    { label: "역할", value: member.roleLabel ?? "없음" },
    { label: "입사일", value: member.joinedAt },
  ];

  return (
    <section className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-center gap-3.5 px-6 py-5">
        <ProfileAvatar userId={member.id} size={48} />

        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-[17px] leading-[26px] font-semibold">{member.name}</h1>
          <p className="text-muted-foreground truncate text-[12px] leading-4">
            {[member.teamName, member.position].filter(Boolean).join(" · ")}
          </p>

          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[11px] leading-none",
                AUTHORITY_BADGE_CLASS[member.authority],
              )}
            >
              {AUTHORITY_LABEL[member.authority]}
            </span>
            {member.isAdmin && (
              <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[11px] leading-none">
                Admin
              </span>
            )}
            <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-0.5 text-[11px] leading-none">
              {MEMBER_STATUS_LABEL[member.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="border-border border-t">
        {rows.map((row, index) => (
          <div
            key={row.label}
            className={cn(
              "flex items-center gap-3.5 px-6 py-3",
              index > 0 && "border-border border-t",
            )}
          >
            <p className="text-muted-foreground w-12 shrink-0 text-xs">{row.label}</p>
            <p className="min-w-0 flex-1 truncate text-[13px] leading-5">{row.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
