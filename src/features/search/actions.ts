"use server";

import { revalidatePath } from "next/cache";

import { requireAccessToken } from "@/features/auth/session";
import { serverApi } from "@/lib/api";
import { ep } from "@/lib/endpoints";
import { isMock } from "@/mocks/config";

import { addMockRecentSearch } from "./mock/recent-searches";

/**
 * 검색 기록 — 검색창에서 값을 확정(입력을 멈춘 뒤)했을 때 클라이언트가 부른다.
 * ⚠️ 화면에 결과를 돌려주지 않는다. 이 액션은 **기록만** 하고, 결과는 페이지가
 *    `?q=`로 다시 조회해서 보여준다 — 액션이 결과까지 들고 있으면 새로고침·직접 링크로
 *    들어왔을 때와 화면이 갈린다.
 * ⚠️ **호출부가 `void`로 던지고 결과를 안 본다**(`search-input.tsx`). 검색 기록 실패가
 *    검색 자체를 막을 이유는 없어 — 실패해도 조용히 넘어간다(최근 검색어 한 줄이 안 남을 뿐).
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

  /* [스펙 전달, BE 실코드 미대조] `POST /api/v1/search/recent-queries` — 몸통은 `{ query }` */
  try {
    const accessToken = await requireAccessToken();
    await serverApi<unknown>(ep.searchRecentQueries(), {
      method: "POST",
      accessToken,
      json: { query: trimmed },
    });
    revalidatePath("/app/search");
  } catch {
    // 위 주석대로 — 기록 실패를 검색 흐름에 되돌리지 않는다.
  }
}
