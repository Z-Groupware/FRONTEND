import type { Metadata } from "next";

import { TeamActionListView } from "@/features/action/components/team-action-list-view";
import { getTeamActionsPage } from "@/features/action/server";

export const metadata: Metadata = {
  title: "팀 액션",
};

/**
 * ⚠️ **첫 페이지만 서버가 렌더**한다(CLAUDE.md §목록·페이지네이션) — 2페이지부터는
 *    `TeamActionListView`가 스크롤 끝에서 서버 액션으로 이어 붙인다. 프로젝트별 묶기는
 *    이어 붙인 전체를 대상으로 화면이 매번 다시 한다(§mapper `groupTeamActionsByProject`).
 */
export default async function TeamActionPage() {
  const firstPage = await getTeamActionsPage(0);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <TeamActionListView
        initialItems={firstPage.items}
        initialPage={firstPage.page}
        initialTotalPages={firstPage.totalPages}
        initialTotalCount={firstPage.totalCount}
      />
    </main>
  );
}
