/**
 * 엔드포인트 레지스트리 — **환각 API 방지** (CONVENTIONS §5).
 *
 * 규칙: `fetch`/`serverApi`에 문자열 URL 리터럴을 쓰지 않는다. **반드시 `ep.*`만.**
 *   경로가 여기 없으면 "아직 합의되지 않은 경로"라는 뜻이다. 지어내지 말고 팀에 확인한다.
 *
 * ⚠️ 아래 **[확인]** 표시가 붙은 경로는 BE 레포 실코드로 대조했다(2026-08-10).
 *   나머지는 아직 **FE 제안 경로**다 — 쓰기 전에 컨트롤러를 먼저 본다(§연동 검증).
 */
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

  /* 회의 */
  meetings: () => "/api/meetings",
  meeting: (id: number) => `/api/meetings/${id}`,
  meetingCapture: (id: number) => `/api/meetings/${id}/capture`,
  meetingSummary: (id: number) => `/api/meetings/${id}/summary`,

  /* 액션 */
  actions: () => "/api/actions",
  action: (id: number) => `/api/actions/${id}`,

  /* 프로젝트 */
  projects: () => "/api/projects",
  project: (tag: string) => `/api/projects/${tag}`,

  /* 인수인계 */
  handovers: () => "/api/handovers",
  handover: (id: number) => `/api/handovers/${id}`,

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
  rooms: () => "/api/rooms",

  /* 기타 */
  notifications: () => "/api/notifications",
  /** SSE 스트림 — BFF가 중계하며 토큰을 주입한다 */
  notificationStream: () => "/api/notifications/stream",
  notices: () => "/api/notices",
  subscription: () => "/api/subscription",

  /* 시스템 운영자 */
  systemDashboard: () => "/api/system/dashboard",
} as const;
