/**
 * 프로젝트 매퍼 회귀 — 진척율 계약과 타임라인 `isDelayed` 옮기기.
 *
 * ⚠️ 지키는 것 둘:
 *   ① `toProjectListItem`은 BE `progressPct`(소수)를 **버린다** — 표시 규칙이 FE 몫이라
 *      두 벌로 두지 않는다. 결과 객체에 `progressPct` 키가 있으면 다음 사람이 그 값을
 *      화면에 그리기 시작한다.
 *   ② `toProjectTeamAction`은 BE `isDelayed`를 **옮긴다** — 지금까지 조용히 버려지고
 *      있었다(같은 파일에 필드가 선언돼 있는데 매퍼에서 안 읽었다).
 */
import {
  type BeProjectSummary,
  type BeProjectTimelineItem,
  toProjectListItem,
  toProjectTeamAction,
} from "./mapper";

describe("toProjectListItem — 진척율 계약", () => {
  const BE: BeProjectSummary = {
    id: 1,
    tag: "GOODS",
    color: "#123456",
    name: "굿즈 앱",
    description: "설명",
    status: "IN_PROGRESS",
    startDate: "2026-07-01",
    dueDate: "2026-09-30",
    teamCount: 3,
    actionCount: 3,
    completedActionCount: 1,
    meetingCount: 5,
    /* ⚠️ FE는 안 쓴다 — 결과 객체에 이 키가 없어야 한다 */
    progressPct: 33.333,
    teamNames: ["개발팀", "마케팅팀", "디자인팀"],
  };

  it("`progressPct`를 결과 객체로 옮기지 않는다 — FE `getProgressPercent`가 정본이다", () => {
    /*
      ⚠️ 여기서 실패하면 다음 사람이 BE 소수 값을 그대로 화면에 그리기 시작한다는 신호다.
         라인이 두 벌이 되면 목 경로가 진척율을 못 만들고, 반올림 규칙도 두 곳에 흩어진다.
    */
    const result = toProjectListItem(BE);
    expect(result).not.toHaveProperty("progressPct");
  });

  it("`actionCount`·`completedActionCount`만 UI 계약(`actionTotal`·`actionDone`)으로 옮긴다", () => {
    const result = toProjectListItem(BE);
    expect(result.actionTotal).toBe(3);
    expect(result.actionDone).toBe(1);
  });
});

describe("toProjectTeamAction — 타임라인 지연 배지", () => {
  const BE: BeProjectTimelineItem = {
    actionId: 42,
    title: "설계 검토",
    teamId: 1,
    teamName: "개발팀",
    status: "IN_PROGRESS",
    dueDate: "2026-08-20",
    isDelayed: true,
  };

  it("BE `isDelayed`를 그대로 UI 계약(`ProjectTeamAction.isDelayed`)에 싣는다", () => {
    /*
      ⚠️ 예전엔 이 값이 매퍼에서 조용히 버려지고 있었다. 프로젝트 타임라인만 BE가 이미
         계산해 보내므로 화면이 다시 계산하지 않는다 — 두 벌이면 자정 경계에서 어긋난다.
    */
    expect(toProjectTeamAction(BE).isDelayed).toBe(true);
    expect(toProjectTeamAction({ ...BE, isDelayed: false }).isDelayed).toBe(false);
  });
});
