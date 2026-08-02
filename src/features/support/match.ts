import { FAQ_ENTRIES, type FaqEntry } from "./faq";

/**
 * 물어본 말에서 가장 가까운 항목을 찾는다.
 *
 * ⚠️ **AI가 아니다.** 키워드가 몇 개나 겹치는지 세는 게 전부다 — 대단한 척하지 않는다.
 * ⚠️ 못 찾으면 `null`이다. 억지로 제일 나은 걸 내놓지 않는다 — 고객센터에서 틀린 답은
 *    답이 없는 것보다 나쁘다(§정직성).
 * ⚠️ 화면(컴포넌트)이 아니라 여기서 판정한다. 로직이라 테스트가 붙는다(§테스트).
 */

/**
 * 이만큼은 겹쳐야 "찾았다"고 본다.
 *
 * ⚠️ 문턱이 없으면 **한 글자 우연**으로 엉뚱한 답이 나간다 — "오늘 점심 뭐 먹지"가
 *    제품 소개로 잡혔던 적이 있다. 짧은 말은 아무 문장에나 들어간다.
 */
const MIN_SCORE = 2;

/** 붙여 쓰든 띄어 쓰든 같게 본다 — "기업코드"와 "기업 코드"는 같은 말이다 */
function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, "");
}

/**
 * 겹치는 키워드 수를 센다.
 *
 * ⚠️ **긴 키워드에 가중치를 준다.** "코드"보다 "기업코드"가 걸리는 쪽이 정확하다 —
 *    짧은 말은 아무 문장에나 우연히 들어간다.
 */
function scoreOf(entry: FaqEntry, normalized: string) {
  return entry.keywords.reduce((sum, keyword) => {
    const target = normalize(keyword);
    return normalized.includes(target) ? sum + target.length : sum;
  }, 0);
}

export function findFaqAnswer(input: string): FaqEntry | null {
  const normalized = normalize(input);
  if (!normalized) return null;

  let best: FaqEntry | null = null;
  let bestScore = 0;

  for (const entry of FAQ_ENTRIES) {
    const score = scoreOf(entry, normalized);
    // 같은 점수면 먼저 적힌 것을 남긴다 — 순서가 곧 우선순위다
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return bestScore >= MIN_SCORE ? best : null;
}
