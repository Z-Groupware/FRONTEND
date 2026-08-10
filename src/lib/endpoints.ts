/**
 * 엔드포인트 레지스트리 — **환각 API 방지** (CONVENTIONS §5).
 *
 * 규칙: `fetch`/`serverApi`에 문자열 URL 리터럴을 쓰지 않는다. **반드시 `ep.*`만.**
 *   경로가 여기 없으면 "아직 합의되지 않은 경로"라는 뜻이다. 지어내지 말고 팀에 확인한다.
 *
 * ⚠️ 미확정(CONVENTIONS §21): ERD·API 스펙이 없어 아래는 **FE 제안 경로**다.
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

  /*
   * 캡처 — [확인] BE 실코드 대조(2026-08-10)
   *   `cap/presentation/api/{CaptureUploadController,CaptionController,CaptureQueryController}.java`
   *   `meeting/presentation/api/{CaptureSessionController,MeetingCompletionController}.java`
   *   `capture/presentation/api/AnalysisController.java`
   *
   * ⚠️ **접두사가 두 갈래다.** 캡처 세션(CAP-01·02·03·10)과 회의 종료(MEET-08)는 `/api/v1/`,
   *    자막·조각·분석은 `/api/`다. 보기 싫다고 통일하면 전부 404다 — BE의 컨트롤러
   *    `@RequestMapping`이 실제로 그렇게 갈려 있다.
   */
  captureSession: (meetingId: number) => `/api/v1/meetings/${meetingId}/capture-session`,
  captureSessionPause: (meetingId: number) => `/api/v1/meetings/${meetingId}/capture-session/pause`,
  captureSessionResume: (meetingId: number) =>
    `/api/v1/meetings/${meetingId}/capture-session/resume`,
  /** 회의 종료 + 분석 접수(MEET-08) — 분석은 **서버가** 큐에 건다, 프론트가 부르지 않는다 */
  meetingComplete: (meetingId: number) => `/api/v1/meetings/${meetingId}/complete`,

  /** 자막 청크 **배치** 전송(CAP-11)·전체 조회(CAP-12) */
  captions: (meetingId: number) => `/api/meetings/${meetingId}/captions`,
  /** 녹음 조각 presigned URL 배치 발급(CAP-04) */
  partsPresign: (meetingId: number) => `/api/meetings/${meetingId}/parts/presign`,
  /** 조각 업로드 완료 통보(CAP-07) — 이 호출 자체가 하트비트다 */
  partComplete: (meetingId: number, seq: number) =>
    `/api/meetings/${meetingId}/parts/${seq}/complete`,
  /** 어디까지 올라갔는지(CAP-08) — 새로고침·크래시 뒤 이어 올리기 */
  partsStatus: (meetingId: number) => `/api/meetings/${meetingId}/parts/status`,
  /** 진행 중 캡처(CAP-09) — 파라미터 없음, 토큰의 사람 기준으로 서버가 찾는다 */
  activeCapture: () => "/api/captures/active",
  /** AI 처리 상태(CAP-06) — 종료 뒤 폴링 */
  processingStatus: (meetingId: number) => `/api/meetings/${meetingId}/processing-status`,

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

  /* 시스템 운영자 */
  systemDashboard: () => "/api/system/dashboard",
} as const;
