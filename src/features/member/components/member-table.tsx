import Link from "next/link";

import { ProfileAvatar } from "@/components/common/profile-avatar";
import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";
import { MEMBER_STATUS, MEMBER_STATUS_LABEL } from "@/constants/member";
import { cn } from "@/lib/utils";

import type { ManagedMember } from "../manage-types";

/**
 * 사원 목록 표.
 *
 * ⚠️ 컬럼은 **이름 · 팀 · 직급 · 권한 · 역할 · 상태 · 입사일**이다(WORKFLOW §9).
 *    "미완료 액션"은 없다 — 목록에서 셀 일이 아니다.
 * ⚠️ **이름만 왼쪽, 나머지는 가운데**다(저장소 표와 같은 규칙). 열 폭이 고정이라
 *    머리와 칸에 같은 정렬을 줘야 눈이 세로로 따라간다.
 * ⚠️ 아바타는 **공용 훅**(`useProfileAvatar`)이 만든다. 이름 첫 글자를 직접 그리면 같은 사람이
 *    화면마다 다르게 보여, 목록에서 색으로 사람을 알아보는 일이 안 된다.
 * ⚠️ 줄 전체가 링크다 — 클릭 대상이 이름 글자뿐이면 표에서 누를 곳을 찾아야 한다.
 *    `<a>`로 감싸 키보드 Tab으로도 한 줄에 한 번만 걸리게 한다(§a11y).
 */

/** 권한 칸 — Admin 겸직이면 배지를 하나 더 붙인다(권한을 대체하지 않는다) */
function AuthorityCell({ member }: { member: ManagedMember }) {
  return (
    <span className="inline-flex items-center justify-center gap-1">
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
    </span>
  );
}

/** 상태 칸 — 퇴사만 흐리게. 색으로 알리는 건 에러뿐이다(§디자인 토큰) */
function StatusCell({ status }: { status: ManagedMember["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-2 py-0.5 text-[11px] leading-4",
        status === MEMBER_STATUS.RESIGNED
          ? "border-border text-muted-foreground/70"
          : "border-border text-muted-foreground",
      )}
    >
      {MEMBER_STATUS_LABEL[status]}
    </span>
  );
}

export function MemberTable({ members }: { members: ManagedMember[] }) {
  if (members.length === 0) {
    return (
      <p className="text-muted-foreground border-border border-t px-6 py-12 text-center text-[13px] leading-5 break-keep">
        찾는 사원이 없습니다
      </p>
    );
  }

  return (
    <div className="border-border overflow-x-auto border-t">
      <table className="w-full min-w-[880px] border-collapse">
        <thead>
          <tr className="text-muted-foreground bg-secondary/50 border-border border-b text-[12px] leading-4">
            <th className="px-6 py-3 text-left font-normal">이름</th>
            <th className="px-4 py-3 text-center font-normal">팀</th>
            <th className="px-4 py-3 text-center font-normal">직급</th>
            <th className="px-4 py-3 text-center font-normal">권한</th>
            {/* ⚠️ 팀 안의 세부 라벨이다 — 권한(Leader/Member)과 다른 열이다(WORKFLOW §9) */}
            <th className="px-4 py-3 text-center font-normal">역할</th>
            <th className="px-4 py-3 text-center font-normal">상태</th>
            <th className="px-6 py-3 text-center font-normal">입사일</th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-border hover:bg-secondary/40 border-b transition-colors last:border-b-0"
            >
              <th scope="row" className="px-6 py-3.5 text-left font-normal">
                <Link
                  href={`/manage/members/${member.id}`}
                  className="focus-visible:ring-ring flex items-center gap-2.5 rounded focus-visible:ring-2 focus-visible:outline-hidden"
                >
                  <ProfileAvatar userId={member.id} size={28} />
                  <span className="text-[13px] leading-5 font-medium">{member.name}</span>
                </Link>
              </th>
              {/* ⚠️ Owner는 팀이 없다 — 빈칸이 아니라 `-`로 적는다(WORKFLOW §9) */}
              <td className="text-muted-foreground px-4 py-3.5 text-center text-[13px] leading-5">
                {member.teamName ?? "-"}
              </td>
              <td className="px-4 py-3.5 text-center text-[13px] leading-5">{member.position}</td>
              <td className="px-4 py-3.5 text-center">
                <AuthorityCell member={member} />
              </td>
              <td className="text-muted-foreground px-4 py-3.5 text-center text-[13px] leading-5">
                {member.roleLabel ?? "없음"}
              </td>
              <td className="px-4 py-3.5 text-center">
                <StatusCell status={member.status} />
              </td>
              <td className="text-muted-foreground px-6 py-3.5 text-center text-[13px] leading-5 tabular-nums">
                <time dateTime={member.joinedAt}>{member.joinedAt}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
