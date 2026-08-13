import { useEffect, useMemo, useState } from "react";

import { useMediaQuery } from "@/hooks/use-media-query";

import { tokenizeForStreaming } from "./tokenize-for-streaming";

const CHUNK_INTERVAL_MS = 45;

/**
 * 답이 서버에서 흘러오는 것처럼 청크 단위로 흘려 보여준다.
 *
 * ⚠️ **연출이다.** 답은 이미 번들 안에 다 있다(`SupportWidget` §서버를 부르지 않는다) —
 *    진짜로 스트리밍되는 게 아니라, 다 가진 답을 조금씩 흘려서 보여줄 뿐이다.
 *    화면 문구("자주 묻는 질문에서 찾아드립니다")가 이미 AI·서버가 아니라고 말하고 있으니
 *    이 연출이 그 말을 뒤집지는 않는다.
 * ⚠️ **모션을 줄여 달라는 사람에게는 안 건다**(`prefers-reduced-motion`) — 켜자마자
 *    전부 보여준다(§smooth-scroll과 같은 판단).
 */
export function useStreamedMarkdown(content: string) {
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const chunks = useMemo(() => tokenizeForStreaming(content), [content]);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;

    let count = 0;
    const id = window.setInterval(() => {
      count += 1;
      setRevealed(count);
      if (count >= chunks.length) window.clearInterval(id);
    }, CHUNK_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [chunks, reduceMotion]);

  /* 모션을 줄여 달라는 사람 · 아직 안 흐른 첫 틱에는 다 보여준 값으로 대체한다 */
  const effectiveRevealed = reduceMotion ? chunks.length : revealed;

  return {
    text: chunks.slice(0, effectiveRevealed).join(""),
    isStreaming: !reduceMotion && effectiveRevealed < chunks.length,
  };
}
