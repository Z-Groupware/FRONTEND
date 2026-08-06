import { AUTHORITY } from "@/constants/domain";

import type { CompanyProfileDraft, DepartmentNode, Position } from "./types";
import { validateCompanyProfile, validateDepartments, validatePositions } from "./validate";

/**
 * 기업 설정 검증 — **서버가 마지막으로 보는 곳**이다.
 * 화면이 막는 것들이지만 액션은 주소만 알면 직접 부를 수 있어서, 여기가 뚫리면 조직 체계가
 * 망가진 채로 저장된다(§권한: 화면 숨김은 보안이 아니다).
 */

const VALID: CompanyProfileDraft = {
  name: "지그재그컴퍼니",
  businessNumber: "123-45-67890",
  ceoName: "김대표",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
};

function team(id: string, name: string, children: DepartmentNode[] = []): DepartmentNode {
  return { id, name, children };
}

describe("validateCompanyProfile", () => {
  it("다 채운 값은 오류가 없다", () => {
    expect(validateCompanyProfile(VALID)).toEqual({});
  });

  it.each(["name", "ceoName", "address"] as const)("%s는 공백만 적으면 막는다", (field) => {
    const errors = validateCompanyProfile({ ...VALID, [field]: "   " });

    expect(errors[field]).toBeTruthy();
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

  it("대표번호(1588-0000)도 지역번호도 받는다 — 자릿수를 못박지 않는다", () => {
    expect(validateCompanyProfile({ ...VALID, phone: "1588-0000" }).phone).toBeUndefined();
    expect(validateCompanyProfile({ ...VALID, phone: "031-123-4567" }).phone).toBeUndefined();
  });

  it("전화번호에 숫자·하이픈이 아닌 게 섞이면 막는다", () => {
    expect(validateCompanyProfile({ ...VALID, phone: "02-1234-5678 (내선 3)" }).phone).toBeTruthy();
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
