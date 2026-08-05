/**
 * 워크벤치 공지 — 격리막의 UI 계약(CLAUDE.md §Mock 격리막).
 * 컴포넌트는 이 타입만 알고, 목/실서버 분기는 `server.ts`가 끝낸다.
 */

/** 공지 한 건(본문 포함). 목록은 본문을 뺀 요약만 쓴다. */
export interface Notice {
  id: string;
  title: string;
  body: string;
  /** "YYYY-MM-DD" — 표시는 `formatNoticeDate`로 "2026년 8월 3일" 꼴로 바꾼다 */
  publishedAt: string;
  /** 이 사용자가 아직 안 읽었는지 — 미읽음 점 표시용(읽음 처리는 후속 작업) */
  isRead: boolean;
}

/** 목록 한 줄 — 본문은 상세에서만 필요하므로 뺀다. */
export type NoticeSummary = Omit<Notice, "body">;

/** 공지 작성·수정 폼 입력 — 화면과 서버가 **같은 스키마**로 검증한다(규칙이 두 벌이 되면 어긋난다). */
export interface NoticeDraft {
  title: string;
  body: string;
}

/** 칸별 검증 오류 — 비어 있으면 통과. */
export type NoticeFormErrors = Partial<Record<keyof NoticeDraft, string>>;
