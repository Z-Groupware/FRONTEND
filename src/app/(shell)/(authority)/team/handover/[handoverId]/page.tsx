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
          {/*
            ⚠️ **화면에 실제로 담긴 수를 적는다**(2026-08-11). `actionCount`는 목록에서 온
               값이라 이 화면이 그리는 액션 수와 어긋나, 위에는 `3건`인데 아래는 `0/1건`이
               떴다 — 한 화면이 두 수를 말하면 어느 쪽도 못 믿는다(§정직성).
          */}
          <p className="text-muted-foreground mt-1 text-[13px] leading-5 tabular-nums">
            인계 액션 {handover.actions.length}건
          </p>
        </div>

        <TeamHandoverAssignBoard handover={handover} todayIso={todayIso()} />
      </div>
    </main>
  );
}
