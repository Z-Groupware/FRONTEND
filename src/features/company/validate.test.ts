import { AUTHORITY } from "@/constants/domain";

import type { CompanyProfileDraft, DepartmentNode, Position } from "./types";
import {
  findBlockedTeamRemoval,
  validateCompanyProfile,
  validateDepartments,
  validatePositions,
} from "./validate";

/**
 * 기업 설정 검증 — **서버가 마지막으로 보는 곳**이다.
 * 화면이 막는 것들이지만 액션은 주소만 알면 직접 부를 수 있어서, 여기가 뚫리면 조직 체계가
 * 망가진 채로 저장된다(§권한: 화면 숨김은 보안이 아니다).
 */

const VALID: CompanyProfileDraft = {
  name: "지그재그컴퍼니",
  businessNumber: "123-45-67890",
  place: { address: "서울 강남구 테헤란로 152", lat: 37.500806, lng: 127.036377 },
};

function team(id: string, name: string, children: DepartmentNode[] = []): DepartmentNode {
  return { id, name, children };
}

describe("validateCompanyProfile", () => {
  it("다 채운 값은 오류가 없다", () => {
    expect(validateCompanyProfile(VALID)).toEqual({});
  });

  it("기업명이 공백만이면 막는다", () => {
    expect(validateCompanyProfile({ ...VALID, name: "   " }).name).toBeTruthy();
  });

  /*
    ⚠️ 자릿수만 세면 `1234567890`도 통과한다 — 하이픈 자리까지 봐야 눈으로 확인할 수 있는 꼴이 된다.
  */
  it.each(["1234567890", "12-345-67890", "123-45-6789", "abc-de-fghij", ""])(
    "사업자등록번호 %s는 막는다",
    (businessNumber) => {
      expect(validateCompanyProfile({ ...VALID, businessNumber }).businessNumber).toBeTruthy();
    },
  );

  it("위치를 안 고르면 막는다 — 세금계산서가 나가는 주소다", () => {
    expect(validateCompanyProfile({ ...VALID, place: null }).place).toBeTruthy();
  });

  it("주소가 비어 있으면 좌표가 있어도 막는다", () => {
    expect(
      validateCompanyProfile({ ...VALID, place: { address: "  ", lat: 37.5, lng: 127 } }).place,
    ).toBeTruthy();
  });

  /*
    ⚠️ 지도를 못 쓰는 환경(키 없음·SDK 차단)에서는 주소만 직접 적고 좌표가 `0`으로 남는다 —
       신청 화면과 **같은 규칙**이라 여기서도 통과시켜야 한다. 막으면 그 환경에서는 회사
       정보를 영영 못 고친다.
  */
  it("좌표가 0이어도 주소가 있으면 통과한다 — 지도를 못 쓰는 환경의 값이다", () => {
    expect(
      validateCompanyProfile({ ...VALID, place: { address: "서울 어딘가", lat: 0, lng: 0 } }),
    ).toEqual({});
  });

  /*
    ⚠️ 규칙은 **기업 등록 신청과 같은 스키마**에서 온다. 여기가 신청보다 느슨해지면
       신청 때 막힌 값이 설정에서는 저장되고, 조이면 그 반대가 된다.
  */
  /*
    ⚠️ 한 칸에 오류가 여럿 나와도 **첫 줄만** 쓴다(신청 화면과 같은 규칙). 빈 칸이면
       "입력해 주세요"와 "형식이 틀렸어요"가 같이 나오는데, 아직 아무것도 안 적은 사람에게
       형식 얘기는 소음이다. `!(field in errors)` 가드가 지워져도 이 테스트가 잡는다.
  */
  it("한 칸에 오류가 여럿이면 첫 줄만 남긴다", () => {
    const errors = validateCompanyProfile({ ...VALID, businessNumber: "" });

    expect(errors.businessNumber).toBe("사업자등록번호를 입력해 주세요");
  });

  it("신청 화면과 같은 문구로 알린다", () => {
    const errors = validateCompanyProfile({ name: "", businessNumber: "", place: null });

    expect(errors.name).toBe("기업명을 입력해 주세요");
    expect(errors.place).toBe("회사 위치를 찾아 골라 주세요");
  });
});

describe("validateDepartments", () => {
  it("정상 트리는 통과한다", () => {
    expect(
      validateDepartments([team("d1", "개발팀", [team("r1", "프론트")]), team("d2", "기획팀")]),
    ).toBeNull();
  });

  it("팀이 하나도 없으면 막는다 — 사원이 소속될 곳이 사라진다", () => {
    expect(validateDepartments([])).toBeTruthy();
  });

  it("이름이 비면 막는다", () => {
    expect(validateDepartments([team("d1", "  ")])).toBeTruthy();
  });

  it("이름이 5자를 넘으면 막는다 — 초대 칸에서 잘린다", () => {
    expect(validateDepartments([team("d1", "여섯글자팀명")])).toBeTruthy();
  });

  it("같은 부모 아래 같은 이름은 막는다", () => {
    expect(validateDepartments([team("d1", "개발팀"), team("d2", "개발팀")])).toBeTruthy();
  });

  /*
    ⚠️ 다른 팀에 같은 이름의 역할이 있는 건 **정상**이다 — 개발팀의 `리더`와 기획팀의 `리더`는
       다른 자리다. 여기서 막으면 회사가 팀을 늘릴수록 쓸 수 있는 역할 이름이 줄어든다.
  */
  it("부모가 다르면 같은 이름을 허용한다", () => {
    expect(
      validateDepartments([
        team("d1", "개발팀", [team("r1", "리더")]),
        team("d2", "기획팀", [team("r2", "리더")]),
      ]),
    ).toBeNull();
  });

  it("2계층을 넘는 손자는 막는다", () => {
    const deep = [team("d1", "개발팀", [team("r1", "프론트", [team("x1", "주니어")])])];

    expect(validateDepartments(deep)).toBeTruthy();
  });
});

describe("validatePositions", () => {
  const leader: Position = { id: "p1", name: "팀장", role: AUTHORITY.LEADER };
  const member: Position = { id: "p2", name: "사원", role: AUTHORITY.MEMBER };

  it("리더 하나 + 멤버는 통과한다", () => {
    expect(validatePositions([leader, member])).toBeNull();
  });

  it("직급이 하나도 없으면 막는다", () => {
    expect(validatePositions([])).toBeTruthy();
  });

  /*
    ⚠️ 리더가 둘이면 팀 범위 판정(`isWithinTeamScope`)이 무너진다 — 한 팀에 팀장이 둘 생긴다.
       화면 훅이 막지만 액션은 직접 부를 수 있어 여기서 다시 본다.
  */
  it("Leader 권한을 가진 직급이 둘이면 막는다", () => {
    const second: Position = { id: "p3", name: "실장", role: AUTHORITY.LEADER };

    expect(validatePositions([leader, second])).toBeTruthy();
  });

  it("같은 이름의 직급 둘은 막는다", () => {
    expect(validatePositions([member, { ...member, id: "p9" }])).toBeTruthy();
  });

  it("이름이 비거나 5자를 넘으면 막는다", () => {
    expect(validatePositions([{ ...member, name: " " }])).toBeTruthy();
    expect(validatePositions([{ ...member, name: "여섯글자직급" }])).toBeTruthy();
  });
});

describe("findBlockedTeamRemoval", () => {
  const before = [team("d1", "개발팀", [team("r1", "프론트")]), team("d2", "기획팀")];

  /*
    ⚠️ 팀은 인수인계·액션 귀속의 단위다. 소속이 사라진 사원은 `isWithinTeamScope`가 teamId
       비교라 **아무도 관리할 수 없는 상태**가 된다 — 워크플로우가 사람이 빠질 때 늘 명시적
       재할당을 거치는 것과 같은 이유로 막는다.
  */
  it("사람이 남은 팀을 지우려 하면 그 팀 이름을 돌려준다", () => {
    expect(findBlockedTeamRemoval(before, [team("d1", "개발팀")], { d1: 6, d2: 3 })).toBe("기획팀");
  });

  it("빈 팀은 지울 수 있다", () => {
    expect(findBlockedTeamRemoval(before, [team("d1", "개발팀")], { d1: 6, d2: 0 })).toBeNull();
  });

  it("인원을 모르는 팀은 0으로 본다 — 없는 키에 걸려 못 지우면 안 된다", () => {
    expect(findBlockedTeamRemoval(before, [team("d1", "개발팀")], { d1: 6 })).toBeNull();
  });

  it("아무 팀도 안 지웠으면 막지 않는다", () => {
    expect(findBlockedTeamRemoval(before, before, { d1: 6, d2: 3 })).toBeNull();
  });

  /*
    ⚠️ 역할(트리 아랫단)은 세지 않는다. 사원이 소속되는 건 **팀**이다(§권한 ③) —
       역할만 지우는 건 사람의 소속을 건드리지 않는다.
  */
  it("역할만 지우는 건 막지 않는다", () => {
    const next = [team("d1", "개발팀"), team("d2", "기획팀")];

    expect(findBlockedTeamRemoval(before, next, { d1: 6, d2: 3, r1: 6 })).toBeNull();
  });
});
