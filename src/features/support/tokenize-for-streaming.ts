/**
 * 답을 스트리밍 흉내용 조각으로 나눈다.
 *
 * ⚠️ **강조·링크·코드는 통째로 한 조각이다.** 낱말 단위로 잘라 흘리면 `**중요**`가
 *    `**중요` 상태로 한 틱 동안 별표가 그대로 보이다가 닫힌다 — 지나가는 깜빡임이지만
 *    안 예쁘다. 그 구간은 조각을 안 쪼개서 닫힌 채로 한 번에 나타나게 한다.
 * ⚠️ 나머지는 **낱말·공백 단위**로 쪼갠다. 문장 전체를 한 조각으로 두면 "스트리밍"이
 *    아니라 그냥 지연 로딩처럼 보인다.
 */
// ⚠️ **삼중 백틱 코드 블록을 먼저 매치**한다. 안 그러면 여는 ```가 인라인 `…`로 걸려
//    블록이 여러 조각으로 쪼개져 나온다 — 한 덩어리로 렌더돼야 하는 구간이라 지킨다.
const ATOMIC_MARKDOWN =
  /(```[\s\S]*?```|\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/;

function splitPlainText(text: string): string[] {
  return text.split(/(\n\n|\s+)/).filter((part) => part !== "");
}

export function tokenizeForStreaming(markdown: string): string[] {
  const parts = markdown.split(ATOMIC_MARKDOWN);
  const chunks: string[] = [];

  parts.forEach((part, index) => {
    if (!part) return;
    // ATOMIC_MARKDOWN에 걸린 캡처 그룹은 홀수 자리에 온다(String.split 규약).
    if (index % 2 === 1) {
      chunks.push(part);
    } else {
      chunks.push(...splitPlainText(part));
    }
  });

  return chunks;
}
