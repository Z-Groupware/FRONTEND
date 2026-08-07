import "server-only";

import { listManagedMembers } from "./manage-server";
import { buildOrgChart, searchOrgMembers, summarizeOrg } from "./org-chart";
import type { PeopleDirectory } from "./org-types";

/**
 * 구성원 화면 조회 — **격리막**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ **명부를 따로 두지 않는다.** 사원 관리와 같은 `listManagedMembers()`를 읽고 모양만
 *    바꾼다 — 두 벌로 들고 있으면 같은 회사가 화면마다 달라 보인다. 연동될 때도 고칠
 *    자리가 한 곳이다.
 * ⚠️ 조회 전용이다. 이 화면에는 바꾸는 일이 없어 `actions.ts`가 없다.
 * ⚠️ **검색을 서버가 한다.** 화면에서 거르면 나중에 명부를 잘라 보내기 시작했을 때
 *    받아 온 만큼에서만 찾게 되어 "없습니다"가 거짓말이 된다(CLAUDE.md §목록).
 * ⚠️ 요약은 **검색 전 명부**로 센다. 검색어를 넣었다고 회사 인원이 줄면 안 된다.
 * ⚠️ **퇴사자를 거르지 않는다.** 나간 사람은 목록에 남는다(CLAUDE.md §도메인 상수) — 그 사람이
 *    남긴 회의·액션·인수인계의 출처라 이름이 사라지면 추적이 끊긴다. 화면은 `퇴사` 뱃지로
 *    알린다. 소프트 딜리트(`DELETED`)만 그 앞의 매퍼가 거른다.
 * ⚠️ 지금은 명부를 통째로 받아 세운다. 조직도는 목록이 아니라 **구조**라 잘라 보내면
 *    팀이 반쯤 그려진다 — 사원이 수백 명이 되면 BE에 팀 단위 응답을 요청하고
 *    여기서 그 모양을 흡수한다(§연동 검증).
 */
export async function getPeopleDirectory(keyword: string): Promise<PeopleDirectory> {
  const roster = await listManagedMembers();

  return {
    summary: summarizeOrg(roster),
    chart: buildOrgChart(searchOrgMembers(roster, keyword)),
  };
}
