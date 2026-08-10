import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";

import type { NoticeSummary } from "../types";

/** 공지 목록 한 줄 — 누르면 상세로 간다. 순수 표시라 서버에서 그린다. */
export function NoticeListItem({ notice }: { notice: NoticeSummary }) {
  return (
    <Link
      href={`/app/notice/${notice.id}`}
      className="hover:bg-foreground/[0.04] focus-visible:ring-ring flex items-center gap-3 px-4 py-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {/*
        미읽음 점 — 읽었으면 자리는 남기고 숨긴다(줄이 밀리지 않게).
        `--destructive`(에러 전용)는 쓰지 않는다 — 안 읽음은 에러가 아니다(DESIGN §5).
        색만으로 알리지 않도록 안 읽음일 때 스크린리더용 텍스트를 함께 둔다(CLAUDE.md §a11y).
      */}
      <span
        aria-hidden
        className={cn("bg-foreground size-2 shrink-0 rounded-full", notice.isRead && "invisible")}
      />
      {!notice.isRead && <span className="sr-only">안 읽음</span>}

      {/*
        ⚠️ **제목을 제목답게 세운다.** 13px 반굵게로 두니 아래 날짜와 무게가 비슷해 한 덩이로
           뭉쳤다 — 목록에서 먼저 읽혀야 하는 건 제목이다. 카드 제목(17px) 바로 아래 단계인
           15px로 올린다.
        ⚠️ **날짜를 아래로 내리지 않고 오른쪽 끝에 세운다.** 아래에 두면 한 줄이 두 줄을 먹고,
           줄마다 제목 길이가 달라 날짜가 들쭉날쭉했다 — 오른쪽 고정이면 한 세로선에 선다.
      */}
      <span className="text-foreground min-w-0 flex-1 truncate text-[15px] leading-6 font-semibold">
        {notice.title}
      </span>

      <span className="text-muted-foreground shrink-0 text-[12px] leading-4 tabular-nums">
        {formatDate(notice.publishedAt)}
      </span>

      <ChevronRight className="text-muted-foreground/70 size-4 shrink-0" aria-hidden />
    </Link>
  );
}
