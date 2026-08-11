/**
 * 회의(Meeting) — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * ⚠️ **최소 스캐폴딩이다.** `/app/meeting`(목록·상세·캡처·AI 리뷰)은 별도 이슈다 — 지금은
 *    회의실 예약이 만드는 레코드 하나만 담는다(WORKFLOW.md §3-1: "회의실 예약 = 회의 개설"이
 *    하나의 동작이라, 예약만 저장하고 회의를 안 만들면 스펙과 어긋난다).
 */

import type { Authority } from "@/constants/authority";
import type { AiSummaryStatus } from "@/constants/meeting";

/** 회의 안건 대주제/소주제 한 쌍 — 자유 입력 텍스트다(고정 enum 아님, WORKFLOW.md §3-1). */
export interface MeetingTopic {
  main: string;
  sub: string;
}

interface MeetingCommon {
  title: string;
  start: Date;
  end: Date;
  roomId: string;
  roomName: string;
  /** ⚠️ 프로젝트 태그는 항상 필수다(WORKFLOW.md §3-1) — 프로젝트에 안 묶인 회의는 없다. */
  projectId: number;
  projectTag: string;
  /** 최소 1쌍(대주제+소주제) — 나머지는 "추가/삭제"로 늘고 준다. */
  topics: [MeetingTopic, ...MeetingTopic[]];
  attendeeIds: number[];
  /** 개설자 — 회의 조작 권한의 기준(권한 ②축, `lib/permission.ts`의 `canOperateMeeting`). */
  hostId: number;
  /** 이 회의를 만든 예약 — 같은 동작이라 항상 있다(WORKFLOW.md §3-1). */
  roomReservationId: string;
}

/**
 * Owner가 개설 = 프로젝트 회의(WORKFLOW.md §2·§3-1). "상위 팀 액션" 개념 자체가 없다 —
 * `hostTeamId`·`parentTeamActionId`는 아예 못 넣는다(타입으로 막는다).
 */
interface OwnerHostedMeeting extends MeetingCommon {
  hostAuthority: Extract<Authority, "OWNER">;
  hostTeamId?: undefined;
  parentTeamActionId?: undefined;
}

/**
 * Leader/Member가 개설 = 팀 액션 회의(WORKFLOW.md §5). 개설자의 소속 팀(`hostTeamId`)과
 * 상위 팀 액션(`parentTeamActionId`)이 **둘 다 필수**다 — 하나만 있는 회의는 만들 수 없다.
 */
interface TeamActionHostedMeeting extends MeetingCommon {
  hostAuthority: Extract<Authority, "LEADER" | "MEMBER">;
  hostTeamId: number;
  parentTeamActionId: number;
}

/** 회의 생성 입력 — id·createdAt은 서버(mock 스토어)가 채운다. */
export type MeetingDraft = OwnerHostedMeeting | TeamActionHostedMeeting;

/**
 * 회의 한 건 — `MeetingDraft`에 서버가 채우는 것들을 더한다.
 *
 * ⚠️ **`endedAt`은 상태를 저장하는 유일한 자리다.** 예정·진행중은 지금 시각과 `start`·`end`로
 *    계산하면 되지만(§도메인 상수: 파생값은 계산한다), **완료는 계산할 수 없다** —
 *    끝나는 시각이 지났다고 완료가 아니라 Host가 [회의 종료 및 제출]을 눌러야 완료다
 *    (WORKFLOW §3-3, 그래서 되돌릴 수도 없다). 안 누르고 끝난 회의는 시간이 지나도 완료가 아니다.
 * ⚠️ 예약이 만들 때는 늘 `null`이다 — 방금 잡은 회의가 끝나 있을 리 없다.
 */
export type Meeting = MeetingDraft & {
  id: string;
  createdAt: string;
  /** 종료를 누른 시각(ISO). 안 눌렀으면 `null` */
  endedAt: string | null;
  /**
   * 종료 뒤 서버가 돌리는 AI 분석이 어디까지 갔는지.
   *
   * ⚠️ **회의 상태와 다른 축이다.** 종료를 누르면 회의는 곧바로 완료지만 요약·액션 추출은
   *    그때부터 몇 분 걸린다(WORKFLOW §3-3 4·5) — 이 값을 안 두면 아직 아무 산출물도 없는
   *    회의가 "완료 카드"로 열려 빈 회의록을 보게 된다(§정직성).
   * ⚠️ **프론트가 분석을 부르지 않는다.** 서버가 종료 처리 안에서 큐에 걸고 실패해도 재시도한다 —
   *    화면은 `/processing-status`를 폴링해 **읽기만** 한다.
   * ⚠️ 안 끝난 회의는 `null`이다 — 시작도 안 한 일에 대기라고 적으면 상태가 하나 늘어난다.
   */
  aiSummaryStatus: AiSummaryStatus | null;
};
