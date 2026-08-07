import { ProfileAvatar } from "@/components/common/profile-avatar";
import { AUTHORITY, AUTHORITY_LABEL } from "@/constants/authority";
import { MEMBER_STATUS, MEMBER_STATUS_BADGE_CLASS, MEMBER_STATUS_LABEL } from "@/constants/member";
import { cn } from "@/lib/utils";

import type { OrgMember } from "../org-types";

/**
 * 조직도에 서는 사람 한 명.
 *
 * ⚠️ 아바타는 **공용 컴포넌트**다. 시안은 이름 첫 글자를 원에 넣었지만, 색이 그 사람의
 *    `id`에서 나와야 어느 화면에서든 같은 사람이 같은 색으로 보인다(§DESIGN 5).
 *    여기서 첫 글자를 직접 그리면 사원 관리 목록과 다른 얼굴이 된다.
 * ⚠️ 서버 컴포넌트로 둔다 — 누를 것이 없다. 상세로 가는 링크도 걸지 않는다:
 *    사원 상세(`/manage/members/:id`)는 Owner·Admin 전용이라 전원이 보는 이 화면에서
 *    링크를 걸면 대부분에게 막힌 문이 된다(§정직성).
 */

/**
 * 구조상 자리를 알리는 표식 — **Owner·Leader에만** 단다.
 *
 * ⚠️ Member는 기본값이라 전원에게 달면 아무것도 안 알린다. Admin 겸직도 안 단다 —
 *    권한이 아니라 덧붙는 플래그이고(§권한: 축이 2개다) 조직 구조와 무관하다.
 * ⚠️ 라벨은 `AUTHORITY_LABEL`에서 꺼낸다(§라벨 하드코딩 금지). 역할 워딩은 영어다.
 */
function AuthorityMark({ authority }: { authority: OrgMember["authority"] }) {
  if (authority !== AUTHORITY.OWNER && authority !== AUTHORITY.LEADER) return null;

  return (
    <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-px text-[11px] leading-4">
      {AUTHORITY_LABEL[authority]}
    </span>
  );
}

/**
 * 상태 뱃지 — **재직이 아닌 사람에게만** 단다.
 *
 * ⚠️ 재직이 기본이라 전원에게 달면 조직도가 뱃지밭이 된다. 지금 자리에 없거나(휴직·퇴사)
 *    손이 필요한 사람(대기)만 눈에 걸리면 된다 — 생김새는 `MEMBER_STATUS_BADGE_CLASS`
 *    한 곳이 정하고, 색이 아니라 채움과 진하기로 층을 만든다(§디자인 토큰).
 */
function StatusMark({ status }: { status: OrgMember["status"] }) {
  if (status === MEMBER_STATUS.ACTIVE) return null;

  return (
    <span
      className={cn(
        "shrink-0 rounded border px-1.5 py-px text-[11px] leading-4",
        MEMBER_STATUS_BADGE_CLASS[status],
      )}
    >
      {MEMBER_STATUS_LABEL[status]}
    </span>
  );
}

export function OrgMemberNode({ member }: { member: OrgMember }) {
  const isLead = member.authority === AUTHORITY.OWNER || member.authority === AUTHORITY.LEADER;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border px-3.5 py-3",
        // 그 팀을 맡는 사람은 한 단 진한 선으로 — 색이 아니라 명도로 가른다(§디자인 토큰)
        isLead ? "border-foreground/25" : "border-border",
      )}
    >
      <ProfileAvatar userId={member.id} size={32} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[13px] leading-5 font-medium">{member.name}</span>
          <AuthorityMark authority={member.authority} />
          {/* 상태는 오른쪽 끝으로 민다 — 이름 옆에 붙이면 이름 길이마다 자리가 흔들린다 */}
          <span className="ml-auto flex items-center">
            <StatusMark status={member.status} />
          </span>
        </div>

        {/*
          ⚠️ **역할을 빠뜨리지 않는다.** 사원 관리 목록이 이미 컬럼으로 갖고 있는 값이라
             (WORKFLOW §9) 여기만 없으면 같은 사람이 화면마다 다르게 보인다.
          ⚠️ 안 붙인 사람은 **직급만 적는다.** 사원 관리 표는 칸이 비면 깨져 보여서 `없음`을
             적지만, 여기는 한 줄로 잇는 자리라 `대표 · 없음`·`팀장 · 없음`이 되어 없는 값이
             오히려 더 크게 읽힌다. 역할은 안 붙여도 되는 값이다(WORKFLOW §9).
        */}
        <p className="text-muted-foreground truncate text-[12px] leading-4">
          {member.roleLabel ? `${member.position} · ${member.roleLabel}` : member.position}
        </p>
      </div>
    </div>
  );
}
