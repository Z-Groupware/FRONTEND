import Link from "next/link";

import { ProjectTag } from "@/components/common/project-tag";
import { formatDate } from "@/lib/date";

import type { SearchResultItem } from "../types";
import { KindBadge } from "./kind-badge";
import { SearchSection } from "./search-section";

interface RecentlyViewedGridProps {
  items: SearchResultItem[];
}

/**
 * 최근 본 항목 — 2열 카드. 순수 표시(+ 프로젝트만 이동)라 서버에서 그린다.
 *
 * ⚠️ **프로젝트만 링크다.** 회의·액션·사람 상세는 이 검색 목이 별도로 부여한 값이라
 *    실제 회의·액션 상세 화면의 id 체계와 안 이어져 있다 — 안 되는 이동을 만드느니
 *    지금은 정보만 보여준다(§명세에 없는 기능은 안 만든다). 연동되면 실제 id로 이어 붙인다.
 */
export function RecentlyViewedGrid({ items }: RecentlyViewedGridProps) {
  if (items.length === 0) return null;

  return (
    <SearchSection title="최근 본 항목" meta={`${items.length}건`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <RecentlyViewedCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </SearchSection>
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

interface RecentlyViewedCardProps {
  item: SearchResultItem;
}

function RecentlyViewedCard({ item }: RecentlyViewedCardProps) {
  const inner = (
    <>
      <KindBadge kind={item.kind} />
      <div className="min-w-0 flex-1">
        <p className="text-foreground truncate text-[13px] leading-5 font-semibold">
          {title(item)}
        </p>
        {/*
          ⚠️ **어느 프로젝트 것인지 칩으로 보여 준다.** 밑줄 문구에 프로젝트 이름이 글자로
             섞여 있어 훑을 때 안 보였다 — 칩은 색이 있어 눈에 먼저 걸린다.
          ⚠️ 프로젝트 카드 자신은 제목이 곧 프로젝트라 칩을 또 달지 않는다.
        */}
        <p className="text-muted-foreground mt-1.5 flex items-center gap-2 truncate text-[11px] leading-4">
          {/* ⚠️ 회의·액션은 `projectTag`, 프로젝트는 `tag`다 — 이름이 갈리므로 종류로 가른다 */}
          {(item.kind === "MEETING" || item.kind === "ACTION") && (
            <ProjectTag tag={item.projectTag} />
          )}
          <span className="truncate">{meta(item)}</span>
        </p>
      </div>
    </>
  );

  /*
    ⚠️ **같은 화면의 다른 카드와 같은 라운드를 쓴다**(`rounded-2xl`). 여기만 `xl`(18px)이라
       바로 아래 목록 카드(26px)와 모서리가 갈렸다 — 한 화면에 두 종류가 있으면 어느 쪽이
       규격인지 알 수 없다. 레포 전체도 `2xl`이 관례다.
  */
  /*
    ⚠️ **카드에 바탕을 준다**(`bg-card`). 테두리만 있던 때는 바탕이 셸과 같은 흰색이라
       카드가 아니라 그어 둔 네모로 보였다 — 같은 화면의 목록 카드는 이미 `bg-card`다.
    ⚠️ 그림자는 `.app-shell .bg-card`가 알아서 얕게 깐다(§디자인 토큰) — 여기서 따로 얹지 않는다.
  */
  /*
    ⚠️ **카드 안에 카드를 얹지 않는다**(§DESIGN 2). 바깥이 이제 카드라 여기까지 테두리를
       두르면 네모 안에 네모가 된다 — 옅은 면으로 갈라 두면 덩이는 보이면서 층은 하나다.
  */
  const shape = "bg-foreground/[0.03] flex items-start gap-3 rounded-xl p-4";

  if (item.kind === "PROJECT") {
    return (
      <Link
        href={`/app/projects/${item.id}`}
        /* ⚠️ 누를 수 있는 것만 면이 짙어진다 — 넷 중 프로젝트 하나만 링크다 */
        className={`${shape} hover:bg-foreground/[0.07] transition-colors`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={shape}>{inner}</div>;
}
