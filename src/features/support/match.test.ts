import { FAQ_ENTRIES } from "./faq";
import { findFaqAnswer } from "./match";

/**
 * 도움말 검색.
 *
 * ⚠️ 사람이 실제로 칠 법한 말로 검사한다 — 대표 질문을 그대로 붙여 넣는 사람은 없다.
 */
describe("findFaqAnswer", () => {
  it.each([
    ["얼마에요?", "pricing"],
    ["돈 얼마나 들어요", "pricing"],
    ["어떻게 시작하나요", "signup"],
    ["기업 코드 어디서 받아요?", "company-code"],
    ["기업코드가 뭔데", "company-code"],
    ["비밀번호 까먹었어요", "password"],
    ["사파리에서 써도 되나요", "browser"],
    ["다크모드 있나요", "dark-mode"],
    ["회사 어디에 있어요", "location"],
    ["약관 보고 싶어요", "legal"],
  ])("'%s' → %s", (input, expected) => {
    expect(findFaqAnswer(input)?.id).toBe(expected);
  });

  it("모르는 질문은 null이다 — 억지로 답하지 않는다", () => {
    expect(findFaqAnswer("오늘 점심 뭐 먹지")).toBeNull();
    expect(findFaqAnswer("환불 규정 알려줘")).toBeNull();
  });

  it("빈 입력은 null이다", () => {
    expect(findFaqAnswer("")).toBeNull();
    expect(findFaqAnswer("   ")).toBeNull();
  });

  // 짧은 키워드가 긴 키워드를 이기면 엉뚱한 항목이 잡힌다
  it("긴 키워드가 이긴다", () => {
    expect(findFaqAnswer("기업코드")?.id).toBe("company-code");
  });

  it("모든 항목은 대표 질문으로 자기 자신을 찾을 수 있다", () => {
    for (const entry of FAQ_ENTRIES) {
      expect(findFaqAnswer(entry.question)).not.toBeNull();
    }
  });
});
