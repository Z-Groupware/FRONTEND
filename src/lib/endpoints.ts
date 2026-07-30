/**
 * 엔드포인트 레지스트리 — **환각 API 방지** (SETUP §10).
 *
 * 규칙: `fetch`/`serverApi`에 문자열 URL 리터럴을 쓰지 않는다. **반드시 `ep.*`만.**
 *   경로가 여기 없으면 "아직 합의되지 않은 경로"라는 뜻이다. 지어내지 말고 팀에 확인한다.
 *
 * ⚠️ 미확정(CONVENTIONS §23): ERD·API 스펙이 없어 아래는 **FE 제안 경로**다.
 *   BE 합류 시 **이 파일을 가장 먼저** 실제 컨트롤러와 맞춘다.
 */
export const ep = {
  /* 인증 */
  login: () => "/api/auth/login",
  logout: () => "/api/auth/logout",
  me: () => "/api/auth/me",

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
  members: () => "/api/members",
  member: (id: number) => `/api/members/${id}`,
  departments: () => "/api/departments",
  rooms: () => "/api/rooms",

  /* 기타 */
  notifications: () => "/api/notifications",
  /** SSE 스트림 — BFF가 중계하며 토큰을 주입한다 */
  notificationStream: () => "/api/notifications/stream",
  notices: () => "/api/notices",
  subscription: () => "/api/subscription",
} as const;
