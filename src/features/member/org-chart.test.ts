import { AUTHORITY } from "@/constants/authority";
import { MEMBER_STATUS } from "@/constants/member";

import type { ManagedMember } from "./manage-types";
import { buildOrgChart, isCurrentOrgMember, searchOrgMembers, summarizeOrg } from "./org-chart";
import { NO_TEAM_LABEL } from "./org-types";

/**
 * 조직도 조립 — **화면이 무엇을 보여줄지 정하는 곳**이다.
 * 여기가 틀리면 리더가 팀원 사이에 섞이거나 사람이 조용히 사라진다.
 */

function member(over: Partial<ManagedMember> & Pick<ManagedMember, "id" | "name">): ManagedMember {
  return {
    email: `${over.id}@zgroup.co.kr`,
    teamName: "개발팀",
    position: "사원",
    authority: AUTHORITY.MEMBER,
    isAdmin: false,
    roleLabel: null,
    status: MEMBER_STATUS.ACTIVE,
    joinedAt: "2024-01-02",
    pendingHandoverType: null,
    ...over,
  };
}

const OWNER = member({
  id: 1,
  name: "박대표",
  teamName: null,
  position: "대표",
  authority: AUTHORITY.OWNER,
});
const LEADER = member({ id: 2, name: "김서준", position: "팀장", authority: AUTHORITY.LEADER });
const FRONTEND = member({ id: 3, name: "이하윤", position: "선임", roleLabel: "프론트엔드" });

describe("buildOrgChart", () => {
  it("대표를 팀 밖으로 세운다 — 팀이 없는 유일한 사람이다", () => {
    const chart = buildOrgChart([OWNER, LEADER]);

    expect(chart.owner?.name).toBe("박대표");
    expect(chart.teams).toHaveLength(1);
    expect(chart.teams[0]?.members.map((m) => m.name)).toEqual(["김서준"]);
  });

  /*
    ⚠️ 리더가 팀원 사이에 섞이면 조직도가 조직을 안 보여준다 — 누가 그 팀을 맡는지가
       이 화면의 첫 번째 정보다.
  */
  it("팀 안에서 리더를 맨 앞으로 당긴다 — 명부 순서와 무관하게", () => {
    const chart = buildOrgChart([FRONTEND, member({ id: 4, name: "박도현" }), LEADER]);

    expect(chart.teams[0]?.members.map((m) => m.name)).toEqual(["김서준", "이하윤", "박도현"]);
  });

  it("리더를 뺀 나머지는 명부 순서를 지킨다", () => {
    const chart = buildOrgChart([
      member({ id: 4, name: "박도현" }),
      LEADER,
      member({ id: 5, name: "한소율" }),
    ]);

    expect(chart.teams[0]?.members.map((m) => m.name)).toEqual(["김서준", "박도현", "한소율"]);
  });

  /*
    ⚠️ 팀 차례는 회사가 온보딩에서 정한 것이다. 가나다순으로 다시 세우면 화면이 회사와
       다른 말을 한다.
  */
  it("팀 차례는 명부에 나온 순서 그대로다 — 이름순으로 다시 세우지 않는다", () => {
    const chart = buildOrgChart([
      member({ id: 2, name: "하나", teamName: "하늘팀" }),
      member({ id: 3, name: "둘", teamName: "가람팀" }),
    ]);

    expect(chart.teams.map((team) => team.name)).toEqual(["하늘팀", "가람팀"]);
  });

  it("역할을 그대로 옮긴다 — 사원 관리와 같은 값이다", () => {
    const chart = buildOrgChart([FRONTEND]);

    expect(chart.teams[0]?.members[0]?.roleLabel).toBe("프론트엔드");
  });

  /*
    ⚠️ 팀이 없는 건 원래 대표뿐이다. 여기 사람이 담기면 명부가 이상한 것인데, 안 그리면
       전체 인원과 화면에 보이는 수가 어긋나 아무도 못 알아챈다.
  */
  it("팀이 없는 비대표는 조용히 빠뜨리지 않고 '소속 없음'으로 묶는다", () => {
    const orphan = member({ id: 7, name: "떠도는사람", teamName: null });
    const chart = buildOrgChart([OWNER, orphan]);

    expect(chart.teams.map((team) => team.name)).toEqual([NO_TEAM_LABEL]);
    expect(chart.totalCount).toBe(2);
  });

  it("대표가 둘이면 첫 사람만 대표 자리에 세우고 나머지는 안 버린다", () => {
    const second = member({
      id: 8,
      name: "또다른대표",
      teamName: null,
      authority: AUTHORITY.OWNER,
    });
    const chart = buildOrgChart([OWNER, second]);

    expect(chart.owner?.name).toBe("박대표");
    expect(chart.teams[0]?.members.map((m) => m.name)).toEqual(["또다른대표"]);
    expect(chart.totalCount).toBe(2);
  });

  it("대표가 없어도 팀만 그린다 — 없는 사람을 지어내지 않는다", () => {
    const chart = buildOrgChart([LEADER]);

    expect(chart.owner).toBeNull();
    expect(chart.totalCount).toBe(1);
  });

  it("전체 인원은 대표를 포함해 센다", () => {
    const chart = buildOrgChart([OWNER, LEADER, FRONTEND]);

    expect(chart.totalCount).toBe(3);
  });

  it("아무도 없으면 빈 조직도다", () => {
    expect(buildOrgChart([])).toEqual({ owner: null, teams: [], totalCount: 0 });
  });
});

describe("isCurrentOrgMember", () => {
  /*
    ⚠️ 조직도는 **지금 조직**이다. 나간 사람이 팀에 남으면 `개발팀 3명`이 틀린 말이 된다.
       "나간 사람은 목록에 남는다"는 규칙이 지키려는 건 기록의 출처이고, 그 자리는
       사원 관리와 액션·회의 이력이지 여기가 아니다.
  */
  it("퇴사자는 조직도에서 뺀다", () => {
    expect(
      isCurrentOrgMember(member({ id: 9, name: "나간사람", status: MEMBER_STATUS.RESIGNED })),
    ).toBe(false);
  });

  /*
    ⚠️ 신청했을 뿐 승인 전이라 **여전히 재직 중**이다. 신청했다는 이유로 조직에서 빼면
       화면이 앞서간다.
  */
  it("승인 대기 중인 사람은 그대로 남긴다 — 아직 재직 중이다", () => {
    expect(
      isCurrentOrgMember(member({ id: 3, name: "이하윤", status: MEMBER_STATUS.WAITING })),
    ).toBe(true);
  });

  it("휴직자도 남긴다 — 자리에 없을 뿐 조직에는 있다", () => {
    expect(
      isCurrentOrgMember(member({ id: 5, name: "쉬는사람", status: MEMBER_STATUS.VACATION })),
    ).toBe(true);
  });
});

describe("searchOrgMembers", () => {
  const ROSTER = [OWNER, LEADER, FRONTEND, member({ id: 4, name: "박도현", roleLabel: "백엔드" })];

  it("검색어가 없으면 그대로 돌려준다", () => {
    expect(searchOrgMembers(ROSTER, "  ")).toHaveLength(4);
  });

  it("이름으로 찾는다", () => {
    expect(searchOrgMembers(ROSTER, "하윤").map((m) => m.name)).toEqual(["이하윤"]);
  });

  /*
    ⚠️ **역할·직급으로 찾는 게 이 화면의 핵심이다.** "프론트엔드가 누구지"로 들어오는
       자리라, 사원 관리의 검색(이름·팀·이메일)을 그대로 쓰면 못 찾는다.
  */
  it("역할로 찾는다 — 이 화면에서 가장 많이 쓰는 길이다", () => {
    expect(searchOrgMembers(ROSTER, "프론트").map((m) => m.name)).toEqual(["이하윤"]);
  });

  it("직급으로 찾는다", () => {
    expect(searchOrgMembers(ROSTER, "팀장").map((m) => m.name)).toEqual(["김서준"]);
  });

  it("팀으로 찾는다", () => {
    expect(searchOrgMembers(ROSTER, "개발팀")).toHaveLength(3);
  });

  it("대소문자를 가리지 않는다", () => {
    const english = member({ id: 6, name: "Sam", roleLabel: "Backend" });

    expect(searchOrgMembers([english], "backend")).toHaveLength(1);
  });

  it("역할이 없는 사람 때문에 터지지 않는다", () => {
    expect(searchOrgMembers([OWNER], "없")).toHaveLength(0);
  });
});

describe("summarizeOrg", () => {
  it("대표를 포함해 전체를 세고, 팀은 대표를 빼고 센다", () => {
    const summary = summarizeOrg([
      OWNER,
      LEADER,
      member({ id: 5, name: "최유진", teamName: "마케팅팀" }),
    ]);

    expect(summary.totalCount).toBe(3);
    expect(summary.teamCount).toBe(2);
  });

  it("휴직자를 센다", () => {
    const summary = summarizeOrg([
      LEADER,
      member({ id: 5, name: "쉬는사람", status: MEMBER_STATUS.VACATION }),
    ]);

    expect(summary.vacationCount).toBe(1);
  });

  /*
    ⚠️ 승인 대기는 **안 센다.** 아직 아무 일도 일어나지 않았고, 그건 대표·관리자가
       사원 관리에서 다룰 일이다(WORKFLOW §7).
  */
  it("승인 대기는 휴직으로 세지 않는다", () => {
    const summary = summarizeOrg([
      LEADER,
      member({ id: 3, name: "이하윤", status: MEMBER_STATUS.WAITING }),
    ]);

    expect(summary.vacationCount).toBe(0);
  });
});
