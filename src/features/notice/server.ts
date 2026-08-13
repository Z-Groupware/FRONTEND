import "server-only";

import { requireAccessToken } from "@/features/auth/session";
import { ApiError, serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { type BeNotice, type BeNoticeSummary, toNotice, toNoticeSummary } from "./mapper";
import { countUnreadMockNotices, findMockNotice, listMockNotices } from "./mock/notices";
import type { Notice, NoticeSummary } from "./types";

/**
 * 워크벤치 공지 목록(`GET /api/notices`, NOTI-01) — **격리막**(CLAUDE.md). 목록엔 본문이
 * 필요 없어 요약만 내려준다(문서 규칙 — `content`를 안 담는다).
 */
export async function getNotices(): Promise<NoticeSummary[]> {
  if (isMock) {
    return listMockNotices().map((notice) => ({
      id: notice.id,
      title: notice.title,
      publishedAt: notice.publishedAt,
      isRead: notice.isRead,
    }));
  }

  const accessToken = await requireAccessToken();
  const { notices } = await serverApi<{ notices: BeNoticeSummary[] }>(ep.notices(), {
    accessToken,
  });
  return notices.map(toNoticeSummary);
}

/**
 * 공지 상세(`GET /api/notices/{noticeId}`, NOTI-02) — 격리막(CLAUDE.md). 없으면 `null`을
 * 돌려 화면이 404로 넘긴다.
 * ⚠️ 읽음 처리는 여기서 하지 않는다 — 조회는 부수효과가 없어야 한다. 읽음은 `markNoticeReadAction`이 한다.
 * ⚠️ **없음·삭제됨·타 회사를 구분하지 않는다**(NT-001, 문서 규칙) — 셋 다 404 하나로 와서
 *    `null`로 뭉뚱그린다. 구분해서 알려주면 다른 회사에 그 공지가 존재한다는 사실이 새어 나간다.
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  if (isMock) return findMockNotice(id);

  const accessToken = await requireAccessToken();
  try {
    const be = await serverApi<BeNotice>(ep.notice(Number(id)), { accessToken });
    return toNotice(be);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

/** 안 읽은 공지 수 — 사이드바 미읽음 점 표시용(0이면 점을 안 찍는다). */
export async function getUnreadNoticeCount(): Promise<number> {
  if (isMock) return countUnreadMockNotices();

  // ⚠️ 미구현 — API 스펙 확정 후 미읽음 수 경로로 fetch한다.
  throw new Error("공지 미읽음 수 API가 아직 연결되지 않았습니다.");
}
