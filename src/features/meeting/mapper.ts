/**
 * BE shape → UI 계약(§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`만 쓴다.
 * [확인] D도메인 REST API 명세(2026-08-12) 대조.
 */

import type { DashboardMeeting } from "@/components/common/dashboard-meeting-item";
import { isMeetingStatus, MEETING_STATUS } from "@/constants/meeting";

import { formatMeetingSchedule } from "./lib";
import type {
  CaptureAttendee,
  MeetingCaptureInfo,
  MeetingContentPending,
  MeetingDetail,
  MeetingListItem,
} from "./view-types";

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
 * `GET /api/meetings/dashboard`(MEET-17, 구현 완료) 목록 원소.
 * [확인] `meeting/presentation/api/response/DashboardMeetingListResponse.java`(2026-08-13).
 *
 * ⚠️ 위의 MEET-03과 **모양이 다르다.** 이쪽은 대시보드 카드가 그리는 그대로 평평하게 오고
 *    (`projectTag`·`room`), 라벨 2단(`originLabel`·`hostLabel`)도 서버가 이미 정해서 준다.
 * ⚠️ **둘 다 `null`로 올 수 있다.** `scope=team`의 `originLabel`은 명세에 정의가 없어 BE가
 *    비워 두고, `hostLabel`("(팀장)" 표기)은 팀 배치 조회 계약이 붙기 전까지 항상 `null`이다
 *    (BE `DashboardMeetingQueryService` 클래스 주석) — 없으면 화면이 배지를 안 그린다.
 */
export interface BeDashboardMeeting {
  meetingId: number;
  title: string;
  projectTag: string;
  status: string;
  room: string;
  scheduledAt: string;
  attendeeCount: number;
  originLabel: string | null;
  hostLabel: string | null;
}

/**
 * 대시보드 "최근 회의" 위젯 한 줄로 바꾼다.
 *
 * ⚠️ `null`은 **키째로 뺀다**(`?? undefined`가 아니라 조건부 전개). `DashboardMeeting`의 두
 *    라벨은 선택 필드라 값이 없으면 배지를 안 그리는데, `null`을 그대로 실으면 타입이 안 맞는다.
 */
export function toDashboardMeetingCard(be: BeDashboardMeeting): DashboardMeeting {
  if (!isMeetingStatus(be.status)) {
    throw new Error(`알 수 없는 회의 상태입니다: ${be.status}`);
  }

  return {
    id: String(be.meetingId),
    title: be.title,
    projectTag: be.projectTag,
    status: be.status,
    room: be.room,
    scheduledAt: be.scheduledAt,
    attendeeCount: be.attendeeCount,
    ...(be.originLabel === null ? {} : { originLabel: be.originLabel }),
    ...(be.hostLabel === null ? {} : { hostLabel: be.hostLabel }),
  };
}

/** 응답 봉투 안쪽 — 결과가 없어도 `meetings`는 빈 배열로 온다(BE가 `List.copyOf`로 보장). */
export function parseDashboardMeetings(raw: unknown): BeDashboardMeeting[] {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("대시보드 최근 회의 응답이 약속한 모양이 아닙니다.");
  }
  const meetings = (raw as { meetings?: unknown }).meetings;
  if (!Array.isArray(meetings) || !meetings.every(isBeDashboardMeeting)) {
    throw new Error("대시보드 최근 회의 응답이 약속한 모양이 아닙니다.");
  }
  return meetings;
}

function isBeDashboardMeeting(value: unknown): value is BeDashboardMeeting {
  if (typeof value !== "object" || value === null) return false;
  const meeting = value as Partial<BeDashboardMeeting>;

  return (
    typeof meeting.meetingId === "number" &&
    typeof meeting.title === "string" &&
    typeof meeting.projectTag === "string" &&
    typeof meeting.status === "string" &&
    typeof meeting.room === "string" &&
    typeof meeting.scheduledAt === "string" &&
    typeof meeting.attendeeCount === "number" &&
    (meeting.originLabel === null || typeof meeting.originLabel === "string") &&
    (meeting.hostLabel === null || typeof meeting.hostLabel === "string")
  );
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
 * `GET /api/meetings`(MEET-02, 구현 완료) 목록 한 행.
 * [확인] `meeting/presentation/api/response/MeetingListResponse.java`(2026-08-13).
 *
 * ⚠️ **카드가 실제로 쓰는 필드만 적는다**(`BeMeetingDetail`과 같은 원칙). 응답에는
 *    `actionCount`·`entryAvailable`·`durationMinutes`·`attendees[]`·`project.name`도 오지만
 *    목록 카드가 그리지 않는다 — 적어 두면 화면이 의존하는 값처럼 읽힌다.
 * ⚠️ **`isHost`가 이 연동의 핵심이다.** 보는 사람이 개설자인지 알 방법이 없어 두 탭
 *    (내가 개설한 / 참여해야 할)이 막혀 있었다(백엔드 요청 §10-A → `isHost`로 도착).
 * ⚠️ **`summaryStatus`가 없다.** 상세(MEET-04)에만 있어서 Host 카드의 [액션 검토] 노출을
 *    목록에서 판정할 수 없다 — 지어내지 않는다(`toMeetingListItem` 참고).
 */
export interface BeMeetingListItem {
  meetingId: number;
  title: string;
  /** `SCHEDULED` · `IN_PROGRESS` · `DONE` · `CANCELED` (BE `MeetingStatus`) */
  status: string;
  /** `2026-08-14T10:00:00` — 오프셋이 없다(`BeMeetingDetail.startAt`의 경고가 그대로 적용된다) */
  startAt: string;
  endAt: string;
  attendeeCount: number;
  /** 보는 사람이 이 회의의 개설자인가 — 탭을 가르는 값이다 */
  isHost: boolean;
  meetingRoom: { meetingRoomId: number; name: string };
  project: { projectId: number; tag: string };
}

/**
 * 목록 응답에서 회의 배열만 꺼낸다 — **`page`는 안 쓴다.**
 *
 * ⚠️ 응답에는 `page{page,size,totalElements,totalPages}`가 함께 오지만 이 화면엔 아직 무한
 *    스크롤도 전체 건수 표기도 없다(§목록은 별도 이슈) — 안 쓰는 값을 계약에 적지 않는다.
 * ⚠️ 검사 이유는 `parseMeetingDetail`과 같다 — `serverApi<T>`는 단언일 뿐 검사가 아니다.
 */
export function parseMeetingList(raw: unknown): BeMeetingListItem[] {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("회의 목록 응답이 약속한 모양이 아닙니다.");
  }
  const meetings = (raw as { meetings?: unknown }).meetings;
  if (!Array.isArray(meetings) || !meetings.every(isBeMeetingListItem)) {
    throw new Error("회의 목록 응답이 약속한 모양이 아닙니다.");
  }
  return meetings;
}

function isBeMeetingListItem(value: unknown): value is BeMeetingListItem {
  if (typeof value !== "object" || value === null) return false;
  const meeting = value as Partial<BeMeetingListItem>;

  return (
    typeof meeting.meetingId === "number" &&
    typeof meeting.title === "string" &&
    typeof meeting.status === "string" &&
    typeof meeting.startAt === "string" &&
    typeof meeting.endAt === "string" &&
    typeof meeting.attendeeCount === "number" &&
    typeof meeting.isHost === "boolean" &&
    typeof meeting.meetingRoom?.name === "string" &&
    typeof meeting.project?.tag === "string"
  );
}

/**
 * 목록 카드 한 장으로 바꾼다.
 *
 * ⚠️ **`aiSummaryStatus`를 `null`로 둔다.** MEET-02 응답에 요약 상태가 없다 — 지어내면
 *    Host 카드에 [액션 검토]가 잘못 뜨거나 사라진다(§정직성). `null`이면 완료 카드가
 *    [회의록]으로만 열린다(`meetingCardAffordanceOf` — `review`는 `REVIEWED`일 때만).
 *    **BE가 목록에 `summaryStatus`를 실어 주면 그때 이 한 줄만 고친다.**
 * ⚠️ **`originLabel`·`topicSummary`도 비운다.** 소속 라벨(Owner 개설 / 상위 팀 액션 이름)과
 *    안건은 목록 응답에 없다 — 프로젝트 이름 같은 다른 값으로 메우면 뜻이 다른 말이 된다.
 *    카드는 빈 조각을 가운뎃점째 빼고 그린다(`meeting-card.tsx`).
 */
export function toMeetingListItem(be: BeMeetingListItem): MeetingListItem {
  if (!isMeetingStatus(be.status)) {
    throw new Error(`알 수 없는 회의 상태입니다: ${be.status}`);
  }

  return {
    id: String(be.meetingId),
    title: be.title,
    status: be.status,
    projectTag: be.project.tag,
    originLabel: "",
    topicSummary: "",
    schedule: formatMeetingSchedule(new Date(be.startAt), new Date(be.endAt)),
    roomName: be.meetingRoom.name,
    attendeeCount: be.attendeeCount,
    isHost: be.isHost,
    aiSummaryStatus: null,
  };
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
  /**
   * 확정 전 AI 액션 초안 건수 — 종료되지 않은 회의는 서버가 조회 없이 `0`으로 확정한다
   * (BE `MeetingDetailQueryService.resolvePendingActionCount`).
   */
  pendingActionCount: number;
  /**
   * 요약 진행 신호(BE `MeetingSummaryStatus`) — `NONE` · `PROCESSING` · `DONE` · `STALLED`.
   *
   * ⚠️ **`null`이 정상값이다.** 회의가 끝났고 중단도 아니면 BE도 `PROCESSING`인지 `DONE`인지
   *    모른다(A가 아직 안 갈라 준다) — 추측해 내려보내지 않으려고 `null`을 준다(BE enum 주석).
   *    우리도 그 `null`을 "다 됐다"로 읽지 않는다(`meetingPendingReasonOf` 참고).
   */
  summaryStatus: string | null;
  project: { projectId: number; tag: string };
  meetingRoom: { meetingRoomId: number; name: string };
  host: { memberId: number; name: string };
  attendees: BeMeetingAttendee[];
}

/** BE `MeetingSummaryStatus` — 화면 상수(`AI_SUMMARY_STATUS`)와 어휘가 달라 여기서만 쓴다. */
const BE_SUMMARY_STATUS = {
  NONE: "NONE",
  PROCESSING: "PROCESSING",
  DONE: "DONE",
  STALLED: "STALLED",
} as const;

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
    typeof detail.pendingActionCount === "number" &&
    (detail.summaryStatus === null || typeof detail.summaryStatus === "string") &&
    typeof detail.project?.projectId === "number" &&
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

/**
 * 산출물·발화 기록을 **아직 못 보여주는 이유**(§view-types `MeetingContentPending`).
 *
 * ⚠️ **순서가 있다.** 회의가 안 끝났으면 요약은 시작조차 안 했으므로 회의 상태를 먼저 본다 —
 *    목 경로(`server.ts`)와 같은 차례라야 같은 회의가 두 경로에서 다른 말을 하지 않는다.
 * ⚠️ **`summaryStatus === null`을 "다 됐다"로 읽지 않는다.** BE는 그 값을 "끝났지만
 *    `PROCESSING`인지 `DONE`인지 모른다"는 뜻으로 준다(BE enum 주석) — 모르는 걸 완료로
 *    바꿔 읽으면 화면이 "하달된 액션이 없습니다"라고 **단정**한다(§정직성).
 * ⚠️ 단 **확정 대기 건수가 있으면 요약은 끝난 것**이다 — 초안이 나왔다는 증거라서, 그때는
 *    "요약 중"이 아니라 검토 대기 안내를 띄운다(`actionsSectionStateOf`).
 */
export function meetingPendingReasonOf(
  detail: Pick<BeMeetingDetail, "status" | "summaryStatus" | "pendingActionCount">,
): MeetingContentPending | null {
  if (detail.status === MEETING_STATUS.CANCELED) return "CANCELED";
  if (detail.status === MEETING_STATUS.SCHEDULED) return "SCHEDULED";
  if (detail.status === MEETING_STATUS.IN_PROGRESS) return "IN_PROGRESS";

  if (detail.summaryStatus === BE_SUMMARY_STATUS.STALLED) return "FAILED";
  /*
    ⚠️ **확정 대기 건수를 상태값보다 먼저 본다**(2026-08-13, 코드래빗 지적). 예전엔
       `summaryStatus === null`일 때만 이 규칙을 걸어서, 초안이 이미 나왔는데 상태가
       `PROCESSING`이면 화면이 검토 대기 대신 **"요약 중"**을 말했다 — 윗 주석대로 초안은
       요약이 끝났다는 증거라 어떤 상태값보다 강한 신호다.
    ⚠️ 중단(`STALLED`)만 그 앞에 둔다 — 뒤 계층이 깨진 회의는 [다시 분석]부터 안내해야 한다.
  */
  if (detail.pendingActionCount > 0) return null;
  if (detail.summaryStatus === BE_SUMMARY_STATUS.DONE) return null;
  /* ⚠️ 끝난 회의에 `NONE`이 오면 계약이 어긋난 것이다 — 완료로 읽지 말고 아직 안 된 쪽으로 둔다 */
  return "SUMMARIZING";
}

/**
 * 회의 상세 화면이 받을 값 — **권한 판정은 여기서 하지 않는다**(`hostIdOf`와 같은 이유).
 * 개설자인지는 `lib/permission.ts`의 `canOperateMeeting`이 정하고 결과만 `isHost`로 받는다.
 *
 * ⚠️ **MEET-04가 안 주는 칸은 비워 둔다**(§정직성 — 지어내지 않는다). 각각 왜 비는지:
 *    - `originLabel`·`parentTeamActionHref`: 응답에 개설자의 권한(Owner 개설인가)도 상위 팀
 *      액션도 없다. `host.name`으로 메우면 **뜻이 다른 값**이 그 자리에 앉는다(그건 소속
 *      라벨이 아니라 사람 이름이다).
 *    - `topics`: 안건이 응답에 아예 없다. 회의 예약 때 입력받은 값인데 상세로 안 나온다.
 *    - `outputs`·`script`: 다른 API(`GET /api/meetings/{id}/actions` · CAP-12 자막 조회)가
 *      줄 값이라 이 연동 범위 밖이다. **빈 배열이 아니라 `null`이다** — 빈 배열로 두면 화면이
 *      "하달된 액션이 없습니다"·"발화 기록이 없습니다"라고 **안 물어본 것을 단정한다**.
 *    - `outputKindLabel`: 팀 액션인지 개인 액션인지는 개설자 권한에서 갈리는데 그 값이 없다 —
 *      둘 중 하나로 찍지 않고 상위어인 `액션`으로 둔다.
 */
export function toMeetingDetailView(
  be: BeMeetingDetail,
  options: { isHost: boolean },
): MeetingDetail {
  return {
    id: String(be.meetingId),
    title: be.title,
    projectId: be.project.projectId,
    projectTag: be.project.tag,
    originLabel: "",
    parentTeamActionHref: null,
    topics: [],
    schedule: formatMeetingSchedule(new Date(be.startAt), new Date(be.endAt)),
    roomName: be.meetingRoom.name,
    attendees: be.attendees.map((attendee) => ({ id: attendee.memberId, name: attendee.name })),
    outputKindLabel: "액션",
    outputs: null,
    script: null,
    pendingReason: meetingPendingReasonOf(be),
    pendingActionCount: be.pendingActionCount,
    isStalled: be.summaryStatus === BE_SUMMARY_STATUS.STALLED,
    isHost: options.isHost,
  };
}
