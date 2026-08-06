import Link from "next/link";

import { ProfileAvatar } from "@/components/common/profile-avatar";
import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";
import { MEMBER_STATUS, MEMBER_STATUS_LABEL } from "@/constants/member";
import { formatYearMonthDay } from "@/lib/date";
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
 * ⚠️ **링크는 이름 칸에만** 둔다. 줄 전체를 `<a>`로 감쌀 수 없고(표 구조가 깨진다), 줄마다
 *    투명 오버레이를 얹으면 다른 칸의 글자를 드래그해 복사할 수 없다 — 대신 줄에 hover를
 *    줘서 어디를 눌러야 하는지 보이게 한다. 키보드는 한 줄에 한 번만 걸린다(§a11y).
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
          ? "border-border/60 text-muted-foreground"
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
      {/*
        ⚠️ `table-fixed` — 이름 길이에 따라 열이 흔들리면 목록을 위아래로 훑을 때 눈이
           세로줄을 못 따라간다. 폭은 `colgroup`이 한 곳에서 정한다.
      */}
      <table className="w-full min-w-[880px] table-fixed border-collapse">
        {/*
          ⚠️ 폭을 **비율(%)로** 준다(저장소 표와 같은 규칙). px로 고정하면 남는 폭을 어느 한
             열이 통째로 먹는다 — 폭 없이 뒀던 `역할`이 화면에서 제일 넓었고(대부분 `없음`이다),
             그걸 이름으로 옮기자 이번엔 이름 칸만 600px가 되고 나머지가 오른쪽에 뭉쳤다.
             비율이면 화면이 넓어질 때 일곱 열이 **같이** 늘어난다.
          ⚠️ `입사일`은 `2020년 1월 2일`이 한 줄에 들어가는 몫을 준다. 좁게 뒀더니
             `2020년 1월 2` / `일`로 잘려 줄마다 높이가 달라졌다.
        */}
        <colgroup>
          <col className="w-[22%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
          <col className="w-[16%]" />
          <col className="w-[16%]" />
          <col className="w-[10%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead>
          <tr className="text-muted-foreground bg-secondary/50 border-border border-b text-[12px] leading-4">
            <th className="px-6 py-3 text-left font-normal">이름</th>
            <th className="px-4 py-3 text-center font-normal">팀</th>
            <th className="px-4 py-3 text-center font-normal">직급</th>
            <th className="px-4 py-3 text-center font-normal">권한</th>
            {/* ⚠️ 팀 안의 세부 라벨이다 — 권한(Leader/Member)과 다른 열이다(WORKFLOW §9) */}
            <th className="px-4 py-3 text-center font-normal">역할</th>
            <th className="px-4 py-3 text-center font-normal">상태</th>
            <th className="px-4 py-3 text-center font-normal">입사일</th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => (
            <tr
              key={member.id}
              className="border-border hover:bg-secondary/50 border-b transition-colors last:border-b-0"
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
              {/*
                ⚠️ **요일을 빼고 적는다.** 입사일이 무슨 요일이었는지는 쓸 데가 없는데,
                   그 세 글자 때문에 칸이 모자라 줄이 깨졌다(`formatYearMonthDay`).
                ⚠️ `whitespace-nowrap` — 폭을 넉넉히 줬어도 좁은 화면에서 다시 접히면
                   그 줄만 키가 커져 표가 들쭉날쭉해진다. 좁아지면 가로로 스크롤한다.
              */}
              <td className="text-muted-foreground px-4 py-3.5 text-center text-[13px] leading-5 whitespace-nowrap tabular-nums">
                <time dateTime={member.joinedAt}>{formatYearMonthDay(member.joinedAt)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
