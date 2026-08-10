import Link from "next/link";

import { ProjectTag } from "@/components/common/project-tag";
import { formatDate } from "@/lib/date";
import { pickPaletteColor } from "@/lib/palette";

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
      {/*
        ⚠️ **한 줄에 하나씩 쌓는다**(2026-08-10 바꿈). 두 칸 격자로 두니 제목 길이가 제각각인
           카드 넷이 어긋나 보였고, 아래 `프로젝트로 찾기`·`사람으로 찾기`가 이미 낱장 목록이라
           이 덩이만 격자여서 화면 안에서 혼자 놀았다 — 같은 화면은 같은 결로 읽혀야 한다.
        ⚠️ 대신 **한 줄로 눕힌다.** 세로로 쌓기만 하면 넷이 화면을 길게 끌므로, 제목·태그·
           보조값을 한 줄에 세워 줄 높이를 낮춘다(대시보드 회의 줄과 같은 결).
      */}
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={`${item.kind}-${item.id}`}>
            <RecentlyViewedCard item={item} />
          </li>
        ))}
      </ul>
    </SearchSection>
  );
}

/**
 * 보조값을 **둘로 가른다** — 왼쪽은 사람·프로젝트 같은 '누구/무엇', 오른쪽은 날짜·개수 같은 '언제/얼마'.
 *
 * ⚠️ 전에는 `A · B` 한 문장이라 통째로 오른쪽 끝에 붙었고, 제목이 짧은 줄은 **가운데가
 *    400px 넘게 비었다** — 눈이 그 사이를 건너뛰어야 했다.
 * ⚠️ 갈라서 각자 열에 세우면 줄 전체로 퍼지면서도 **열마다 축이 선다**(DESIGN §3).
 */
function metaParts(item: SearchResultItem): { lead: string; trail: string } {
  switch (item.kind) {
    case "MEETING":
      return { lead: item.projectName, trail: formatDate(item.meetingDate) };
    case "ACTION":
      return { lead: item.assigneeName, trail: `마감 ${formatDate(item.dueDate)}` };
    case "PROJECT":
      return { lead: `회의 ${item.meetingCount}건`, trail: `액션 ${item.actionCount}건` };
    case "PERSON":
      return { lead: item.team ?? "소속 없음", trail: "" };
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
  /*
    ⚠️ **프로젝트도 자기 태그와 색이 있다.** 전에는 "제목이 곧 프로젝트"라며 뺐는데, 그러면
       그 줄만 막대·칩 자리가 비어 **혼자 텅 빈 것처럼** 보였다 — 태그(`GOODS`)는 짧은
       코드고 제목은 긴 이름이라 서로 대신하지 못한다.
  */
  const tag =
    item.kind === "MEETING" || item.kind === "ACTION"
      ? item.projectTag
      : item.kind === "PROJECT"
        ? item.tag
        : null;
  const parts = metaParts(item);

  const inner = (
    <>
      {/*
        ⚠️ **왼쪽에 프로젝트 색 막대를 세운다.** 한 줄짜리 행이 넷 쌓이니 전부 같은 무게로
           읽혀 눈에 안 걸렸다 — 색 한 줄이 행마다 다른 표식이 되어 훑을 때 걸린다
           (대시보드 회의 줄이 쓰는 것과 같은 방식).
        ⚠️ **프로젝트 항목에도 선다.** 태그가 곧 제목이라 칩은 안 붙지만(아래 자리는 비운다)
           막대는 그 프로젝트 색이다 — 여기만 비우면 넷 중 하나에 표식이 없어 오히려 튄다.
      */}
      <span
        /* ⚠️ `h-full`은 부모 높이가 auto라 0이 된다 — 늘어나야 하므로 `self-stretch`다 */
        className="w-1 shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: tag ? pickPaletteColor(tag).solidColor : "transparent" }}
        aria-hidden
      />
      <KindBadge kind={item.kind} />
      {/*
        ⚠️ **태그 자리를 고정한다.** 프로젝트 항목엔 태그가 없어서, 자리를 안 잡아 두면
           그 줄만 제목이 앞으로 당겨져 오와 열이 어긋난다.
      */}
      <span className="flex w-[76px] shrink-0 items-center">{tag && <ProjectTag tag={tag} />}</span>
      {/*
        ⚠️ **줄어들 수 있어야 말줄임이 듣는다**(2026-08-10 리뷰). `shrink-0 truncate`는 서로
           어긋나는 조합이라 — 못 줄이는 상자에는 넘칠 일이 없으니 `truncate`가 아무 일도
           안 한다 — 긴 제목이 그대로 카드를 밀고 나갔다. 줄어드는 쪽은 제목이다.
      */}
      <span className="text-foreground min-w-0 truncate text-[13px] leading-5 font-semibold">
        {title(item)}
      </span>
      {/*
        ⚠️ **제목 뒤에 이어 붙인다.** 오른쪽 끝에 고정 열로 세워 봤더니 제목과 너무 멀어
           한 줄인데 두 덩이로 읽혔다 — 눈이 가운데 빈 자리를 건너뛰어야 했다.
           검색 결과는 "무엇 · 어디 · 언제"가 한 문장처럼 이어져야 읽힌다.
        ⚠️ 그래서 제목도 `flex-1`이 아니다. 늘어나면 다시 벌어진다.
      */}
      <span className="text-muted-foreground min-w-0 shrink-0 truncate text-[12px] leading-4">
        {parts.lead}
        {parts.trail && <span className="px-1.5 opacity-50">·</span>}
        {parts.trail}
      </span>
    </>
  );

  /*
    ⚠️ **항목이 스스로 카드다.** 한때 바깥에 카드를 하나 더 두르고 이 안쪽은 면으로만
       갈랐는데(카드 안의 카드 금지 — §DESIGN 2), 바깥 카드를 걷어내면서 여기가 카드가 됐다.
       그래서 테두리·바탕(`bg-card`)이 다시 있다. 그림자는 `.app-shell .bg-card`가 얕게 깐다.
    ⚠️ 라운드는 `rounded-xl`(14px)이다. `2xl`(18px)은 화면을 나누는 **큰 카드**의 값이고,
       이건 그 안에 줄지어 서는 작은 카드라 한 단계 작다.
    ⚠️ 색 막대가 위아래로 꽉 차야 표식이 되므로 `items-stretch`다 — 가운데 정렬은 안쪽에서 한다.
  */
  const shape =
    "border-border bg-card flex items-stretch gap-2.5 rounded-xl border py-3 pr-4 pl-3 text-[13px] [&>*:not(:first-child)]:self-center";

  if (item.kind === "PROJECT") {
    return (
      <Link
        href={`/app/projects/${item.id}`}
        /* ⚠️ 누를 수 있는 것만 면이 짙어진다 — 넷 중 프로젝트 하나만 링크다 */
        className={`${shape} hover:border-foreground/25 transition-colors`}
      >
        {inner}
      </Link>
    );
  }

  return <div className={shape}>{inner}</div>;
}
