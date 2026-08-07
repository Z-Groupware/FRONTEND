import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MEETING_STATUS_LABEL } from "@/constants/meeting";
import { MeetingDetailView } from "@/features/meeting/components/meeting-detail-view";
import { getMeetingDetail } from "@/features/meeting/server";
import { getViewer } from "@/features/shell/viewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "회의 상세",
};

/**
 * 회의 상세 — **완료 회의만** 연다(WORKFLOW §3-2).
 *
 * 못 여는 세 경우가 **다른 화면**이다(§view-types):
 * - 없는 회의 → `notFound()`
 * - 권한 없음 → 잠금. **에러가 아니다**(§3-2-1) — 메타는 공개라 제목은 그대로 보여주고,
 *   내용만 "참석자만 열람 가능"으로 막는다(액션 상세의 잠금 툴팁과 같은 말).
 * - 완료 전 → 언제 열리는지 안내. 참석자에게 입장 개념이 없어서(§3-2) 버튼은 없다.
 */
export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const viewer = await getViewer();
  const result = await getMeetingDetail(meetingId, viewer);

  if (result.kind === "notFound") notFound();

  if (result.kind === "locked") {
    return (
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto w-full max-w-[1440px]">
          <section className="border-border bg-card rounded-2xl border px-7 py-14 text-center">
            <Lock className="text-muted-foreground/70 mx-auto size-6" aria-hidden />
            <h2 className="pt-3 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              {result.title}
            </h2>
            <p className="text-muted-foreground pt-1 text-[13px] leading-5">
              참석자만 열람 가능합니다.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (result.kind === "notDone") {
    return (
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto w-full max-w-[1440px]">
          <section className="border-border bg-card rounded-2xl border px-7 py-14 text-center">
            <h2 className="text-[17px] leading-7 font-semibold tracking-[-0.3px]">
              {result.title}
            </h2>
            <p className="text-muted-foreground pt-1 text-[13px] leading-5">
              {MEETING_STATUS_LABEL[result.status]} 회의입니다. 회의가 끝나면 기록과 산출물을 여기서
              볼 수 있습니다.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <MeetingDetailView detail={result.detail} />
    </main>
  );
}
