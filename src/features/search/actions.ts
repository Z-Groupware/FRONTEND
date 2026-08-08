"use server";

import { isMock } from "@/mocks/config";

import { addMockRecentSearch } from "./mock/recent-searches";

/**
 * 검색 기록 — 검색창에서 값을 확정(입력을 멈춘 뒤)했을 때 클라이언트가 부른다.
 * ⚠️ 화면에 결과를 돌려주지 않는다. 이 액션은 **기록만** 하고, 결과는 페이지가
 *    `?q=`로 다시 조회해서 보여준다 — 액션이 결과까지 들고 있으면 새로고침·직접 링크로
 *    들어왔을 때와 화면이 갈린다.
 */
export async function recordSearchAction(keyword: string): Promise<void> {
  const trimmed = keyword.trim();
  if (!trimmed) return;

  if (isMock) {
    addMockRecentSearch(trimmed, new Date().toISOString());
    return;
  }

  // ⚠️ 미구현 — API 스펙 확정 후 검색 기록 경로로 POST한다.
  throw new Error("검색 기록 API가 아직 연결되지 않았습니다.");
}
