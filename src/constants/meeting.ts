/**
 * 회의 · 캡처 · AI 요약 상수.
 *
 * ⚠️ 코드값은 **FE 제안**이다. 회의 도메인 담당자 문서를 받으면 여기부터 맞춘다
 *    (CLAUDE.md §연동 검증).
 */

export const MEETING_STATUS = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;
export type MeetingStatus = (typeof MEETING_STATUS)[keyof typeof MEETING_STATUS];

export const MEETING_STATUS_LABEL: Record<MeetingStatus, string> = {
  SCHEDULED: "예정",
  IN_PROGRESS: "진행중",
  DONE: "완료",
};

/** 캡처 세션 — 담당자만 조작 가능(권한 2축, lib/permission.ts) */
export const CAPTURE_STATUS = {
  IDLE: "IDLE",
  RECORDING: "RECORDING",
  SUBMITTING: "SUBMITTING",
  DONE: "DONE",
} as const;
export type CaptureStatus = (typeof CAPTURE_STATUS)[keyof typeof CAPTURE_STATUS];

/**
 * ⚠️ `REVIEWED`와 `DISTRIBUTED`는 다른 단계다. 요약은 **초안**까지이고,
 *    실제 액션은 검토 화면에서 [액션 분배 확정]을 눌러야 생긴다(CLAUDE.md §브라우저 API).
 */
export const AI_SUMMARY_STATUS = {
  PENDING: "PENDING",
  SUMMARIZING: "SUMMARIZING",
  REVIEWED: "REVIEWED",
  DISTRIBUTED: "DISTRIBUTED",
} as const;
export type AiSummaryStatus = (typeof AI_SUMMARY_STATUS)[keyof typeof AI_SUMMARY_STATUS];

export const AI_SUMMARY_STATUS_LABEL: Record<AiSummaryStatus, string> = {
  PENDING: "대기",
  SUMMARIZING: "요약 중",
  REVIEWED: "검토 완료",
  DISTRIBUTED: "분배 완료",
};

/*
  ⚠️ **초대 수락·거절 상수는 두지 않는다**(2026-08-07 제거). `MEETING_INVITE_STATUS`
     (미응답·참석·불참)가 정의만 되고 아무 데서도 안 쓰이고 있었는데, WORKFLOW 어디에도
     참석 응답 개념이 없다 — 예약은 **즉시 확정**이고(§3-1) 참석자는 지정될 뿐이며,
     열람 권한도 응답이 아니라 지정 여부로 판정한다(§3-2-1).
     남겨 두면 나중에 이걸 근거로 수락/거절 UI가 생긴다(§도메인 상수: 없는 걸 금지 문장으로만
     두면 누가 만든다). 회의 주제 enum을 같은 이유로 지운 것과 같은 처리다.
*/

/*
  ⚠️ 회의 주제(대주제/소주제) 고정 enum은 여기 없다(2026-08-07 제거) — WORKFLOW.md §3-1
     확정: "대주제 1개+소주제 1개 필수, 나머지는 추가/삭제 버튼으로 늘리고 줄이는" **자유 입력
     텍스트**다. 타입은 `features/rooms/types.ts`의 `MeetingTopicInput`(자유 텍스트 쌍)을 본다.
*/

/**
 * 회의 상태 배지 — **색이 아니라 명도**로 가른다(DESIGN §5).
 *
 * ⚠️ 한때 예정=파랑·진행중=초록이었다. 그건 "색을 써도 되는 자리" 표에 없는 색이고,
 *    같은 화면의 프로젝트 태그(팔레트 색)와 섞여 무엇을 구분하는 색인지 알 수 없었다.
 *    지금 도는 회의만 **채워서** 띄우고 나머지는 테두리만 둔다.
 * ⚠️ 목록 카드와 대시보드 위젯이 **같은 맵을 쓴다.** 두 벌로 두면 같은 상태가 화면마다
 *    다르게 보인다(§도메인 상수: 라벨·색은 한 곳).
 */
export const MEETING_STATUS_BADGE_CLASS: Record<MeetingStatus, string> = {
  SCHEDULED: "border-border text-muted-foreground",
  IN_PROGRESS: "border-foreground/35 bg-foreground/[0.06] text-foreground font-medium",
  DONE: "border-border/60 text-muted-foreground/70",
};
