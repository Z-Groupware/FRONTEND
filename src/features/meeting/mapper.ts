/**
 * BE shape → UI 계약(§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`만 쓴다.
 * [확인] D도메인 REST API 명세(2026-08-12) 대조.
 */

import type { DashboardMeeting } from "@/components/common/dashboard-meeting-item";
import { isMeetingStatus } from "@/constants/meeting";

import { formatMeetingSchedule } from "./lib";
import type { CaptureAttendee, MeetingCaptureInfo } from "./view-types";

/**
 * `GET /api/meetings/upcoming`(MEET-03, 구현 완료) 목록 원소.
 * ⚠️ `project`엔 `name`·`color`도 오지만 이 위젯이 안 쓴다 — 안 쓰는 필드는 안 적는다
 *    (`BeMeetingDetail`과 같은 원칙).
 * ⚠️ 개설자(host) 이름·소속 라벨은 이 계약에 없다 — `isHost`(보는 사람이 host인가)뿐이라
 *    "누가 개설했는가"는 여기서 못 구한다(§mapper `toDashboardMeeting` 참고).
 */
export interface BeUpcomingMeeting {
  meetingId: number;
  title: string;
  status: string;
  startAt: string;
  endAt: string;
  attendeeCount: number;
  isHost: boolean;
  entryAvailable: boolean;
  meetingRoom: { meetingRoomId: number; name: string };
  project: { projectId: number; tag: string };
}

export interface BeUpcomingMeetingsResponse {
  meetings: BeUpcomingMeeting[];
}

/**
 * 대시보드 "참석 회의" 위젯(`DashboardMeetingItem`)이 받는 모양으로 바꾼다.
 * ⚠️ `originLabel`을 안 채운다 — 이 계약엔 개설자 소속(Owner 개설/팀명) 정보가 없다. 없는 값을
 *    지어내지 않는다(§정직성) — 화면은 그 값이 없으면 라벨을 그냥 안 그린다(`hostLabel`과
 *    같은 선택 필드로 취급).
 * ⚠️ `entryAvailable`·`isHost`는 지금 이 위젯에 [입장] 버튼이 없어(WORKFLOW.md §3-2, 목록
 *    화면의 카드에만 있음) 쓰지 않는다 — 화면에 없는 기능을 새로 만들지 않는다(§명세).
 */
export function toDashboardMeeting(be: BeUpcomingMeeting): DashboardMeeting {
  if (!isMeetingStatus(be.status)) {
    throw new Error(`알 수 없는 회의 상태입니다: ${be.status}`);
  }

  return {
    id: String(be.meetingId),
    title: be.title,
    projectTag: be.project.tag,
    status: be.status,
    room: be.meetingRoom.name,
    scheduledAt: be.startAt,
    attendeeCount: be.attendeeCount,
  };
}

/**
 * `PUT /api/meetings/{meetingId}/attendees`(MEET-09, 구현 완료) 요청·응답.
 * ⚠️ 응답에 참석자 명단이 실제로 온다 — 예전엔 "계약에 응답 shape이 없다"고 가정하고 방금
 *    보낸 값을 그대로 echo했는데, 명세가 확정되면서 서버가 돌려준 명단(호스트 자동 포함·중복
 *    제거가 이미 반영된 값)을 그대로 쓰는 쪽이 더 정확하다.
 */
export interface BeUpdateAttendeesResponse {
  meetingId: number;
  attendees: { memberId: number; name: string; teamName: string | null }[];
}

export function attendeeIdsFrom(response: BeUpdateAttendeesResponse): number[] {
  return response.attendees.map((attendee) => attendee.memberId);
}

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
 * `GET /api/meetings/{meetingId}` 응답(MEET-04).
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
 * 응답이 우리가 읽는 모양인가 — **읽기 전에 한 번 본다**(코드래빗 지적, 2026-08-11).
 *
 * ⚠️ `serverApi<BeMeetingDetail>`는 **단언일 뿐 검사가 아니다.** 봉투 모양이 어긋나거나 BE가
 *    부분 응답을 주면 `detail.host.memberId`에서 `undefined`를 파고들어 터지는데, 그때 뜨는
 *    건 원인을 알 수 없는 `TypeError`다 — 무엇이 어긋났는지 말해 주는 편이 낫다(§정직성).
 * ⚠️ **중첩이라 더 필요하다.** 평평한 응답은 값이 빠져도 `undefined`가 화면까지 흘러갈 뿐이지만,
 *    여기서는 한 겹 안을 바로 파고들기 때문에 없으면 그 자리에서 터진다.
 * ⚠️ **화면이 실제로 읽는 것만 본다.** 안 쓰는 필드까지 검사하면 BE가 무관한 필드를 바꿀 때마다
 *    멀쩡한 화면이 막힌다.
 */
function isBeMeetingDetail(value: unknown): value is BeMeetingDetail {
  if (typeof value !== "object" || value === null) return false;
  const detail = value as Partial<BeMeetingDetail>;

  return (
    typeof detail.meetingId === "number" &&
    typeof detail.title === "string" &&
    typeof detail.status === "string" &&
    typeof detail.startAt === "string" &&
    typeof detail.endAt === "string" &&
    typeof detail.project?.tag === "string" &&
    typeof detail.meetingRoom?.name === "string" &&
    typeof detail.host?.memberId === "number" &&
    Array.isArray(detail.attendees) &&
    detail.attendees.every(isBeMeetingAttendee)
  );
}

/**
 * 참석자 한 줄 — **배열인지만 보면 모자란다**(코드래빗 지적, 2026-08-11).
 *
 * ⚠️ `[null]`이나 모양이 다른 객체는 배열 검사를 그냥 통과하고, 나중에 명단을 그릴 때
 *    `TypeError`로 터진다 — 막을 자리는 응답을 받는 여기다.
 * ⚠️ 팀·직급은 **없을 수 있다**(팀 없는 대표). `null`은 정상이고 `undefined`나 숫자가 비정상이다.
 */
function isBeMeetingAttendee(value: unknown): value is BeMeetingAttendee {
  if (typeof value !== "object" || value === null) return false;
  const attendee = value as Partial<BeMeetingAttendee>;

  return (
    typeof attendee.memberId === "number" &&
    typeof attendee.name === "string" &&
    (attendee.teamName === null || typeof attendee.teamName === "string") &&
    (attendee.jobPosition === null || typeof attendee.jobPosition === "string")
  );
}

/**
 * 검사까지 마친 회의 상세 — 호출부는 이걸 통과한 값만 만진다.
 *
 * ⚠️ 던지는 건 **여기 한 곳**이다. 화면·`server.ts`가 각자 확인하면 조건이 갈린다(§격리막).
 */
export function parseMeetingDetail(raw: unknown): BeMeetingDetail {
  if (!isBeMeetingDetail(raw)) {
    throw new Error("회의 상세 응답이 약속한 모양이 아닙니다.");
  }
  return raw;
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

/**
 * 개설자 id만 꺼낸다 — **판정은 여기서 하지 않는다**(코드래빗 지적, 2026-08-11).
 *
 * ⚠️ 매퍼가 아는 건 "그 값이 응답 어디에 들어 있나"뿐이다. 들어갈 수 있냐 없냐는
 *    `lib/permission.ts`의 `canCaptureMeeting`이 정한다 — 권한 판정이 도메인마다
 *    흩어지면 화면과 서버가 서로 다른 기준을 쓴다(CLAUDE.md §권한).
 */
export function hostIdOf(detail: Pick<BeMeetingDetail, "host">): number {
  return detail.host.memberId;
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
