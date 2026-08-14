/**
 * 비대면 회의 생성(`POST /api/meetings/online`, MEET-18) BE shape → UI 계약(이슈 #473).
 * [확인] 도메인 담당자 문서(2026-08-14, 팀 확정) 기준 — BE 실코드는 아직 대조 전이다
 *   (§연동 검증: Swagger·구두 추측 금지, 문서와 코드가 다르면 코드가 맞다 — 구현 시 컨트롤러로 재확인).
 * ⚠️ `rooms/mapper/meetings.ts`의 `toCreateMeetingPayload`/`toSentTopics`와 같은 자리 나눔이다 —
 *    회의실·시간 필드만 없을 뿐 안건 접기 규칙은 같다.
 */

import type { MeetingTopicInput } from "../../rooms/types";
import type { OnlineMeetingDraft } from "../types";

/**
 * `POST /api/meetings/online`(MEET-18) 요청 본문.
 * ⚠️ `recordingConsent`는 **아예 안 싣는다** — 서버가 항상 `true`로 고정한다고 팀이 확정했다
 *    (2026-08-14). 보내 봐야 서버가 무시하는 값이라, 보내는 척하면 거짓 UI다(§정직한 목업).
 * ⚠️ `relatedActionId`: `parentTeamActionId`가 같은 개념이라 그대로 싣는다 — MEET-01과 같은 이름 매핑.
 * ⚠️ `meetingRoomId`·`startAt`·`endAt`이 **아예 없다**(옵셔널이 아니라 필드 자체가 없다) — 비대면
 *    회의는 회의실·시간을 안 받는다(팀 명세).
 */
export interface BeCreateOnlineMeetingPayload {
  title: string;
  projectId: number;
  relatedActionId?: number;
  attendeeMemberIds: number[];
  mainTopic: string;
  subTopics: string[];
}

/**
 * 계약이 실제로 받는 안건 모양(대주제 1개 + 소주제 여러 개)으로 좁힌다 — `rooms/mapper/meetings.ts`의
 * `toSentTopics`와 같은 규칙(§정직성: 버려진 값을 저장된 것처럼 보이면 안 된다). 회의실 예약과
 * 안건 UI가 같은 모양(`MeetingTopicInput`)을 쓰기 때문에 접는 방식도 같아야 한다.
 */
function toSentTopics(topics: MeetingTopicInput[]): { mainTopic: string; subTopics: string[] } {
  return {
    mainTopic: topics[0]?.main.trim() ?? "",
    subTopics: topics.map((topic) => topic.sub.trim()).filter((sub) => sub.length > 0),
  };
}

export function toCreateOnlineMeetingPayload(
  draft: OnlineMeetingDraft,
): BeCreateOnlineMeetingPayload {
  const { mainTopic, subTopics } = toSentTopics(draft.topics);
  return {
    title: draft.title.trim(),
    projectId: Number(draft.projectId),
    relatedActionId: draft.parentTeamActionId,
    attendeeMemberIds: draft.attendeeIds,
    mainTopic,
    subTopics,
  };
}

/**
 * `POST /api/meetings/online` 성공 응답 — [확인] 도메인 담당자 문서(2026-08-14).
 * ⚠️ `status`는 실제로 항상 `"DONE"`이다 — 비대면 회의는 만들어지는 순간 이미 완료다(팀 확정,
 *    `mock/meetings.ts`의 `addMockOnlineMeeting`과 같은 규칙). `meetingRoom`·`startAt`·`endAt`은
 *    응답에 아예 없다.
 */
export interface BeCreateOnlineMeetingResponse {
  meetingId: number;
  status: "DONE";
  title: string;
  isOnline: true;
  recordingConsent: true;
  host: { memberId: number; name: string };
  attendees: { memberId: number; name: string; teamName?: string }[];
}
