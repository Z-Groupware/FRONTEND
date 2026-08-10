import "server-only";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import {
  type BeCompanyProfile,
  type BePosition,
  type BeTeam,
  toCompanyProfile,
  toDepartmentNode,
  toPosition,
  toTeamMemberCounts,
} from "./mapper";
import { getMockCompanySetting } from "./mock/company";
import type { CompanySetting } from "./types";

/**
 * 기업 설정 조회 — **격리막**(CLAUDE.md §Mock 격리막).
 *
 * ⚠️ 컴포넌트는 반환 타입(`CompanySetting`)만 본다. 연동되면 여기 `isMock` 분기만
 *    실서버 호출로 바꾸고 매퍼가 shape을 흡수한다 — 화면은 안 바뀐다.
 * ⚠️ 회사는 세션(`companyId`)으로 정해진다 — 인자로 받지 않는다(§라우트 그룹).
 */
export async function getCompanySetting(): Promise<CompanySetting> {
  if (isMock) return getMockCompanySetting();

  /*
    ⚠️ **한 번에 주는 API가 없다.** 화면은 기본 정보·팀·직급을 한 화면에 그리는데 BE는 셋으로
       나뉘어 있다([확인] `CompanyController.getProfile` · `TeamController.list` ·
       `PositionController.list`) — 여기서 모아 하나로 돌려준다. 화면은 그 사실을 모른다.
    ⚠️ **나란히 부른다.** 줄줄이 기다리면 카드 셋이 다 그려질 때까지 세 번 왕복한다.
    ⚠️ 회사는 **토큰의 `companyId`** 로 정해진다 — 파라미터로 안 보낸다(§라우트 그룹).
  */
  const accessToken = await requireAccessToken();
  const [profile, teams, positions] = await Promise.all([
    serverApi<BeCompanyProfile>(ep.companyMe(), { accessToken }),
    serverApi<BeTeam[]>(ep.teams(), { accessToken }),
    serverApi<BePosition[]>(ep.jobPositions(), { accessToken }),
  ]);

  return {
    profile: toCompanyProfile(profile),
    departments: teams.map(toDepartmentNode),
    positions: positions.map(toPosition),
    teamMemberCounts: toTeamMemberCounts(teams),
  };
}
