/**
 * 엔드포인트 레지스트리 — **환각 API 방지** (CONVENTIONS §5).
 *
 * 규칙: `fetch`/`serverApi`에 문자열 URL 리터럴을 쓰지 않는다. **반드시 `ep.*`만.**
 *   경로가 여기 없으면 "아직 합의되지 않은 경로"라는 뜻이다. 지어내지 말고 팀에 확인한다.
 *
 * ⚠️ 아래 **[확인]** 표시가 붙은 경로는 BE 레포 실코드로 대조했다(2026-08-10).
 *   나머지는 아직 **FE 제안 경로**다 — 쓰기 전에 컨트롤러를 먼저 본다(§연동 검증).
 */
/** 목록 3종(`GET /api/projects`·`/api/actions`·`/api/team/actions`)이 공유하는 쿼리 파라미터. */
export interface ProjectListParams {
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  sort?: "dueDate" | "createdAt";
  order?: "asc" | "desc";
  page?: number;
  size?: number;
}

/** 개인 액션 목록만 갖는 `overdue` 필터가 추가된다. */
export interface ActionListParams extends ProjectListParams {
  overdue?: boolean;
  /**
   * 값을 주면 호출자 본인이 아니라 **그 팀원의** 목록을 대신 조회한다(2026-08-11 추가,
   * 이홍근 요청 — 팀원 관리 화면). LEADER 전용, 같은 팀 소속만 — [확인] `ActionController.java`.
   */
  assigneeMemberId?: number;
}

/** `undefined`·`null` 값은 쿼리에서 빠진다 — 서버 기본값을 그대로 쓰게 둔다. */
function toQuery(params: object | undefined): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null,
  );
  if (entries.length === 0) return "";
  const search = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  return `?${search.toString()}`;
}

export const ep = {
  /* 인증 — [확인] identity/auth/presentation/api/AuthController.java */
  login: () => "/api/auth/login",
  refresh: () => "/api/auth/refresh",
  logout: () => "/api/auth/logout",
  me: () => "/api/auth/me",

  /* 기업 — [확인] identity/company/presentation/api/CompanyController.java */
  companyLookup: () => "/api/companies/lookup",
  companyRegistrations: () => "/api/companies/registrations",
  companyMe: () => "/api/companies/me",
  companyOnboarding: () => "/api/companies/me/onboarding",

  /*
   * 회의 — [확인] BE 실코드 대조(2026-08-12, 커밋 `51b5482f` "회의·회의실·공지사항 API 경로 통일" 리팩터 반영)
   *   `meeting/presentation/api/{MeetingController,MeetingListController,MeetingDetailController}.java`
   *
   * ⚠️ **`/api/v1/` 접두사는 폐기됐다**(2026-08-12, 커밋 `51b5482f`) — 그 전에 붙였던 v1은
   *    이제 전부 404다. 캡처 전용 조회는 없다 — 캡처 화면도 상세(MEET-04)를 쓴다(§환각 API 방지).
   */
  meetings: () => "/api/meetings",
  /** 상세(MEET-04) — 캡처 진입도 이걸 쓴다. 없으면 404 `MT-001`, 열람 권한 없으면 403 `MT-011` */
  meeting: (id: number) => `/api/meetings/${id}`,
  /** 내 예정 회의(MEET-03, 구현 완료) — 대시보드 위젯용. `limit` 생략 시 서버 기본값(5, 최대 20). */
  meetingsUpcoming: (params?: { limit?: number }) => `/api/meetings/upcoming${toQuery(params)}`,
  /** 참석자 명단 교체(MEET-09, 구현 완료) — 전체 명단 교체(부분 추가·삭제 아님). */
  meetingAttendees: (meetingId: number) => `/api/meetings/${meetingId}/attendees`,

  /*
   * 캡처 — [확인] BE 실코드 대조(2026-08-12, 커밋 `51b5482f` "회의·회의실·공지사항 API 경로 통일" 리팩터 반영)
   *   `cap/presentation/api/{CaptureUploadController,CaptionController,CaptureQueryController}.java`
   *   `meeting/presentation/api/{CaptureSessionController,MeetingCompletionController}.java`
   *   `capture/presentation/api/AnalysisController.java`
   *
   * ⚠️ **`/api/v1/` 접두사는 폐기됐다**(2026-08-12, 커밋 `51b5482f`). 캡처 세션(CAP-01·02·03)과
   *    회의 종료(MEET-08)도 이제 자막·조각·분석과 똑같이 `/api/`만 쓴다 — v1을 되살리면 전부 404다.
   * ⚠️ **CAP-01(녹음 시작)이 예전 MEET-07(입장)을 흡수했다**(2026-08-12 정합성 감사 P0) — 이
   *    경로는 이제 `SCHEDULED → IN_PROGRESS` 전이와 캡처 세션 생성을 한 트랜잭션으로 한다.
   *    ⚠️ **아직 `status: spec`이다**(D도메인 명세 기준 미구현) — 흡수된 흐름에 맞춘 호출부
   *    (`capture/actions.ts`) 재설계는 별도 이슈다.
   * ⚠️ **CAP-09(이어받기)·CAP-10(세션 단독 조회)은 폐기됐다**(2026-08-12) — host 장애는
   *    참석자 이어받기가 아니라 host 본인 재접속으로 복구한다.
   */
  captureSession: (meetingId: number) => `/api/meetings/${meetingId}/capture-session`,
  captureSessionPause: (meetingId: number) => `/api/meetings/${meetingId}/capture-session/pause`,
  captureSessionResume: (meetingId: number) => `/api/meetings/${meetingId}/capture-session/resume`,
  /** 회의 종료 + 분석 접수(MEET-08, 구현 완료) — 분석은 **서버가** 큐에 건다, 프론트가 부르지 않는다 */
  meetingComplete: (meetingId: number) => `/api/meetings/${meetingId}/complete`,

  /** 자막 청크 **배치** 전송(CAP-11)·전체 조회(CAP-12) */
  captions: (meetingId: number) => `/api/meetings/${meetingId}/captions`,
  /**
   * 자막 실시간 구독(CAP-13) — **SSE 스트림이다**(JSON 단발 응답이 아니다).
   *
   * ⚠️ **구독 시점 이전 자막은 안 내려온다.** `captions`(CAP-12)로 먼저 채운 뒤 이어받는다 —
   *    순서를 뒤집으면 늦게 들어온 사람 화면의 앞부분이 통째로 빈다.
   * ⚠️ 이벤트 세 종류: `caption` · `participant` · `heartbeat`.
   */
  captionsStream: (meetingId: number) => `/api/meetings/${meetingId}/captions/stream`,
  /** 녹음 조각 presigned URL 배치 발급(CAP-04) */
  partsPresign: (meetingId: number) => `/api/meetings/${meetingId}/parts/presign`,
  /** 조각 업로드 완료 통보(CAP-07) — 이 호출 자체가 하트비트다 */
  partComplete: (meetingId: number, seq: number) =>
    `/api/meetings/${meetingId}/parts/${seq}/complete`,
  /** 어디까지 올라갔는지(CAP-08) — 새로고침·크래시 뒤 이어 올리기 */
  partsStatus: (meetingId: number) => `/api/meetings/${meetingId}/parts/status`,
  /** AI 처리 상태(CAP-06) — 종료 뒤 폴링 */
  processingStatus: (meetingId: number) => `/api/meetings/${meetingId}/processing-status`,

  /*
   * 액션 · 프로젝트 · 캘린더 — [확인] BE 실코드 대조(2026-08-10, 잇다 REST API 연동 가이드 최종본)
   *   `project/presentation/api/{ProjectController,ProjectAttachmentController}.java`
   *   `action/presentation/api/{ActionController,TeamActionController,MeetingActionController}.java`
   *   `calendar/presentation/api/{CalendarController,TodoController}.java`(경로 추정 — 컨트롤러
   *   클래스명은 아직 실코드로 못 봤다, `/api/calendar`·`/api/todos` 자체는 문서로 확인됨)
   *
   * 목록 3종(`projects`·`actions`·`teamActions`)은 `GET /api/projects` 등이 `PageResponse` 봉투로
   * 오므로 `page`/`size`/`status`/`sort`/`order` 쿼리를 여기서 조립한다 — 값이 없으면 그 파라미터
   * 자체를 안 붙인다(서버 기본값을 그대로 쓰게).
   */
  projects: (params?: ProjectListParams) => `/api/projects${toQuery(params)}`,
  project: (id: number) => `/api/projects/${id}`,
  projectStatusBulk: () => "/api/projects/status/bulk",
  projectTimeline: (id: number) => `/api/projects/${id}/timeline`,
  projectAttachmentUploadUrl: (projectId: number) =>
    `/api/projects/${projectId}/attachments/upload-url`,
  projectAttachmentConfirm: (projectId: number) => `/api/projects/${projectId}/attachments/confirm`,
  projectAttachmentDownloadUrl: (projectId: number, attachmentId: number) =>
    `/api/projects/${projectId}/attachments/${attachmentId}/download-url`,
  projectAttachment: (projectId: number, attachmentId: number) =>
    `/api/projects/${projectId}/attachments/${attachmentId}`,

  actions: (params?: ActionListParams) => `/api/actions${toQuery(params)}`,
  action: (id: number) => `/api/actions/${id}`,
  actionCompleteBulk: () => "/api/actions/complete/bulk",
  meetingActions: (meetingId: number) => `/api/meetings/${meetingId}/actions`,

  teamActions: (params?: ProjectListParams) => `/api/team/actions${toQuery(params)}`,
  teamAction: (id: number) => `/api/team/actions/${id}`,
  teamActionTimeline: (id: number) => `/api/team/actions/${id}?tab=timeline`,
  teamActionAttachmentDownloadUrl: (teamActionId: number, attachmentId: number) =>
    `/api/team/actions/${teamActionId}/attachments/${attachmentId}/download-url`,
  /** 팀 대시보드 KPI 4종(팀 액션·팀원 액션·내 액션·완료 액션) — [확인] PR #354 머지 완료(2026-08-11) */
  teamDashboardSummary: () => "/api/team/actions/dashboard-summary",
  /** 팀원 현황(이름·직급·역할·재직상태·담당 액션 수) — [확인] PR #354 머지 완료, LEADER 전용 */
  teamMembers: () => "/api/team/members",

  /** `month` 생략 시 이번 달(서버 기본값) */
  calendar: (month?: string) => `/api/calendar${toQuery(month ? { month } : undefined)}`,
  todos: () => "/api/todos",
  todoComplete: (id: number) => `/api/todos/${id}/complete`,

  /* 인수인계 */
  handovers: () => "/api/handovers",
  handover: (id: number) => `/api/handovers/${id}`,
  /** 상세 리치뷰(타임라인·회의맥락·수신자별 그룹) — BE 인수인계 문서(2026-08-10) §2. */
  handoverPackage: (id: number) => `/api/handovers/${id}/package`,
  /** 레거시 컴파일러 파생 인사이트 — 오프보딩 최종승인 뒤에만 채워짐(BE 인수인계 문서 §2). */
  handoverInsights: (id: number) => `/api/handovers/${id}/insights`,
  /** 건별 재배정 — 일괄 반영 엔드포인트가 아니다(락·멱등, §team-handover/actions.ts). */
  handoverReassignItem: (id: number, actionId: number) =>
    `/api/handovers/${id}/items/${actionId}/reassign`,
  handoverComplete: (id: number) => `/api/handovers/${id}/complete`,
  handoverFinalize: (id: number) => `/api/handovers/${id}/finalize`,
  handoverReject: (id: number) => `/api/handovers/${id}/reject`,

  /* 조직 */
  /* 조직 — [확인] identity/member/presentation/api/{Member,ManageMember}Controller.java */
  members: () => "/api/members",
  member: (id: number) => `/api/members/${id}`,
  /** 조직도 — OWNER·ADMIN 전용 */
  memberOrgChart: () => "/api/members/org-chart",
  /**
   * 관리자 겸직 토글 — **OWNER 전용**이고 경로가 따로다.
   *
   * ⚠️ 역할·직급 변경(`member`)에 `isAdmin`을 실어 보내면 BE가 400(`FIELD_NOT_ALLOWED`)으로
   *    막는다. 어드민이 자기를 복제하는 것을 끊으려고 일부러 갈라 둔 경로다.
   */
  memberAdmin: (id: number) => `/api/members/${id}/admin`,
  /** 계정 발급 — 첫 비밀번호는 서버가 메일로 보낸다 */
  manageMembers: () => "/api/manage/members",
  /**
   * 팀 — [확인] identity/team/presentation/api/TeamController.java
   *
   * ⚠️ **한 건씩 다룬다**(`POST`·`PATCH /{id}`·`DELETE /{id}`). 트리를 통째로 넣는
   *    `PUT`은 BE에 없다 — 화면은 통째로 저장하므로 부르는 쪽이 **차이를 계산해** 나눠 부른다.
   * ⚠️ 조회 응답에 `memberCount`가 들어 있다 — 사람이 딸린 팀을 못 지우는 판정에 그대로 쓴다.
   */
  teams: () => "/api/teams",
  team: (id: number) => `/api/teams/${id}`,
  /** 직급 — [확인] identity/position/presentation/api/PositionController.java */
  jobPositions: () => "/api/job-positions",
  jobPosition: (id: number) => `/api/job-positions/${id}`,
  departments: () => "/api/departments",

  /**
   * 회의실 — 도메인 문서(ROOM-01~05, 2026-08-12) 기준, **BE 실코드 미대조**(§연동 검증: 구현
   *   붙일 때 컨트롤러로 재확인한다).
   */
  meetingRooms: () => "/api/meeting-rooms",
  /** 회의실 한 건 수정(`PATCH`, ROOM-04)·비활성화(`DELETE`, ROOM-05)가 같은 경로를 쓴다. */
  meetingRoom: (id: number) => `/api/meeting-rooms/${id}`,
  /**
   * 회의실 주간(월~금) 슬롯 현황(ROOM-02). `meetingRoomId`는 필수, `date`는 생략하면 서버가
   * KST 오늘 기준 주를 채운다(§연동 검증 — 요청 축이 "회의실 1개 × 5일"로, 하루 단위 전체
   * 회의실 조회는 폐기됐다).
   */
  meetingRoomAvailability: (params: { meetingRoomId: number; date?: string }) =>
    `/api/meeting-rooms/availability${toQuery(params)}`,

  /* 기타 */
  notifications: () => "/api/notifications",
  /** SSE 스트림 — BFF가 중계하며 토큰을 주입한다 */
  notificationStream: () => "/api/notifications/stream",
  notices: () => "/api/notices",
  subscription: () => "/api/subscription",

  /**
   * 검색 — API 스펙 전달받음(2026-08-11), **BE 실코드 미대조**(§연동 검증: 문서와 코드가
   * 다르면 코드가 맞다 — 구현 붙일 때 컨트롤러로 재확인한다).
   */
  searchOverview: () => "/api/v1/search/overview",
  search: () => "/api/v1/search",
  searchRecentQueries: () => "/api/v1/search/recent-queries",
  searchRecentViews: () => "/api/v1/search/recent-views",

  /* 시스템 운영자 */
  systemDashboard: () => "/api/system/dashboard",
} as const;
