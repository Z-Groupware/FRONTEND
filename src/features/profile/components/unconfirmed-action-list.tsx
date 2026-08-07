import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { PendingReviewSummary } from "@/features/meeting/review/types";

interface UnconfirmedActionListProps {
  reviews: PendingReviewSummary[];
}

/**
 * 마이페이지 "미확정 액션" 탭 — **회의 제목으로 줄을 나눈다**(사용자 확정, 2026-08-07).
 * 부제는 "분배 확정지어야 할 액션 N건". 줄을 누르면 그 회의의 리뷰 화면으로 이동해
 * 그대로 이어서 처리한다(`/app/meeting/:id/review`, 새 화면을 안 만들고 재사용).
 */
export function UnconfirmedActionList({ reviews }: UnconfirmedActionListProps) {
  if (reviews.length === 0) {
    return (
      <div className="border-border bg-card rounded-2xl border px-7 py-10 text-center">
        <p className="text-muted-foreground text-[13px] leading-5">미확정 액션이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="border-border bg-card flex flex-col rounded-2xl border">
      {reviews.map((review) => (
        <Link
          key={review.meetingId}
          href={`/app/meeting/${review.meetingId}/review`}
          className="border-border hover:bg-muted/50 flex items-center justify-between gap-3 border-t px-7 py-4 transition-colors first:border-t-0"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate text-[13px] leading-5 font-medium">{review.meetingTitle}</p>
            <p className="text-muted-foreground text-[12px] leading-4 tabular-nums">
              분배 확정지어야 할 액션 {review.actionCount}건
            </p>
          </div>
          <ChevronRight className="text-muted-foreground/50 size-4 shrink-0" aria-hidden />
        </Link>
      ))}
    </div>
  );
}
