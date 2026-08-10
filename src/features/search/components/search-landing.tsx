import type { SearchHome } from "../types";
import { BrowsePeople, BrowseProjects } from "./browse-lists";
import { RecentlyViewedGrid } from "./recently-viewed-grid";

interface SearchLandingProps {
  home: SearchHome;
}

/** 검색어가 없을 때의 화면 — 최근 검색어 → 최근 본 항목 → 둘러보기 순서(CLAUDE.md §화면은 위에서 아래로) */
export function SearchLanding({ home }: SearchLandingProps) {
  const isEmpty =
    home.recentSearches.length === 0 &&
    home.recentlyViewed.length === 0 &&
    home.projects.length === 0 &&
    home.people.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-24 text-center">
        <p className="text-foreground text-[13px] leading-5 font-medium">
          아직 둘러본 것이 없습니다
        </p>
        <p className="text-muted-foreground text-[12px] leading-4">검색어를 입력해 찾아 주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <RecentlyViewedGrid items={home.recentlyViewed} />

      {/*
        ⚠️ **둘을 좌우로 나란히 둔다.** 세로로 쌓으면 짧은 목록 두 개가 화면을 길게 끌어
           스크롤이 생기는데, 정작 오른쪽은 통째로 비었다 — 둘 다 짧은 목록이라 나란히 서는 게 맞다.
        ⚠️ 좁아지면 세로로 돌아간다(`lg:`) — 한 줄에 둘을 욱여넣으면 이름이 잘린다.
      */}
      {/*
        ⚠️ **`items-start`가 있어야 한다.** 없으면 두 카드가 **같은 높이로 늘어나** 줄 수가
           적은 쪽(프로젝트 3개 vs 사람 4명) 아래가 통째로 빈다 — 카드가 내용이 아니라
           빈 자리를 담게 된다. 격자의 기본값이 `stretch`라 일부러 꺼야 한다.
      */}
      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-2">
        <BrowseProjects projects={home.projects} />
        <BrowsePeople people={home.people} />
      </div>
    </div>
  );
}
