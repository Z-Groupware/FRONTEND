"use server";

import { revalidatePath } from "next/cache";

import { isMock } from "@/mocks/config";

import { addMockRecentSearch } from "./mock/recent-searches";
import type { SearchKind } from "./types";

/**
 * 검색 기록 — 검색창에서 값을 확정(입력을 멈춘 뒤)했을 때 클라이언트가 부른다.
 * ⚠️ 화면에 결과를 돌려주지 않는다. 이 액션은 **기록만** 하고, 결과는 페이지가
 *    `?q=`로 다시 조회해서 보여준다 — 액션이 결과까지 들고 있으면 새로고침·직접 링크로
 *    들어왔을 때와 화면이 갈린다.
 * ⚠️ **호출부가 `void`로 던지고 결과를 안 본다**(`search-input.tsx`). 검색 기록 실패가
 *    검색 자체를 막을 이유는 없어 — 실패해도 조용히 넘어간다(최근 검색어 한 줄이 안 남을 뿐).
 * ⚠️ **실서버에서는 지금 아무 일도 안 한다** — 아래 주석 참고(BE에 기록 API가 없다, #422).
 */
export async function recordSearchAction(keyword: string): Promise<void> {
  const trimmed = keyword.trim();
  if (!trimmed) return;

  if (isMock) {
    addMockRecentSearch(trimmed, new Date().toISOString());
    // 랜딩(검색어 없음)이 최근 검색어를 보여주는 화면이라, 그 경로를 다시 검증하게 한다.
    revalidatePath("/app/search");
    return;
  }

  /*
    ⚠️ **실서버에는 적을 곳이 없다**(2026-08-13 실코드 대조, #422). `SearchController`의 매핑은
       `GET /api/v1/search` 하나뿐이라 `POST .../recent-queries`는 404다 — 매번 404를 내고
       조용히 삼키면 남는 건 "기록되고 있다"는 착각뿐이라 **부르지 않는다**.
    ⚠️ 대신 랜딩이 "최근 검색어는 아직 서버가 제공하지 않습니다"라고 밝힌다
       (`SearchHome.unavailable`) — 못 하는 걸 아무 말 없이 안 하는 것과는 다르다(§정직성).
    ⚠️ BE가 기록 API를 열면 이 함수 안만 되살린다(`ep.searchRecentQueries`는 남겨 뒀다).
  */
}

/**
 * 최근 본 항목 기록 — 검색/랜딩에서 결과 하나를 열 때(지금은 프로젝트만 실제 이동이라
 * 프로젝트 클릭에서만 불린다, `record-view-link.tsx`) 클라이언트가 부른다.
 * ⚠️ **이동을 막지 않는다.** 링크를 누른 김에 fire-and-forget으로 보내는 부가 기록이라,
 *    실패해도 페이지 이동은 그대로 진행된다(`recordSearchAction`과 같은 이유).
 * ⚠️ 목엔 대응하는 저장소가 없다 — `SearchHome.recentlyViewed`가 정적 목이라 클릭해도
 *    안 바뀐다(§정직한 목업: 없는 걸 있는 척 안 한다).
 */
/*
  ⚠️ **`POST /api/v1/search/recent-views`도 BE에 없다**(`recordSearchAction`과 같은 이유).
     링크를 누를 때마다 404를 한 번씩 내고 삼키느니 아무것도 안 보낸다.
  ⚠️ **호출부(`record-view-link.tsx`)와 인자는 그대로 둔다.** 기록이 되살아나는 날 이 함수 안만
     채우면 되고, 지금 링크 쪽을 걷어내면 나중에 클릭 지점을 화면마다 다시 찾아 심어야 한다 —
     그래서 지금은 안 쓰는 인자다(아래 규칙 해제는 그 뜻).
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function recordRecentViewAction(kind: SearchKind, id: number): Promise<void> {}
