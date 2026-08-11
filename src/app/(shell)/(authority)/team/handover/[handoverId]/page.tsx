import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HANDOVER_TYPE_LABEL } from "@/constants/domain";
import { TeamHandoverAssignBoard } from "@/features/team-handover/components/team-handover-assign-board";
import { getTeamHandoverDetail } from "@/features/team-handover/server";
import { todayIso } from "@/lib/date";

export const metadata: Metadata = {
  title: "인수인계서 상세",
};

interface TeamHandoverDetailPageProps {
  params: Promise<{ handoverId: string }>;
}

export default async function TeamHandoverDetailPage({ params }: TeamHandoverDetailPageProps) {
  const { handoverId } = await params;
  const memberId = Number(handoverId);
  if (!Number.isInteger(memberId)) notFound();

  const handover = await getTeamHandoverDetail(memberId);
  if (!handover) notFound();

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[960px] flex-1 flex-col gap-5">
        <div>
          <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
            {handover.memberName} · {HANDOVER_TYPE_LABEL[handover.type]}
          </h2>
          <p className="text-muted-foreground mt-1 text-[13px] leading-5 tabular-nums">
            인계 액션 {handover.actionCount}건
          </p>
        </div>

        <TeamHandoverAssignBoard handover={handover} todayIso={todayIso()} />
      </div>
    </main>
  );
}
