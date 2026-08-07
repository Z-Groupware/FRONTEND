import { MEETING_STATUS, type MeetingStatus } from "@/constants/meeting";

import type { Meeting } from "./types";

/**
 * 회의 상태 — **완료만 저장이고 나머지는 계산**이다(CLAUDE.md §도메인 상수: 파생값은 계산).
 *
 * ⚠️ **끝나는 시각이 지나도 완료가 아니다.** 완료는 Host가 [회의 종료 및 제출]을 눌러야
 *    된다(WORKFLOW §3-3 — 그래서 되돌릴 수 없다). 예약한 30분이 지났는데 안 눌렀으면
 *    그 회의는 아직 **진행중**이다 — 실제로 회의가 길어진 것일 수 있고, 여기서 멋대로
 *    완료로 돌리면 스크립트도 산출물도 없는 회의가 "완료 카드"로 열린다.
 * ⚠️ `now`를 인자로 받는다 — 안에서 `new Date()`를 부르면 테스트가 시각을 못 잡는다.
 */
export function meetingStatusOf(
  meeting: Pick<Meeting, "start" | "endedAt">,
  now: Date,
): MeetingStatus {
  if (meeting.endedAt !== null) return MEETING_STATUS.DONE;
  if (now < meeting.start) return MEETING_STATUS.SCHEDULED;
  return MEETING_STATUS.IN_PROGRESS;
}
