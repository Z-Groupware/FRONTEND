import "server-only";

import { isMock } from "@/mocks/config";

import { countUnreadMockNotices, findMockNotice, listMockNotices } from "./mock/notices";
import type { Notice, NoticeSummary } from "./types";

/**
 * 워크벤치 공지 목록 — **격리막**(CLAUDE.md). 목록엔 본문이 필요 없어 요약만 내려준다.
 * 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다.
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

  // ⚠️ 미구현 — API 스펙 확정 후 공지 목록 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("공지 목록 API가 아직 연결되지 않았습니다.");
}

/**
 * 공지 상세 — 격리막(CLAUDE.md). 없으면 `null`을 돌려 화면이 404로 넘긴다.
 * ⚠️ 읽음 처리는 여기서 하지 않는다 — 조회는 부수효과가 없어야 한다. 읽음은 `markNoticeReadAction`이 한다.
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  if (isMock) return findMockNotice(id);

  // ⚠️ 미구현 — API 스펙 확정 후 공지 상세 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("공지 상세 API가 아직 연결되지 않았습니다.");
}

/** 안 읽은 공지 수 — 사이드바 미읽음 점 표시용(0이면 점을 안 찍는다). */
export async function getUnreadNoticeCount(): Promise<number> {
  if (isMock) return countUnreadMockNotices();

  // ⚠️ 미구현 — API 스펙 확정 후 미읽음 수 경로로 fetch한다.
  throw new Error("공지 미읽음 수 API가 아직 연결되지 않았습니다.");
}
