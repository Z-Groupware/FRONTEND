import {
  type BeCompanyProfile,
  type BeTeam,
  toCompanyProfile,
  toCompanyUpdateBody,
  toDepartmentNode,
  withoutSystemRoles,
} from "./mapper";
import type { CompanyProfileDraft } from "./types";

/**
 * 기업 설정 매퍼 — **좌표 왕복**이 핵심이다(2026-08-13 실 연동, BE `30952c10`).
 *
 * ⚠️ 지도에서 고른 핀은 저장(`toCompanyUpdateBody`)과 복원(`toCompanyProfile`)이 짝이다 —
 *    한쪽만 맞으면 저장한 핀이 다시 열 때 사라지거나, 못 쓴 지도(0,0)가 바다에 저장된다.
 */

const BE_PROFILE: BeCompanyProfile = {
  companyId: 1,
  code: "ZG-1234",
  name: "(주)테크스타트",
  businessNumber: "123-45-67890",
  representativeName: "김서준",
  address: "서울시 강남구 테헤란로 123",
  latitude: 37.5006,
  longitude: 127.0366,
  phone: "02-1234-5678",
  subscriptionStatus: "ACTIVE",
  onboardedAt: "2026-08-01T09:00:00",
};

describe("toCompanyProfile — 좌표 복원", () => {
  it("좌표가 오면 핀이 그대로 살아난다", () => {
    expect(toCompanyProfile(BE_PROFILE).place).toEqual({
      address: "서울시 강남구 테헤란로 123",
      lat: 37.5006,
      lng: 127.0366,
    });
  });

  /* ⚠️ 지도로 고른 적이 없으면 BE가 null을 준다 — 등록 신청의 "지도 못 씀" 표기(0)로 접는다 */
  it("좌표가 null이면 0으로 접는다 — 주소 글자는 남는다", () => {
    const profile = toCompanyProfile({ ...BE_PROFILE, latitude: null, longitude: null });

    expect(profile.place).toEqual({ address: "서울시 강남구 테헤란로 123", lat: 0, lng: 0 });
  });

  /* ⚠️ place는 주소+좌표 한 몸이다 — 주소 없는 핀은 무엇을 가리키는지 말할 수 없다 */
  it("주소가 없으면 좌표가 있어도 place는 null이다", () => {
    expect(toCompanyProfile({ ...BE_PROFILE, address: null }).place).toBeNull();
  });
});

describe("toCompanyUpdateBody — 좌표 저장", () => {
  const DRAFT: CompanyProfileDraft = {
    name: "새이름",
    businessNumber: "999-88-77777",
    place: { address: "서울 강남구 테헤란로 1", lat: 37.5, lng: 127 },
  };

  it("핀이 있으면 주소·좌표를 함께 보낸다", () => {
    expect(toCompanyUpdateBody(DRAFT)).toEqual({
      name: "새이름",
      businessNumber: "999-88-77777",
      address: "서울 강남구 테헤란로 1",
      latitude: 37.5,
      longitude: 127,
    });
  });

  /*
    ⚠️ `0,0`은 좌표가 아니라 "지도를 못 썼다"는 표기다(`register-draft`) — 그대로 보내면
       기니만 바다에 핀이 저장된다. 부분 수정 계약이라 필드째 생략하면 서버 값이 안 바뀐다.
  */
  it("좌표가 0,0이면(지도 못 쓴 환경) 주소만 보낸다", () => {
    const body = toCompanyUpdateBody({ ...DRAFT, place: { ...DRAFT.place!, lat: 0, lng: 0 } });

    expect(body.address).toBe("서울 강남구 테헤란로 1");
    expect(body).not.toHaveProperty("latitude");
    expect(body).not.toHaveProperty("longitude");
  });

  /* ⚠️ 빈 주소는 BE `@Pattern`이 400으로 거절한다 — 필드째 생략한다(PR #423). 좌표도 따라간다 */
  it("주소가 없으면 주소도 좌표도 생략한다 — place는 한 몸이다", () => {
    const body = toCompanyUpdateBody({ ...DRAFT, place: null });

    expect(body).toEqual({ name: "새이름", businessNumber: "999-88-77777" });
  });
});

const BE_TEAM: BeTeam = {
  teamId: 1,
  name: "개발팀",
  leaderMemberId: 9,
  leaderName: "김서준",
  memberCount: 3,
  roles: [
    { roleId: 2, name: "없음" },
    { roleId: 3, name: "프론트엔드" },
  ],
};

/**
 * 팀 → 트리 — **역할을 담는다**(2026-08-14 BE PR #489. 전에는 BE가 안 줘서 늘 빈 배열이었다).
 */
describe("toDepartmentNode — 역할을 담는다", () => {
  it("id를 문자열로 바꿔 그대로 옮긴다", () => {
    expect(toDepartmentNode(BE_TEAM)).toEqual({
      id: "1",
      name: "개발팀",
      children: [
        { id: "2", name: "없음", children: [] },
        { id: "3", name: "프론트엔드", children: [] },
      ],
    });
  });

  /* ⚠️ 팀장(`leaderMemberId`·`leaderName`)은 우리 노드에 자리가 없어 그대로 버린다 */
  it("역할이 없는 팀은 빈 배열이다", () => {
    expect(toDepartmentNode({ ...BE_TEAM, roles: [] }).children).toEqual([]);
  });
});

describe("withoutSystemRoles — 팀 편집 화면 전용 필터", () => {
  /*
    ⚠️ **`없음`은 회사가 만든 역할이 아니다.** 팀을 지워도 같이 지워지지 않는 전역 시드
       행이라, 편집 트리에 그대로 두면 사용자가 이름을 바꾸거나 지울 수 있는 것처럼 보인다.
  */
  it("`없음`만 뺀다 — 회사가 만든 역할은 남는다", () => {
    const node = toDepartmentNode(BE_TEAM);

    expect(withoutSystemRoles(node).children).toEqual([
      { id: "3", name: "프론트엔드", children: [] },
    ]);
  });

  it("`없음`만 있던 팀은 편집 화면에서 역할이 빈 팀으로 보인다", () => {
    const node = toDepartmentNode({ ...BE_TEAM, roles: [{ roleId: 2, name: "없음" }] });

    expect(withoutSystemRoles(node).children).toEqual([]);
  });
});
