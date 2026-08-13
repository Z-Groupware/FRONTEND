import type { NotificationType } from "@/constants/notification";

/**
 * 알림 UI 계약 — **화면은 이 모양만 안다**(§Mock → Live 격리막).
 *
 * BE가 실제로 무엇을 어떤 봉투에 담아 보내는지는 `event.ts`(매퍼)가 흡수한다. 스트림에
 * 분석 이벤트가 생기든 폴링으로 알아내든, 카드가 보는 것은 아래 `AnalysisTracking` 하나다 —
 * **소스가 바뀌어도 컴포넌트는 0줄 고친다.**
 */

/**
 * 상단 배너 한 줄(회의 개설·리마인더·취소·공지).
 *
 * ⚠️ **문구를 코드로 조립하지 않는다.** `message`는 BE가 만들어 보낸 한국어 문장 그대로다
 *    (`lib/api.ts` 주석과 같은 규칙) — 우리가 다시 쓰면 같은 사실을 두 곳이 말하게 된다.
 */
export interface BannerNotification {
  /**
   * 화면 목록 키.
   * ⚠️ **BE payload에 알림 id가 없다**(실코드 확인 — 저장된 알림의 id는 스트림에 안 실린다).
   *    그래서 `종류:대상id`로 만든다 — 재연결로 같은 알림이 다시 와도 한 줄로 접힌다
   *    (§목록: 이어 붙일 때 id로 중복을 거른다와 같은 이유).
   */
  id: string;
  type: NotificationType;
  /** BE가 보낸 문장 그대로 */
  message: string;
  /** 눌렀을 때 갈 곳. 대상을 모르면 `null`이고 그러면 링크가 아니라 문장만 남는다 */
  href: string | null;
}

/**
 * 우측 하단 지속형 카드의 상태.
 *
 * ⚠️ **`NOT_STARTED`가 여기 없다.** BE의 CAP-06 값은 4개지만 사람이 봐야 하는 사실은
 *    "아직인가 · 됐나 · 깨졌나 · 모르겠나" 넷이다. 종료 직후의 `NOT_STARTED`는 사람에게는
 *    그냥 「요약 중」이다(§도메인 상수: 파생값은 상태 필드가 아니라 계산).
 * ⚠️ **`UNAVAILABLE`을 없애지 않는다.** 폴링이 계속 실패하거나 상한을 넘겼을 때 스피너를
 *    계속 돌리면 화면이 거짓말을 한다 — 못 알아냈다고 말하고 [다시 시도]를 준다(§정직성).
 */
export const ANALYSIS_CARD_STATE = {
  RUNNING: "RUNNING",
  DONE: "DONE",
  FAILED: "FAILED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;
export type AnalysisCardState = (typeof ANALYSIS_CARD_STATE)[keyof typeof ANALYSIS_CARD_STATE];

/** 지금 쫓고 있는 회의 하나. 카드가 통째로 이 값을 그린다. */
export interface AnalysisTracking {
  meetingId: number;
  /** 카드에 적을 회의 제목 — 목록으로 튕긴 뒤에도 무엇이 도는지 알아야 한다 */
  title: string;
  state: AnalysisCardState;
  /** 쫓기 시작한 시각(epoch ms). 상한(`ANALYSIS_POLL_MAX_MS`)을 재는 자리다 */
  startedAt: number;
  /** 몇 번째 조회인지. 목 진행과 로그에 쓴다 */
  attempt: number;
  /** 연속 실패 횟수. 성공하면 0으로 돌아간다 */
  failures: number;
}
