/**
 * BE shape → UI 계약 (§Mock 격리막). 컴포넌트는 이 파일을 모른다 — `server.ts`/`actions.ts`만 쓴다.
 * [확인] 공지 도메인 문서(NOTI-01~05) 기준 — BE 실코드는 아직 대조 전이다
 *   (§연동 검증: Swagger·구두 추측 금지, 문서와 코드가 다르면 코드가 맞다 — 구현 시 컨트롤러로 재확인).
 */

import type { NoticeSummary } from "./types";

/** `GET /api/notices`(NOTI-01) 배열 원소 — 목록엔 본문을 안 담는다(문서 규칙). */
export interface BeNoticeSummary {
  noticeId: number;
  title: string;
  createdAt: string;
}

/**
 * ⚠️ **`isRead`는 항상 `false`다.** NOTI-01 응답에 읽음 여부가 없다 — 알림(SSE)은 "새 공지가
 *    있다"만 밀어줄 뿐, 사용자별 읽음 상태는 아직 BE에 없는 값이다(팀 협의 항목, WORKFLOW.md).
 *    거짓으로 "안 읽음"을 채우는 게 아니라 **모를 때의 정직한 기본값**이다 — 그 필드가 생기면
 *    여기만 고친다.
 */
export function toNoticeSummary(be: BeNoticeSummary): NoticeSummary {
  return {
    id: String(be.noticeId),
    title: be.title,
    publishedAt: be.createdAt,
    isRead: false,
  };
}
