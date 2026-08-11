import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeaderHandoverActionList } from "@/features/leader-handover/components/leader-handover-action-list";
import { LeaderHandoverAssignForm } from "@/features/leader-handover/components/leader-handover-assign-form";
import { getLeaderHandoverDetail } from "@/features/leader-handover/server";
import { getViewer } from "@/features/shell/viewer";
import { canManageLeaderHandovers } from "@/lib/permission";

export const metadata: Metadata = {
  title: "인수인계서 상세",
};

interface LeaderHandoverDetailPageProps {
  params: Promise<{ handoverId: string }>;
}

export default async function LeaderHandoverDetailPage({ params }: LeaderHandoverDetailPageProps) {
  const viewer = await getViewer();
  if (!canManageLeaderHandovers(viewer)) notFound();

  const { handoverId } = await params;
  const handover = await getLeaderHandoverDetail(handoverId);
  if (!handover) notFound();

  return (
    <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <div className="mx-auto flex w-full max-w-[960px] flex-col gap-5">
        <div>
          <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.4px]">
            {handover.title}
          </h2>
          <p className="text-muted-foreground mt-1 text-[13px] leading-5">
            {handover.formerLeaderName} · {handover.teamName}
          </p>
        </div>

        <LeaderHandoverAssignForm handover={handover} />
        <LeaderHandoverActionList actions={handover.actions} />
      </div>
    </main>
  );
}
