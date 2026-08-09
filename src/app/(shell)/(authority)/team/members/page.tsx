import type { Metadata } from "next";

import { TeamMemberAccordionCard } from "@/features/team/members/components/team-member-accordion-card";
import { TeamMemberControls } from "@/features/team/members/components/team-member-controls";
import { parseTeamMemberFilter, parseTeamMemberSort } from "@/features/team/members/lib";
import { getTeamMemberStatuses } from "@/features/team/members/server";

export const metadata: Metadata = {
  title: "팀원 관리",
};

interface TeamMembersPageProps {
  searchParams: Promise<{ sort?: string; filter?: string }>;
}

/**
 * 팀원 관리 — 카드 아코디언(WORKFLOW.md §팀원 관리).
 * ⚠️ 팀원 ~6명 규모 가정 — 페이지네이션 없이 전부 렌더링한다.
 */
export default async function TeamMembersPage({ searchParams }: TeamMembersPageProps) {
  const params = await searchParams;
  const sort = parseTeamMemberSort(params.sort);
  const filter = parseTeamMemberFilter(params.filter);
  const members = await getTeamMemberStatuses(sort, filter);

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5">
        <div>
          <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">팀원 현황</h2>
          <p className="text-muted-foreground mt-1 text-[13px] leading-5">
            누가 과부하인지, 누구에게 일을 더 줄 수 있는지 확인해요.
          </p>
        </div>

        <TeamMemberControls activeSort={sort} activeFilter={filter} />

        {members.length === 0 ? (
          <div className="border-border bg-card rounded-2xl border px-7 py-10 text-center">
            <p className="text-muted-foreground text-[13px] leading-5">
              조건에 맞는 팀원이 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {members.map((member) => (
              <TeamMemberAccordionCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
