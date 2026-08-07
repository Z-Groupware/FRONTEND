import { AUTHORITY } from "@/constants/authority";
import { MEMBER_STATUS } from "@/constants/member";

import type { ManagedMember } from "./manage-types";
import { buildOrgChart } from "./org-chart";
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
    ⚠️ 나간 사람을 뺄지는 팀이 정한 적이 없다. 여기서 거르면 화면이 정해지지 않은 정책을
       단언하게 된다 — 뱃지로 알리고 판단은 하지 않는다.
  */
  it("퇴사자도 조직도에 남긴다 — 거르는 건 정해진 규칙이 아니다", () => {
    const resigned = member({ id: 9, name: "나간사람", status: MEMBER_STATUS.RESIGNED });
    const chart = buildOrgChart([LEADER, resigned]);

    expect(chart.teams[0]?.members.map((m) => m.name)).toContain("나간사람");
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
