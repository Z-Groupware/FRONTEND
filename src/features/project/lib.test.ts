import { PROJECT_STATUS } from "@/constants/domain";

import {
  DEFAULT_PROJECT_STATUS,
  getProgressPercent,
  parseProjectStatus,
  splitDepartments,
} from "./lib";

describe("getProgressPercent", () => {
  it("완료/전체를 반올림한 백분율로 준다", () => {
    expect(getProgressPercent(0, 11)).toBe(0);
    expect(getProgressPercent(3, 4)).toBe(75);
    expect(getProgressPercent(1, 3)).toBe(33);
  });

  it("액션이 없으면 0 — 0으로 나누지 않는다", () => {
    expect(getProgressPercent(0, 0)).toBe(0);
  });
});

describe("splitDepartments", () => {
  it("기본 2개까지 노출하고 나머지는 초과 수로 센다", () => {
    expect(splitDepartments(["개발팀", "마케팅팀", "디자인팀"])).toEqual({
      visible: ["개발팀", "마케팅팀"],
      overflow: 1,
    });
  });

  it("한도 이하면 초과는 0이다", () => {
    expect(splitDepartments(["마케팅팀", "디자인팀"])).toEqual({
      visible: ["마케팅팀", "디자인팀"],
      overflow: 0,
    });
  });
});

describe("parseProjectStatus", () => {
  it("아는 상태 값은 그대로 통과한다", () => {
    expect(parseProjectStatus("TODO")).toBe(PROJECT_STATUS.TODO);
    expect(parseProjectStatus("DONE")).toBe(PROJECT_STATUS.DONE);
  });

  it("모르는 값·빈 값은 기본 탭(진행중)으로", () => {
    expect(parseProjectStatus("nonsense")).toBe(DEFAULT_PROJECT_STATUS);
    expect(parseProjectStatus(undefined)).toBe(PROJECT_STATUS.IN_PROGRESS);
  });
});
