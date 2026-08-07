import type { ActionStatus } from "@/constants/action";
import type { MeetingStatus } from "@/constants/meeting";

import type { MeetingTopic } from "./types";

/**
 * 회의 화면의 **UI 계약**(`/app/meeting`).
 *
 * ⚠️ 같은 폴더의 `types.ts`는 **저장되는 회의 한 건**(예약이 만드는 레코드)이고, 여기는
 *    화면이 받는 모양이다. 파일을 나눈 건 화면이 저장 모양을 알면 봉투가 바뀔 때 전 화면을
 *    고쳐야 하기 때문이다(§Mock 격리막) — 옮기는 일은 `server.ts` 한 곳이 한다.
 */

/** 목록 카드 한 장 */
export interface MeetingListItem {
  id: string;
  title: string;
  status: MeetingStatus;
  projectTag: string;
  /**
   * 소속 라벨 — Owner 개설이면 `Owner 개설`(WORKFLOW §2 — 옛 문구 "프로젝트 공통"은 폐기),
   * 팀 액션 회의면 상위 팀 액션 이름이다.
   */
  originLabel: string;
  /** 안건 첫 쌍 요약(`대주제 · 소주제`) — 카드에서 무슨 회의인지 한 줄로 알린다 */
  topicSummary: string;
  /** `7월 14일(화) 10:00 – 10:30` — 서버가 우리 표기로 만들어 보낸다(§lib) */
  schedule: string;
  roomName: string;
  attendeeCount: number;
  /**
   * 보는 사람이 이 회의의 Host인가.
   *
   * ⚠️ [입장]은 **Host에게만** 뜬다(WORKFLOW §3-2 — 시간 제약 없음). 참석자에게는 예정·진행중
   *    카드가 눌러도 반응이 없다(입장 개념 없음). 완료 카드만 상세로 간다.
   */
  isHost: boolean;
}

/** 목록 — 탭 두 개가 이 화면의 전부다(WORKFLOW §3-2) */
export interface MeetingDirectory {
  /** 내가 개설한 */
  hosted: MeetingListItem[];
  /** 참여해야 할 — 참석자로 지정됐고 내가 Host가 아닌 회의 */
  invited: MeetingListItem[];
}

/** 발화 기록 한 토막 — **화자 구분 없이 청크 단위**다(WORKFLOW §3-2) */
export interface ScriptChunk {
  /** 회의 안에서의 시각 `HH:MM` */
  at: string;
  text: string;
}

/**
 * 산출물 한 줄 — 이 회의에서 하달된 액션.
 *
 * ⚠️ 회의 종류에 따라 **다른 것**이 담긴다(§2·§5): Owner 개설 회의는 팀 액션(담당 팀명),
 *    팀 액션 회의는 개인 액션(담당자 이름). `assignee`가 그 자리다.
 * ⚠️ `href`는 실제 상세로 간다 — 라벨은 전부 클릭 가능해야 한다(§12: 순환 추적).
 */
export interface MeetingOutput {
  id: number;
  name: string;
  /** 팀 액션이면 담당 팀명, 개인 액션이면 담당자 이름 */
  assignee: string;
  status: ActionStatus;
  /** 마감일 `YYYY-MM-DD` */
  dueDate: string;
  href: string;
}

/** 상세 참석자 한 명 — 아바타 색은 id에서 나온다(§DESIGN 5) */
export interface MeetingAttendee {
  id: number;
  name: string;
}

/** 회의 상세 — **완료 회의만** 여기까지 온다(§3-2) */
export interface MeetingDetail {
  id: string;
  title: string;
  projectId: number;
  projectTag: string;
  originLabel: string;
  /** 팀 액션 회의면 그 팀 액션 상세로 가는 링크 — Owner 개설이면 없다 */
  parentTeamActionHref: string | null;
  topics: MeetingTopic[];
  schedule: string;
  roomName: string;
  attendees: MeetingAttendee[];
  /** 산출물 머리말 — Owner 개설이면 `팀 액션`, 팀 액션 회의면 `개인 액션` */
  outputKindLabel: string;
  outputs: MeetingOutput[];
  script: ScriptChunk[];
}

/**
 * 상세 조회 결과 — 못 여는 이유까지 값으로 돌려준다.
 *
 * ⚠️ 화면이 이유를 알아야 맞는 말을 한다: 없는 회의는 `notFound()`, 권한 없음은
 *    잠금(에러가 아니다 — §3-2-1), 완료 전은 "완료 후 열람" 안내다. 뭉뚱그려 null을 주면
 *    세 경우가 같은 화면이 된다.
 */
export type MeetingDetailResult =
  | { kind: "ok"; detail: MeetingDetail }
  | { kind: "locked"; title: string }
  | { kind: "notDone"; title: string; status: MeetingStatus }
  | { kind: "notFound" };

/**
 * 캡처 화면이 받는 것 — **Host가 회의를 진행하는 데 필요한 만큼만**(WORKFLOW §3-3).
 *
 * ⚠️ 산출물·스크립트를 안 싣는다. 캡처는 지금 만드는 중이라 아직 없는 값이고,
 *    상세(`MeetingDetail`)를 그대로 재사용하면 화면이 쓰지도 않는 걸 실어 나른다.
 */
export interface MeetingCaptureInfo {
  id: string;
  title: string;
  /** 이 회의가 어느 프로젝트 아래인지 — 제목 위 작은 줄 */
  projectTag: string;
  schedule: string;
  roomName: string;
  attendees: CaptureAttendee[];
}

/**
 * 캡처 화면의 참가자 한 줄 — 목록보다 한 겹 더 안다.
 *
 * ⚠️ 이름만으로는 회의 중에 누가 누군지 모른다. 옆자리 사람을 부르려면 **소속·직급**이
 *    같이 보여야 한다(피그마 참가자 레일).
 * ⚠️ 진행자를 표시한다 — 참석자 명단에서 **누가 녹음을 쥐고 있는지**가 드러나야 한다.
 */
export interface CaptureAttendee extends MeetingAttendee {
  /** `개발팀 · 팀장` — 없으면 빈 문자열 */
  subtitle: string;
  isHost: boolean;
}

/**
 * 캡처 진입 결과 — 못 들어가는 이유를 값으로 돌려준다.
 *
 * ⚠️ **Host만 들어간다**(§3-3 "Host 전용. Attendee용 캡처 레이아웃 없음"). 참석자에게는
 *    입장 개념이 없어서 잠금이 아니라 **아예 다른 말**이 필요하다.
 * ⚠️ 이미 끝난 회의도 못 들어간다 — 종료는 되돌릴 수 없다(§3-3 종료 정책).
 */
export type MeetingCaptureResult =
  | { kind: "ok"; meeting: MeetingCaptureInfo }
  | { kind: "notHost"; title: string }
  | { kind: "alreadyDone"; title: string }
  | { kind: "notFound" };
