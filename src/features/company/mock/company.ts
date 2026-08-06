import { AUTHORITY } from "@/constants/domain";

import type { CompanyProfileDraft, CompanySetting, DepartmentNode, Position } from "../types";

/**
 * 목 — 온보딩을 마친 회사 하나.
 *
 * ⚠️ **고치면 남는다.** 모듈 수준 저장소라 서버가 살아 있는 동안은 저장이 실제로 반영된다 —
 *    누르면 아무 일도 안 일어나는 목은 "저장했습니다"가 거짓말이 된다(§정직한 목업).
 *    서버를 다시 띄우면 아래 값으로 돌아간다.
 * ⚠️ 값은 온보딩 목과 같은 결로 둔다 — 데모에서 두 화면을 오갈 때 조직이 달라 보이면 안 된다.
 */

const INITIAL: CompanySetting = {
  profile: {
    name: "지그재그컴퍼니",
    businessNumber: "123-45-67890",
    // 지도에 핀이 꽂히는 좌표다 — 신청 화면에서 고른 값이 그대로 넘어온 모양
    place: { address: "서울 강남구 테헤란로 152", lat: 37.500806, lng: 127.036377 },
    code: "ZIGZAG",
  },
  departments: [
    {
      id: "d1",
      name: "개발팀",
      children: [
        { id: "r1", name: "프론트", children: [] },
        { id: "r2", name: "백엔드", children: [] },
      ],
    },
    { id: "d2", name: "기획팀", children: [] },
    { id: "d3", name: "디자인팀", children: [] },
  ],
  positions: [
    { id: "p1", name: "팀장", role: AUTHORITY.LEADER },
    { id: "p2", name: "매니저", role: AUTHORITY.MEMBER },
    { id: "p3", name: "사원", role: AUTHORITY.MEMBER },
  ],
};

/*
  ⚠️ `structuredClone`을 쓰지 않는다. Node엔 있지만 **jsdom 테스트 환경에는 없어서**
     이 모듈을 import하는 것만으로 스위트가 죽는다. 여기 값은 전부 평범한 JSON이라
     이걸로 충분하다.
*/
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let store: CompanySetting = clone(INITIAL);

export function getMockCompanySetting(): CompanySetting {
  return clone(store);
}

export function updateMockCompanyProfile(draft: CompanyProfileDraft): void {
  // 기업 코드는 폼에 없다 — 있던 값을 그대로 들고 간다(못 고치는 값이다)
  store = { ...store, profile: { ...draft, code: store.profile.code } };
}

export function updateMockDepartments(departments: DepartmentNode[]): void {
  store = { ...store, departments: clone(departments) };
}

export function updateMockPositions(positions: Position[]): void {
  store = { ...store, positions: clone(positions) };
}

/** 테스트가 앞 테스트의 저장을 물려받지 않게 되돌린다 */
export function resetMockCompanySetting(): void {
  store = clone(INITIAL);
}
