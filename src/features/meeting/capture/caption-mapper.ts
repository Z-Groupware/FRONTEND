import { formatRecordedTime } from "./phase";
import type { LiveCaption } from "./types";

/**
 * BE 자막 → 화면 자막.
 *
 * ⚠️ **서버·클라이언트 양쪽이 쓴다.** 백필(CAP-12)은 서버 컴포넌트가, 실시간(CAP-13)은
 *    브라우저가 부른다 — 두 경로가 **같은 매퍼**를 써야 백필과 실시간 줄의 모양이 같다.
 *    그래서 `server-only`가 딸린 `server.ts`가 아니라 여기 있다.
 * ⚠️ **`id`를 `seq`만으로 만들지 않는다.** `seq`는 (회의, **사람**)마다 0부터 다시 센다 —
 *    사람이 둘이면 `0`이 두 개다. 리스트 키가 겹치면 화면이 엉뚱한 줄을 재사용하고,
 *    중복 거르기(§목록)도 엉뚱한 것을 지운다.
 */
export function toLiveCaption(caption: {
  seq: number;
  personId: number | null;
  startMs: number;
  text: string;
}): LiveCaption {
  return {
    id: `caption-${caption.personId ?? "unknown"}-${caption.seq}`,
    at: formatRecordedTime(caption.startMs),
    atMs: caption.startMs,
    text: caption.text,
    personId: caption.personId,
  };
}
