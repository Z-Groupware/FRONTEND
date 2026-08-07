import { AUTHORITY } from "@/constants/authority";

import type { ManagedMember } from "./manage-types";
import { NO_TEAM_LABEL, type OrgChart, type OrgMember, type OrgTeam } from "./org-types";

/**
 * 사원 명부를 **조직도로 세운다** — 순수 함수다.
 *
 * ⚠️ 서버 파일(`org-server.ts`)에 두지 않는 건 그쪽이 `server-only`라 테스트가 import를
 *    못 하기 때문이다. 묶는 규칙은 화면이 무엇을 보여줄지 정하는 곳이라 테스트가 붙어야 한다.
 */

/** 목록 한 줄에서 조직도가 쓰는 것만 꺼낸다 — 이메일·입사일은 안 싣는다(§org-types) */
function toOrgMember(member: ManagedMember): OrgMember {
  return {
    id: member.id,
    name: member.name,
    position: member.position,
    roleLabel: member.roleLabel,
    authority: member.authority,
    status: member.status,
  };
}

/**
 * 대표 → 팀 → 팀원 순으로 세운다.
 *
 * **정렬 규칙**
 * - 팀 차례는 **명부에 나온 순서 그대로**다. 가나다순으로 다시 세우지 않는다 —
 *   그 순서는 회사가 온보딩에서 정한 것이고, 프론트가 바꾸면 화면이 회사와 다른 말을 한다.
 * - 팀 안에서는 **리더가 맨 앞**, 나머지는 명부 순서다(WORKFLOW §9: 팀당 리더는 한 명).
 *
 * ⚠️ **퇴사자를 거르지 않는다.** 나간 사람을 조직도에서 뺄지는 팀이 정한 적이 없고, 지금
 *    규칙은 "나간 사람은 목록에 남는다"이다(CLAUDE.md §도메인 상수). 화면이 뱃지로 알리고,
 *    거르는 판단은 여기서 하지 않는다(§정직성: 정해지지 않은 정책을 단언하지 않는다).
 *    소프트 딜리트(`DELETED`)는 그 앞의 매퍼가 이미 걸러 온다.
 * ⚠️ **대표가 둘이면 첫 사람만 대표 자리에 세운다.** 회사에 대표는 하나라(CLAUDE.md §권한)
 *    둘째부터는 명부가 이상한 것인데, 조용히 버리면 전체 인원과 화면이 어긋난다 —
 *    팀이 없으니 `소속 없음`으로 내려가 눈에 띈다.
 */
export function buildOrgChart(members: ManagedMember[]): OrgChart {
  let owner: OrgMember | null = null;

  /*
    ⚠️ `Map`을 쓰는 건 **넣은 차례를 기억하기 때문**이다. 평범한 객체로 모으면 키 순서가
       엔진에 달려 있어 팀 차례가 조용히 바뀔 수 있다.
  */
  const byTeam = new Map<string, OrgMember[]>();

  for (const member of members) {
    if (member.authority === AUTHORITY.OWNER && owner === null) {
      owner = toOrgMember(member);
      continue;
    }

    const teamName = member.teamName ?? NO_TEAM_LABEL;
    const bucket = byTeam.get(teamName);
    if (bucket) bucket.push(toOrgMember(member));
    else byTeam.set(teamName, [toOrgMember(member)]);
  }

  const teams: OrgTeam[] = [...byTeam.entries()].map(([name, roster]) => ({
    name,
    // 리더를 앞으로 당긴다. 나머지 차례는 그대로 둔다(`filter` 둘이라 안정적이다)
    members: [
      ...roster.filter((member) => member.authority === AUTHORITY.LEADER),
      ...roster.filter((member) => member.authority !== AUTHORITY.LEADER),
    ],
  }));

  const totalCount = teams.reduce((sum, team) => sum + team.members.length, owner ? 1 : 0);

  return { owner, teams, totalCount };
}
