import { formatMeetingSchedule } from "./lib";
import type { CaptureAttendee, MeetingCaptureInfo } from "./view-types";

/**
 * BE shape → 화면 계약(§Mock 격리막).
 *
 * 컴포넌트는 `view-types.ts`만 안다 — BE가 필드 이름을 바꾸면 **이 파일 한 곳**을 고친다.
 *
 * [확인] BE 실코드 대조(2026-08-11, `Z-Groupware/BACKEND@4e45c54`)
 *   `meeting/presentation/api/MeetingDetailController.java` (MEET-04)
 *   `meeting/presentation/api/response/MeetingDetailResponse.java`
 */

/**
 * `GET /api/v1/meetings/{meetingId}` 응답(MEET-04).
 *
 * ⚠️ **캡처 화면이 실제로 쓰는 필드만 적는다.** 응답에는 `recordingConsent`·`createdAt`·
 *    `project.name`·`project.color`·`meetingRoom.location`도 오지만, 안 쓰는 필드를 적어 두면
 *    그것도 화면이 의존하는 값처럼 읽힌다.
 * ⚠️ **중첩이다.** 태그·회의실·개설자가 전부 객체 안에 있다 — 평평한 `projectTag`·`roomName`·
 *    `hostId`가 아니다(연동 전 우리가 가정했던 모양이 이랬다).
 */
export interface BeMeetingDetail {
  meetingId: number;
  title: string;
  /** `SCHEDULED` · `IN_PROGRESS` · `DONE` · `CANCELED` (BE `MeetingStatus`) */
  status: string;
  /**
   * `2026-08-14T10:00:00` — **오프셋이 없다**(BE가 KST를 그대로 찍는다).
   *
   * ⚠️ 오프셋 없는 문자열은 JS가 **그 프로세스의 시간대**로 읽는다. 우리 서버는
   *    `next.config.ts`가 `TZ=Asia/Seoul`을 박아 두어 맞아떨어진다 — 배포에서 TZ를
   *    덮어쓰면 회의 시각이 통째로 밀린다(배포 전달사항).
   */
  startAt: string;
  endAt: string;
  project: { projectId: number; tag: string };
  meetingRoom: { meetingRoomId: number; name: string };
  host: { memberId: number; name: string };
  attendees: BeMeetingAttendee[];
}

export interface BeMeetingAttendee {
  memberId: number;
  name: string;
  /** 팀이 없는 사람(대표)은 `null`이다 */
  teamName: string | null;
  /** ⚠️ `position`이 아니라 `jobPosition`이다 */
  jobPosition: string | null;
}

/**
 * 녹음할 수 없는 회의인가 — 이유까지는 안 가른다.
 *
 * ⚠️ **`endedAt`이 아니라 `status`로 본다.** 응답에 `endedAt`도 오지만 상태의 정본은
 *    `status`다(BE `MeetingStatus`). 캡처 세션 시작(CAP-01)도 이 상태를 보고 막는다.
 * ⚠️ `CANCELED`도 여기서 걸러야 한다 — 취소된 회의는 녹음할 자리가 아닌데, 화면 계약에는
 *    아직 취소가 없어서 "이미 끝난 회의"와 같은 자리로 보낸다. 취소 화면이 생기면 그때 가른다.
 */
export function isClosed(detail: Pick<BeMeetingDetail, "status">): boolean {
  return detail.status === "DONE" || detail.status === "CANCELED";
}

/** 개설자인가 — 권한 ②축(리소스 소유권). 역할이 아니라 이 회의를 연 사람 한 명이다 */
export function isHostOf(detail: Pick<BeMeetingDetail, "host">, memberId: number): boolean {
  return detail.host.memberId === memberId;
}

/**
 * 캡처 화면이 받을 값.
 *
 * ⚠️ 시각은 **여기서 우리 표기로 굳힌다**(`8월 14일(금) 10:00 – 10:30`). 화면이 원문을 받아
 *    직접 포맷하면 목·실서버가 서로 다른 문자열을 그린다.
 * ⚠️ 소속·직급은 가운뎃점으로 잇되 **빈 조각은 버린다** — 팀이 없는 대표에게 ` · 대표`처럼
 *    앞이 빈 줄이 남으면 명단이 어긋나 보인다(목 경로와 같은 규칙).
 */
export function toMeetingCaptureInfo(detail: BeMeetingDetail): MeetingCaptureInfo {
  return {
    id: String(detail.meetingId),
    title: detail.title,
    projectTag: detail.project.tag,
    schedule: formatMeetingSchedule(new Date(detail.startAt), new Date(detail.endAt)),
    roomName: detail.meetingRoom.name,
    attendees: detail.attendees.map((attendee) =>
      toCaptureAttendee(attendee, detail.host.memberId),
    ),
  };
}

function toCaptureAttendee(attendee: BeMeetingAttendee, hostMemberId: number): CaptureAttendee {
  return {
    id: attendee.memberId,
    name: attendee.name,
    subtitle: [attendee.teamName, attendee.jobPosition].filter(Boolean).join(" · "),
    isHost: attendee.memberId === hostMemberId,
  };
}
