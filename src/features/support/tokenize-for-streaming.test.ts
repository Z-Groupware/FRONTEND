import { tokenizeForStreaming } from "./tokenize-for-streaming";

/**
 * 스트리밍 조각 나눔.
 *
 * ⚠️ **강조·링크·코드는 통째로 한 조각**이라야 별표·백틱이 열린 채로 깜빡이지 않는다.
 *    회귀 방지용으로 삼중 백틱 코드 블록도 한 덩어리로 유지되는지 함께 검사한다.
 */
describe("tokenizeForStreaming", () => {
  it("굵은 강조는 한 조각으로 나온다", () => {
    const chunks = tokenizeForStreaming("가 **중요** 나");
    expect(chunks).toContain("**중요**");
  });

  it("링크는 한 조각으로 나온다", () => {
    const chunks = tokenizeForStreaming("가 [요금제](/plans) 나");
    expect(chunks).toContain("[요금제](/plans)");
  });

  /*
    ⚠️ 삼중 백틱 코드 블록이 인라인 `…`로 오인돼 여러 조각으로 쪼개지면
       스트리밍 도중 여는 백틱만 보인 채 한 틱 깜빡인다 — 코드 블록은
       원자 청크로 보장돼야 한다 (PR #462 리뷰).
  */
  it("삼중 백틱 코드 블록은 한 조각으로 나온다", () => {
    const source = "설명\n\n```ts\nconst x = 1;\nconst y = 2;\n```\n\n끝";
    const chunks = tokenizeForStreaming(source);
    expect(chunks).toContain("```ts\nconst x = 1;\nconst y = 2;\n```");
  });

  it("삼중 백틱 블록이 인라인 코드 뒤에 와도 통째로 유지된다", () => {
    const source = "인라인 `foo` 다음 ```js\na\n``` 끝";
    const chunks = tokenizeForStreaming(source);
    expect(chunks).toContain("`foo`");
    expect(chunks).toContain("```js\na\n```");
  });
});
