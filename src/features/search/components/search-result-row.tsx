import Link from "next/link";

import { ProfileAvatar } from "@/components/common/profile-avatar";
import { ProjectTag } from "@/components/common/project-tag";
import { AUTHORITY_BADGE_CLASS, AUTHORITY_LABEL } from "@/constants/authority";
import { formatDate } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";
import { cn } from "@/lib/utils";

import type { SearchResultItem } from "../types";
import { KindBadge } from "./kind-badge";
import { MatchText } from "./match-text";

/*
  ⚠️ **줄마다 낱장 카드다**(랜딩 목록과 같은 결). 구분선으로 이은 한 덩이는 값을 **비교하는**
     표의 생김새인데, 검색 결과는 훑다가 **하나를 고르는** 자리다.
*/
const ROW_SHAPE = "border-border bg-card flex items-start gap-3 rounded-xl border px-4 py-3.5";

interface SearchResultRowProps {
  item: SearchResultItem;
  keyword: string;
}

/**
 * 결과 한 줄 — 종류마다 제목·발췌·보조 정보가 달라 안에서 갈라 그린다. 순수 표시(+ 프로젝트만
 * 이동)라 서버에서 그린다.
 *
 * ⚠️ **프로젝트만 링크다.** 회의·액션 상세는 이 검색 목이 별도로 부여한 값이라 실제 상세
 *    화면의 id 체계와 안 이어져 있다(`recently-viewed-grid.tsx`와 같은 이유) — 프로젝트는
 *    실제 프로젝트 id를 그대로 쓰므로 `/app/projects/:id`가 유효하다.
 */
export function SearchResultRow({ item, keyword }: SearchResultRowProps) {
  const tag = tagOf(item);

  const content = (
    <>
      {/*
        ⚠️ **랜딩 목록과 같은 색 막대를 세운다.** 결과 줄만 없으니 검색 전과 후의 생김새가
           달랐다 — 같은 화면인데 훑는 눈이 다시 적응해야 한다.
      */}
      <span
        className="w-1 shrink-0 self-stretch rounded-full"
        /*
          ⚠️ 사람은 프로젝트 태그가 없다 — 그렇다고 비워 두면 그 줄만 왼쪽이 뚫려 보인다.
             **자기 아바타와 같은 색**을 쓴다(같은 팔레트라 사람마다 늘 같은 색이다).
        */
        style={{
          /* ⚠️ 아바타와 **같은 키**(`String(id)`)여야 색이 맞는다 — `use-profile-avatar`와 한 쌍이다 */
          backgroundColor: pickPaletteColor(tag ?? String(item.id)).solidColor,
        }}
        aria-hidden
      />
      <KindBadge kind={item.kind} />
      {/* ⚠️ 사람은 태그가 없다 — 대신 얼굴이 그 자리를 맡는다(랜딩 사람 목록과 같다) */}
      {item.kind === "PERSON" && <ProfileAvatar userId={item.id} size={26} />}

      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] leading-5 font-semibold">
          <MatchText text={rowTitle(item)} keyword={keyword} />
        </p>
        {rowSnippet(item) && (
          <p className="text-muted-foreground mt-1 truncate text-[12px] leading-4">
            <MatchText text={rowSnippet(item) ?? ""} keyword={keyword} />
          </p>
        )}
        <p className="text-muted-foreground/70 mt-1.5 flex items-center gap-2 text-[11px] leading-4">
          {/*
            ⚠️ **색 점 대신 태그 칩을 세운다.** 팔레트가 열한 색뿐이라 프로젝트가 겹치면
               점만으로는 어느 쪽인지 알 수 없다(§palette) — 칩은 색과 이름을 같이 들고 있다.
          */}
          <ProjectTagOf item={item} />
          <MatchText text={rowMeta(item)} keyword={keyword} />
        </p>
      </div>

      {item.kind === "PERSON" && (
        <span
          className={cn(
            AUTHORITY_BADGE_CLASS[item.authority],
            "shrink-0 rounded px-1.5 py-0.5 text-[11px] leading-4",
          )}
        >
          {AUTHORITY_LABEL[item.authority]}
        </span>
      )}
    </>
  );

  if (item.kind === "PROJECT") {
    return (
      <li>
        <Link
          href={`/app/projects/${item.id}`}
          className={cn(ROW_SHAPE, "hover:border-foreground/25 transition-colors")}
        >
          {content}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <div className={ROW_SHAPE}>{content}</div>
    </li>
  );
}

/** 이 결과가 딸린 프로젝트 태그 — 없으면 `null`(사람) */
function tagOf(item: SearchResultItem): string | null {
  if (item.kind === "MEETING" || item.kind === "ACTION") return item.projectTag;
  if (item.kind === "PROJECT") return item.tag;
  return null;
}

function ProjectTagOf({ item }: { item: SearchResultItem }) {
  const tag =
    item.kind === "MEETING" || item.kind === "ACTION"
      ? item.projectTag
      : item.kind === "PROJECT"
        ? item.tag
        : null;
  if (!tag) return null;

  return <ProjectTag tag={tag} />;
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
