import { formatMeetingSchedule } from "./lib";
import type { CaptureAttendee, MeetingCaptureInfo } from "./view-types";

/**
 * BE shape → 화면 계약(§Mock 격리막).
 *
 * 컴포넌트는 `view-types.ts`만 안다 — BE가 필드 이름을 바꾸면 **이 파일 한 곳**을 고친다.
 *
 * 🔴 **가정 shape·미검증이다.** BE 레포 실코드로 대조하지 못했다(2026-08-11 — 회의 도메인
 *    컨트롤러를 못 봤다). `lib/endpoints.ts`의 회의 구역도 유일하게 `[확인]` 표시가 없는
 *    자리다. 담당자 문서나 컨트롤러를 보는 즉시 **여기와 `BeMeetingDetail`만** 고치면 된다 —
 *    `server.ts`와 화면은 손댈 것이 없다(§연동 검증).
 */

/**
 * `GET /api/meetings/{id}` 응답 — **가정**이다.
 *
 * ⚠️ 캡처 화면이 실제로 쓰는 필드만 적는다. 회의 상세(산출물·스크립트)는 다른 담당자 몫이라
 *    여기서 넓히지 않는다 — 안 쓰는 필드를 적어 두면 그것도 검증된 것처럼 읽힌다.
 * ⚠️ `endedAt`이 상태의 정본이다(§types: 완료는 계산할 수 없다, Host가 눌러야 완료다).
 *    BE가 `status` 문자열만 준다면 그때 이 타입과 아래 `isEnded`를 같이 고친다.
 */
export interface BeMeetingDetail {
  meetingId: number;
  title: string;
  projectTag: string;
  /** ISO 8601 */
  startAt: string;
  endAt: string;
  roomName: string;
  /** 개설자 — 캡처 권한의 기준(권한 ②축: 리소스 소유권) */
  hostId: number;
  /** 종료를 누른 시각. 안 눌렀으면 `null` */
  endedAt: string | null;
  attendees: BeMeetingAttendee[];
}

export interface BeMeetingAttendee {
  memberId: number;
  name: string;
  /** 팀이 없는 사람(대표)은 `null`이다 */
  teamName: string | null;
  position: string | null;
}

/** 종료된 회의인가 — 되돌릴 수 없어서 캡처로 다시 못 들어간다(WORKFLOW §3-3) */
export function isEnded(detail: Pick<BeMeetingDetail, "endedAt">): boolean {
  return detail.endedAt !== null;
}

/**
 * 캡처 화면이 받을 값.
 *
 * ⚠️ 시각은 **여기서 우리 표기로 굳힌다**(`8월 14일(금) 10:00 – 10:30`). 화면이 ISO를 받아
 *    직접 포맷하면 목·실서버가 서로 다른 문자열을 그린다.
 * ⚠️ 소속·직급은 가운뎃점으로 잇되 **빈 조각은 버린다** — 팀이 없는 대표에게 ` · 대표`처럼
 *    앞이 빈 줄이 남으면 명단이 어긋나 보인다(목 경로와 같은 규칙).
 */
export function toMeetingCaptureInfo(detail: BeMeetingDetail): MeetingCaptureInfo {
  return {
    id: String(detail.meetingId),
    title: detail.title,
    projectTag: detail.projectTag,
    schedule: formatMeetingSchedule(new Date(detail.startAt), new Date(detail.endAt)),
    roomName: detail.roomName,
    attendees: detail.attendees.map((attendee) => toCaptureAttendee(attendee, detail.hostId)),
  };
}

function toCaptureAttendee(attendee: BeMeetingAttendee, hostId: number): CaptureAttendee {
  return {
    id: attendee.memberId,
    name: attendee.name,
    subtitle: [attendee.teamName, attendee.position].filter(Boolean).join(" · "),
    isHost: attendee.memberId === hostId,
  };
}
