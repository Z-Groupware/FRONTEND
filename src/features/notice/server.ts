import "server-only";

import { isMock } from "@/mocks/config";

import { MOCK_NOTICES } from "./mock/notices";
import type { Notice, NoticeSummary } from "./types";

/**
 * 워크벤치 공지 목록 — **격리막**(CLAUDE.md). 목록엔 본문이 필요 없어 요약만 내려준다.
 * 연동할 때 고칠 곳은 이 파일과 매퍼뿐이고 컴포넌트는 건드리지 않는다.
 */
export async function getNotices(): Promise<NoticeSummary[]> {
  if (isMock) {
    return MOCK_NOTICES.map((notice) => ({
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
 * ⚠️ 읽음 처리는 여기서 하지 않는다 — 조회는 부수효과가 없어야 한다. 읽음 반영은 후속 작업(Server Action).
 */
export async function getNoticeById(id: string): Promise<Notice | null> {
  if (isMock) return MOCK_NOTICES.find((notice) => notice.id === id) ?? null;

  // ⚠️ 미구현 — API 스펙 확정 후 공지 상세 경로로 fetch하고 매퍼로 UI 계약에 맞춘다.
  throw new Error("공지 상세 API가 아직 연결되지 않았습니다.");
}
