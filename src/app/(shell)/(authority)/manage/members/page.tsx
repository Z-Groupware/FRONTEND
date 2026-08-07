import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCompanySetting } from "@/features/company/server";
import { MemberListView } from "@/features/member/components/member-list-view";
import {
  getManagedMember,
  listManagedMembers,
  listTeamNames,
} from "@/features/member/manage-server";
import { buildTeamRoles } from "@/features/member/team-roles";
import { getViewer } from "@/features/shell/viewer";
import { canIssueAccount, canManageMembers } from "@/lib/permission";

/*
  ⚠️ **정적으로 굳히지 않는다.** 승인·직급 변경이 값을 바꾸는 화면이라 빌드 시각 값이
     박히면 방금 처리한 게 안 보인다. 세션이 붙으면 `getViewer()`가 쿠키를 읽어 저절로
     동적이 되지만, 목인 지금은 동적 신호가 없어 `○`(Static)으로 빌드된다.
*/
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "사원 관리",
};

/**
 * 사원 관리 목록 — 회사의 사람을 한 줄씩 본다.
 *
 * ⚠️ **화면은 Owner·Admin 둘 다** 들어온다(WORKFLOW §11). 승인·반려 버튼만 Owner 전용이고
 *    그건 상세에서 판정한다 — 화면 접근과 개별 액션의 권한이 갈리는 사례다.
 * ⚠️ 목록 행에는 신청 종류가 없다(컬럼이 아니다). 승인 대기 필터가 휴직과 오프보딩을
 *    구분하려면 종류가 필요해서, **여기서 상세를 훑어 id→종류 표를 만들어** 내려보낸다.
 *    연동되면 목록 API가 함께 주면 될 값이라 `TODO`로 남긴다.
 */
export default async function ManageMembersPage() {
  /*
    ⚠️ **판정이 먼저다.** 조회와 나란히 두면 권한 없는 사람의 요청도 BE까지 나간다 —
       연동되면 프론트가 권한 없는 조회를 대신 쏴 주는 경로가 된다(§권한).
       왕복 한 번을 잃지만 그게 맞다.
  */
  const viewer = await getViewer();
  if (!canManageMembers(viewer)) notFound();

  /*
    ⚠️ **직급 목록을 같이 받는다.** 발급 창에서 직급을 손으로 적게 두면 회사에 없는 직급이
       생긴다 — 직급은 온보딩 2단계·기업 설정이 만든 **회사 목록**이고, 거기에 권한이 매여 있다.
  */
  const [members, teamNames, company] = await Promise.all([
    listManagedMembers(),
    listTeamNames(),
    getCompanySetting(),
  ]);
  const positionNames = company.positions.map((position) => position.name);
  const teamRoles = buildTeamRoles(company.departments);

  // TODO(BE 협의): 목록 응답에 대기 신청 종류를 함께 실어 주면 이 왕복이 사라진다
  const details = await Promise.all(members.map((member) => getManagedMember(member.id)));
  const pendingTypeById = Object.fromEntries(
    details.map((detail) => [detail?.member.id, detail?.pendingHandover?.type]),
  );

  return (
    <MemberListView
      members={members}
      pendingTypeById={pendingTypeById}
      canIssueAccount={canIssueAccount(viewer)}
      teamNames={teamNames}
      positionNames={positionNames}
      teamRoles={teamRoles}
    />
  );
}
