import type { Metadata } from "next";

import { MyActionListView } from "@/features/action/components/my-action-list-view";
import { getMyActionsPage } from "@/features/action/server";

export const metadata: Metadata = {
  title: "내 액션",
};

// ⚠️ 로그인 전이라 실제 담당자를 알 수 없다 — 팀 대시보드 목과 같은 대표 인물(이하윤)로 대신한다.
//    세션이 붙으면 실연동 분기(server.ts)는 이 값을 안 쓰고 토큰의 본인 소유분만 받는다.
const MOCK_ASSIGNEE_NAME = "이하윤";

/**
 * ⚠️ **첫 페이지만 서버가 렌더**한다(CLAUDE.md §목록·페이지네이션) — 2페이지부터는
 *    `MyActionListView`가 스크롤 끝에서 서버 액션으로 이어 붙인다. 화면 전체를
 *    `use client`로 만들면 조회 전체가 클라이언트로 넘어간다(§핵심 4원칙 ①).
 */
export default async function MyActionsPage() {
  const firstPage = await getMyActionsPage(MOCK_ASSIGNEE_NAME, 0);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <MyActionListView
        initialItems={firstPage.items}
        initialPage={firstPage.page}
        initialTotalPages={firstPage.totalPages}
        initialTotalCount={firstPage.totalCount}
        assigneeName={MOCK_ASSIGNEE_NAME}
      />
    </main>
  );
}
