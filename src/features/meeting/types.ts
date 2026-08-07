/**
 * 회의(Meeting) — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * ⚠️ **최소 스캐폴딩이다.** `/app/meeting`(목록·상세·캡처·AI 리뷰)은 별도 이슈다 — 지금은
 *    회의실 예약이 만드는 레코드 하나만 담는다(WORKFLOW.md §3-1: "회의실 예약 = 회의 개설"이
 *    하나의 동작이라, 예약만 저장하고 회의를 안 만들면 스펙과 어긋난다).
 */

import type { Authority } from "@/constants/authority";

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

/** 회의 한 건 — `MeetingDraft`에 서버가 채우는 두 필드(id·생성시각)만 더한다. */
export type Meeting = MeetingDraft & { id: string; createdAt: string };
