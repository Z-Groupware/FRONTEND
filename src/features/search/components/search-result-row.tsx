import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";
import { formatDate } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { SearchResultItem } from "../types";
import { KindBadge } from "./kind-badge";
import { MatchText } from "./match-text";

const ROW_SHAPE = "flex items-start gap-3 px-6 py-4";

/** 결과 한 줄 — 종류마다 제목·발췌·보조 정보가 달라 안에서 갈라 그린다. 순수 표시라 서버에서 그린다. */
export function SearchResultRow({ item, keyword }: { item: SearchResultItem; keyword: string }) {
  return (
    <li className={cn(ROW_SHAPE, "border-border not-first:border-t")}>
      <KindBadge kind={item.kind} />

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] leading-5 font-semibold">
          <MatchText text={rowTitle(item)} keyword={keyword} />
        </p>
        {rowSnippet(item) && (
          <p className="text-muted-foreground mt-1 truncate text-[12px] leading-4">
            {rowSnippet(item)}
          </p>
        )}
        <p className="text-muted-foreground/70 mt-1.5 flex items-center gap-1.5 text-[11px] leading-4">
          <ProjectDot item={item} />
          {rowMeta(item)}
        </p>
      </div>

      {item.kind === "PERSON" && (
        <span
          className={cn(
            AUTHORITY_BADGE_CLASS[item.authority],
            "shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-4",
          )}
        >
          {AUTHORITY_LABEL[item.authority]}
        </span>
      )}
    </li>
  );
}

function ProjectDot({ item }: { item: SearchResultItem }) {
  const tag =
    item.kind === "MEETING" || item.kind === "ACTION"
      ? item.projectTag
      : item.kind === "PROJECT"
        ? item.tag
        : null;
  if (!tag) return null;

  const color = pickPaletteColor(tag);
  return (
    <span
      className="size-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color.solidColor }}
      aria-hidden
    />
  );
}

function rowTitle(item: SearchResultItem): string {
  switch (item.kind) {
    case "MEETING":
    case "ACTION":
      return item.title;
    case "PROJECT":
      return item.name;
    case "PERSON":
      return item.name;
  }
}

function rowSnippet(item: SearchResultItem): string | null {
  if (item.kind === "MEETING") return item.snippet;
  if (item.kind === "PERSON") return item.description;
  return null;
}

function rowMeta(item: SearchResultItem): string {
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
