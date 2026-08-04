import type { Notice, NoticeDraft } from "../types";

/**
 * ⚠️ 목 데이터 — BE 연동 전. **서버 프로세스 메모리에만 있다**(재시작하면 초기값으로 되돌아간다).
 * 작성·수정·읽음 Server Action이 이 배열을 직접 바꾼다 — 실제 DB 흉내다.
 * ⚠️ `isRead`도 목 값이다 — 로그인(세션)이 없어 "이 사용자가 읽음"이 아니라 **전역**으로 흉내 낸다(§정직성).
 *
 * ⚠️ 상태를 `globalThis`에 매단다 — dev의 HMR(코드 저장 시 모듈 재평가)로 `let`이 초기화되면
 *    방금 만든/읽은 공지가 사라진다. `globalThis`는 재평가를 넘어 살아남아 데모가 덜 튄다.
 *    (BE가 붙으면 이 파일은 사라지고 상태는 DB로 간다 — 이 트릭도 같이 사라진다.)
 */
interface NoticeStore {
  notices: Notice[];
  sequence: number;
}

const INITIAL: Notice[] = [
  {
    id: "notice-1",
    title: "회의실 예약과 참석 안내",
    body: "회의는 회의실 예약 화면에서만 개설할 수 있습니다. 예약이 확정되면 참석자에게 회의 개설 및 시작 전 안내가 표시됩니다.",
    publishedAt: "2026-08-03",
    isRead: false,
  },
];

const globalStore = globalThis as typeof globalThis & { __noticeStore?: NoticeStore };
const store: NoticeStore = (globalStore.__noticeStore ??= {
  notices: INITIAL,
  sequence: INITIAL.length,
});

export function listMockNotices(): Notice[] {
  return store.notices;
}

export function findMockNotice(id: string): Notice | null {
  return store.notices.find((notice) => notice.id === id) ?? null;
}

/** 안 읽은 공지 수 — 사이드바 미읽음 점·목록 표시가 같은 소스에서 센다. */
export function countUnreadMockNotices(): number {
  return store.notices.filter((notice) => !notice.isRead).length;
}

/** 읽음 처리 — 배열 안 항목을 직접 바꾼다(실제 DB 흉내). */
export function markMockNoticeRead(id: string): Notice | null {
  const notice = findMockNotice(id);
  if (!notice) return null;
  store.notices = store.notices.map((item) => (item.id === id ? { ...item, isRead: true } : item));
  return { ...notice, isRead: true };
}

/** 작성 — 최신 글이 위로 오도록 앞에 붙인다. `publishedAt`은 서버에서 계산해 넘긴다. */
export function addMockNotice(draft: NoticeDraft, publishedAt: string): Notice {
  const notice: Notice = {
    id: `notice-${++store.sequence}`,
    title: draft.title.trim(),
    body: draft.body.trim(),
    publishedAt,
    isRead: false,
  };
  store.notices = [notice, ...store.notices];
  return notice;
}

/** 수정 — 제목·내용만 바꾼다(발행일·읽음 상태는 유지). */
export function updateMockNotice(id: string, draft: NoticeDraft): Notice | null {
  const notice = findMockNotice(id);
  if (!notice) return null;
  const updated: Notice = { ...notice, title: draft.title.trim(), body: draft.body.trim() };
  store.notices = store.notices.map((item) => (item.id === id ? updated : item));
  return updated;
}
