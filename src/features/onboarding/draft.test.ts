/**
 * @jest-environment jsdom
 */
import { loadDraft, saveDraftPositions } from "./draft";

const KEY = "z:onboarding-draft";

const put = (value: unknown) => window.sessionStorage.setItem(KEY, JSON.stringify(value));

describe("임시 보관함 복원", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("제대로 저장한 값은 그대로 돌아온다", () => {
    saveDraftPositions([{ id: "p1", name: "팀장", role: "LEADER" }]);
    expect(loadDraft().positions).toEqual([{ id: "p1", name: "팀장", role: "LEADER" }]);
  });

  it("저장된 게 없으면 빈 값이다", () => {
    expect(loadDraft().positions).toBeUndefined();
  });

  it("JSON이 깨졌으면 없는 셈 친다", () => {
    window.sessionStorage.setItem(KEY, "{떡실신");
    expect(loadDraft()).toEqual({});
  });

  // ⚠️ 여기가 핵심이다 — 아래 값들은 전부 "유효한 JSON"이라 파싱은 통과한다.
  //    모양까지 보지 않으면 화면에서 .map()을 부르는 순간 터진다.
  it("배열이어야 할 자리에 객체가 들어 있으면 버린다", () => {
    put({ positions: { id: "p1" } });
    expect(loadDraft().positions).toBeUndefined();
  });

  it("항목에 필드가 빠져 있으면 버린다", () => {
    put({ positions: [{ id: "p1" }] });
    expect(loadDraft().positions).toBeUndefined();
  });

  it("옛 스키마로 저장된 초대(roleId 없음)는 버린다", () => {
    put({ invites: [{ id: "i1", email: "a@b.com", departmentId: "dev", positionId: "staff" }] });
    expect(loadDraft().invites).toBeUndefined();
  });

  it("한 항목만 깨져도 그 목록 전체를 버린다 — 반쪽짜리 복원이 더 위험하다", () => {
    put({
      departments: [
        { id: "d1", name: "개발팀", children: [] },
        { id: "d2", name: "디자인팀" },
      ],
    });
    expect(loadDraft().departments).toBeUndefined();
  });

  it("부서 목록이 깨져도 멀쩡한 직급 목록은 살린다", () => {
    put({
      departments: "망가짐",
      positions: [{ id: "p1", name: "사원", role: "MEMBER" }],
    });

    const draft = loadDraft();
    expect(draft.departments).toBeUndefined();
    expect(draft.positions).toHaveLength(1);
  });

  it("하위 역할까지 재귀로 확인한다", () => {
    put({ departments: [{ id: "d1", name: "개발팀", children: [{ id: "r1" }] }] });
    expect(loadDraft().departments).toBeUndefined();
  });
});
