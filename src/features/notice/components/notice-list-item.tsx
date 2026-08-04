import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { formatNoticeDate } from "../format";
import type { NoticeSummary } from "../types";

/** 공지 목록 한 줄 — 누르면 상세로 간다. 순수 표시라 서버에서 그린다. */
export function NoticeListItem({ notice }: { notice: NoticeSummary }) {
  return (
    <Link
      href={`/app/notice/${notice.id}`}
      className="hover:bg-muted/40 focus-visible:ring-ring flex items-center gap-3 px-4 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {/*
        미읽음 점 — 읽었으면 자리는 남기고 숨긴다(줄이 밀리지 않게).
        색만으로 알리지 않도록 안 읽음일 때 스크린리더용 텍스트를 함께 둔다(CLAUDE.md §a11y).
      */}
      <span
        aria-hidden
        className={cn("bg-destructive size-2 shrink-0 rounded-full", notice.isRead && "invisible")}
      />
      {!notice.isRead && <span className="sr-only">안 읽음</span>}

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-sm font-semibold">{notice.title}</p>
        <p className="text-muted-foreground mt-1 text-[11px]">
          {formatNoticeDate(notice.publishedAt)}
        </p>
      </div>

      <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
    </Link>
  );
}
