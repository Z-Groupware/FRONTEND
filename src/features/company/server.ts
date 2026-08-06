import "server-only";

import { isMock } from "@/mocks/config";

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

  // TODO(BE 협의): `GET /companies/me/setting` — 응답 봉투 모양은 아직 모른다(매퍼가 벗긴다)
  throw new Error("기업 설정 조회 API가 아직 연결되지 않았습니다.");
}
