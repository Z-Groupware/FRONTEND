import type { NoticeSummary } from "../types";
import { NoticeListItem } from "./notice-list-item";

/**
 * 공지 목록 — 카드 헤더(점+제목+우측 건수)는 DESIGN §2 카드 anatomy를 따른다.
 * 비어있으면 안내 문구로 대체한다(CLAUDE.md §정직성 · loading/error/empty).
 */
export function NoticeList({ notices }: { notices: NoticeSummary[] }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      <div className="flex items-baseline justify-between gap-3 px-7 pt-6 pb-3">
        <h2 className="flex items-center gap-2 text-[17px] leading-7 font-semibold tracking-[-0.3px]">
          <span className="bg-foreground size-2 rounded-full" aria-hidden />
          공지 목록
        </h2>
        <p className="text-muted-foreground text-xs">전체 {notices.length}개</p>
      </div>

      {notices.length === 0 ? (
        <div className="flex items-center justify-center p-10 text-center">
          <p className="text-muted-foreground text-sm">아직 등록된 공지가 없어요</p>
        </div>
      ) : (
        <ul className="border-border divide-border divide-y border-t">
          {notices.map((notice) => (
            <li key={notice.id}>
              <NoticeListItem notice={notice} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
