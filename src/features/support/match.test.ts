import { FAQ_ENTRIES } from "./faq-entries";
import { findFaqCandidates } from "./match";

/**
 * 도움말 검색.
 *
 * ⚠️ 사람이 실제로 칠 법한 말로 검사한다 — 대표 질문을 그대로 붙여 넣는 사람은 없다.
 * ⚠️ **하나만 걸리는지 여럿이 걸리는지**가 화면 동작을 가른다. 하나면 바로 답하고,
 *    여럿이면 되묻는다 — 그래서 개수까지 확인한다.
 */
describe("findFaqCandidates", () => {
  it.each([
    ["기업 코드 어디서 받아요?", "company-code"],
    ["기업코드가 뭔데", "company-code"],
    ["비밀번호 까먹었어요", "password"],
    ["사파리에서 써도 되나요", "browser"],
    ["다크모드 있나요", "dark-mode"],
    ["약관 보고 싶어요", "legal"],
    ["회의 녹음되나요", "capture"],
  ])("'%s' → 첫 후보가 %s", (input, expected) => {
    expect(findFaqCandidates(input)[0]?.id).toBe(expected);
  });

  it("모르는 질문은 후보가 없다 — 억지로 답하지 않는다", () => {
    expect(findFaqCandidates("오늘 점심 뭐 먹지")).toHaveLength(0);
    expect(findFaqCandidates("환불 규정 알려줘")).toHaveLength(0);
  });

  it("빈 입력은 후보가 없다", () => {
    expect(findFaqCandidates("")).toHaveLength(0);
    expect(findFaqCandidates("   ")).toHaveLength(0);
  });

  // 여러 갈래에 걸치는 말이면 **되물어야** 한다 — 바로 답하면 잘못 짚는다
  it("여러 개가 걸리면 여러 개를 돌려준다", () => {
    expect(findFaqCandidates("무료로 쓰면 요금이 안 드나요?").length).toBeGreaterThan(1);
  });

  it("후보는 네 개를 넘지 않는다 — 고르는 게 일이 되면 안 된다", () => {
    expect(findFaqCandidates("어떻게 시작 가격 권한 브라우저").length).toBeLessThanOrEqual(4);
  });

  it("긴 키워드가 이긴다", () => {
    expect(findFaqCandidates("기업코드")[0]?.id).toBe("company-code");
  });

  it("모든 항목은 대표 질문으로 자기 자신을 찾을 수 있다", () => {
    for (const entry of FAQ_ENTRIES) {
      expect(findFaqCandidates(entry.question).map((found) => found.id)).toContain(entry.id);
    }
  });
});
