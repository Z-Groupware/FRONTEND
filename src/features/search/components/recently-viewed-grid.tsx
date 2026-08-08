import Link from "next/link";

import { formatDate } from "@/lib/date";

import type { SearchResultItem } from "../types";
import { KindBadge } from "./kind-badge";

/**
 * 최근 본 항목 — 2열 카드. 순수 표시(+ 프로젝트만 이동)라 서버에서 그린다.
 *
 * ⚠️ **프로젝트만 링크다.** 회의·액션·사람 상세는 이 검색 목이 별도로 부여한 값이라
 *    실제 회의·액션 상세 화면의 id 체계와 안 이어져 있다 — 안 되는 이동을 만드느니
 *    지금은 정보만 보여준다(§명세에 없는 기능은 안 만든다). 연동되면 실제 id로 이어 붙인다.
 */
export function RecentlyViewedGrid({ items }: { items: SearchResultItem[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="text-muted-foreground mb-3 text-[12px] leading-4">최근 본 항목</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <RecentlyViewedCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function meta(item: SearchResultItem): string {
  switch (item.kind) {
    case "MEETING":
      return `${item.projectName} · ${formatDate(item.meetingDate)}`;
    case "ACTION":
      return `${item.assigneeName} · 마감 ${formatDate(item.dueDate)}`;
    case "PROJECT":
      return `회의 ${item.meetingCount}건 · 액션 ${item.actionCount}건`;
    case "PERSON":
      return item.team ?? "소속 없음";
  }
}

function title(item: SearchResultItem): string {
  switch (item.kind) {
    case "MEETING":
    case "ACTION":
      return item.title;
    case "PROJECT":
    case "PERSON":
      return item.name;
  }
}

function RecentlyViewedCard({ item }: { item: SearchResultItem }) {
  const inner = (
    <>
      <KindBadge kind={item.kind} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] leading-5 font-semibold">
          {title(item)}
        </p>
        <p className="text-muted-foreground mt-1 truncate text-[11px] leading-4">{meta(item)}</p>
      </div>
    </>
  );

  const shape = "border-border flex items-start gap-3 rounded-xl border p-4";

  if (item.kind === "PROJECT") {
    return (
      <Link
        href={`/app/projects/${item.id}`}
        className={`${shape} hover:bg-foreground/[0.03] transition-colors`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={shape}>{inner}</div>;
}
