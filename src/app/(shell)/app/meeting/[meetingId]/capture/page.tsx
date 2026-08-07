import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaptureClient } from "@/features/meeting/capture/capture-client";
import { getMeetingCapture } from "@/features/meeting/server";
import { getViewer } from "@/features/shell/viewer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "회의 진행",
};

/**
 * 캡처 — `/app/meeting/:id/capture` (WORKFLOW §3-3).
 *
 * 못 들어가는 세 경우가 **다른 화면**이다(§view-types):
 * - 없는 회의 → `notFound()`
 * - Host가 아님 → 참석자에게는 입장 개념이 없다(§3-2). 잠금이 아니라 다른 말이 필요하다.
 * - 이미 끝남 → 종료는 되돌릴 수 없다. 다시 녹음하려면 회의를 새로 열어야 한다.
 */
export default async function MeetingCapturePage({
  params,
}: {
  params: Promise<{ meetingId: string }>;
}) {
  const { meetingId } = await params;
  const viewer = await getViewer();
  const result = await getMeetingCapture(meetingId, viewer);

  if (result.kind === "notFound") notFound();

  if (result.kind !== "ok") {
    return (
      <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
        <div className="mx-auto w-full max-w-[1440px]">
          <section className="border-border bg-card rounded-2xl border px-7 py-14 text-center">
            <h2 className="text-[15px] leading-6 font-semibold">{result.title}</h2>
            <p className="text-muted-foreground pt-1 text-[13px] leading-5 break-keep">
              {result.kind === "notHost"
                ? "회의를 개설한 사람만 진행할 수 있습니다."
                : "이미 끝난 회의입니다. 종료한 회의는 다시 녹음할 수 없습니다."}
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto px-8 py-7">
      <CaptureClient meeting={result.meeting} />
    </main>
  );
}
