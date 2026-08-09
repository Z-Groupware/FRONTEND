import type { SearchHome } from "../types";
import { BrowsePeople, BrowseProjects } from "./browse-lists";
import { RecentSearchChips } from "./recent-search-chips";
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
        <p className="text-foreground text-sm font-medium">아직 둘러볼 게 없어요</p>
        <p className="text-muted-foreground text-xs">검색어를 입력해 찾아보세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <RecentSearchChips entries={home.recentSearches} />
      <RecentlyViewedGrid items={home.recentlyViewed} />

      <BrowseProjects projects={home.projects} />
      <BrowsePeople people={home.people} />
    </div>
  );
}
