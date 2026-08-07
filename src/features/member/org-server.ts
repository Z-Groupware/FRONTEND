import "server-only";

import { listManagedMembers } from "./manage-server";
import { buildOrgChart } from "./org-chart";
import type { OrgChart } from "./org-types";

/**
 * 조직도 조회 — **격리막**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ **명부를 따로 두지 않는다.** 사원 관리와 같은 `listManagedMembers()`를 읽고 모양만
 *    바꾼다 — 두 벌로 들고 있으면 같은 회사가 화면마다 달라 보인다. 연동될 때도 고칠
 *    자리가 한 곳이다.
 * ⚠️ 조회 전용이다. 이 화면에는 바꾸는 일이 없어 `actions.ts`가 없다.
 * ⚠️ 지금은 명부를 통째로 받아 세운다. 조직도는 목록이 아니라 **구조**라 잘라 보내면
 *    팀이 반쯤 그려진다 — 사원이 수백 명이 되면 BE에 팀 단위 응답을 요청하고
 *    여기서 그 모양을 흡수한다(§연동 검증).
 */
export async function getOrgChart(): Promise<OrgChart> {
  return buildOrgChart(await listManagedMembers());
}
