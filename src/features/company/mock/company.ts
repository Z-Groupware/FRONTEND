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
  /*
    ⚠️ **빈 팀을 하나 둔다**(디자인팀). 사람이 딸린 팀만 있으면 "지울 수 있는 팀"이 하나도
       없어서 삭제 경로를 데모에서 못 본다.
  */
  teamMemberCounts: { d1: 6, d2: 3, d3: 0 },
  /*
    ⚠️ **사원 목이 실제로 쓰는 직급을 전부 담는다.** 전에는 `팀장·매니저·사원` 셋뿐이었는데
       사원들은 `선임·주임·대리·과장`을 달고 있었다 — 두 목이 서로 다른 회사를 그리고 있었다.
       직급을 목록에서 고르게 바꾸자(발급·직급 변경) 그 어긋남이 바로 드러났다.
    ⚠️ `Leader` 권한은 **한 직급뿐**이다(`validatePositions`) — 팀장만 갖는다.
    ⚠️ `대표`는 넣지 않는다. Owner는 회사에 하나뿐이고 발급·변경 대상이 아니라서
       고를 수 있는 목록에 있으면 안 된다(§권한).
  */
  positions: [
    { id: "p1", name: "팀장", role: AUTHORITY.LEADER },
    { id: "p2", name: "과장", role: AUTHORITY.MEMBER },
    { id: "p3", name: "대리", role: AUTHORITY.MEMBER },
    { id: "p4", name: "선임", role: AUTHORITY.MEMBER },
    { id: "p5", name: "주임", role: AUTHORITY.MEMBER },
    { id: "p6", name: "사원", role: AUTHORITY.MEMBER },
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
